-- ============================================================================
-- MULTI-PHASE CRITERIA-BASED PROGRESSION SYSTEM FOR REHABILITATION PROGRAMS
-- Migration: migration_rehab_progression.sql
-- Compatible with Supabase (PostgreSQL 14+)
-- ============================================================================

-- Ensure UUID generation extension is active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLE: rehab_programs
-- High-level rehabilitation protocols (e.g., "Lower Back Resilience")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rehab_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_joint TEXT,                     -- e.g., 'lumbar_spine', 'patellar_tendon', 'ankle'
  estimated_weeks INTEGER DEFAULT 6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. TABLE: program_phases
-- Sequential clinical phases within a rehabilitation program
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES rehab_programs(id) ON DELETE CASCADE,
  phase_order INTEGER NOT NULL CHECK (phase_order > 0),
  title TEXT NOT NULL,
  description TEXT,
  required_sessions_to_pass INTEGER NOT NULL CHECK (required_sessions_to_pass > 0),
  max_allowed_pain_score NUMERIC(3,1) NOT NULL CHECK (max_allowed_pain_score >= 0.0 AND max_allowed_pain_score <= 10.0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_program_phase_order UNIQUE (program_id, phase_order)
);

-- ----------------------------------------------------------------------------
-- 3. TABLE: user_enrollments
-- Tracks user progression through a program and their active phase
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES rehab_programs(id) ON DELETE CASCADE,
  current_phase_id UUID NOT NULL REFERENCES program_phases(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  requires_more_time BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_active_program UNIQUE (user_id, program_id)
);

-- ----------------------------------------------------------------------------
-- 4. TABLE: workout_session_logs
-- Logs completed sessions with recorded joint pain score (0-10) and phase link
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,                       -- Client worksession identifier
  program_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
  pain_score_recorded INTEGER CHECK (pain_score_recorded >= 0 AND pain_score_recorded <= 10),
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was previously created
ALTER TABLE workout_session_logs
  ADD COLUMN IF NOT EXISTS pain_score_recorded INTEGER CHECK (pain_score_recorded >= 0 AND pain_score_recorded <= 10),
  ADD COLUMN IF NOT EXISTS program_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

-- ----------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_program_phases_prog_order 
  ON program_phases(program_id, phase_order);

CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_status 
  ON user_enrollments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_workout_session_logs_eval 
  ON workout_session_logs(user_id, program_phase_id, completed_at DESC);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE rehab_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_logs ENABLE ROW LEVEL SECURITY;

-- rehab_programs: Everyone can read
DROP POLICY IF EXISTS "Public can view rehab programs" ON rehab_programs;
CREATE POLICY "Public can view rehab programs"
  ON rehab_programs FOR SELECT
  TO authenticated, anon
  USING (true);

-- program_phases: Everyone can read
DROP POLICY IF EXISTS "Public can view program phases" ON program_phases;
CREATE POLICY "Public can view program phases"
  ON program_phases FOR SELECT
  TO authenticated, anon
  USING (true);

-- user_enrollments: Users manage their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON user_enrollments;
CREATE POLICY "Users can view own enrollments"
  ON user_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON user_enrollments;
CREATE POLICY "Users can insert own enrollments"
  ON user_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON user_enrollments;
CREATE POLICY "Users can update own enrollments"
  ON user_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- workout_session_logs: Users manage their own logs
DROP POLICY IF EXISTS "Users can view own session logs" ON workout_session_logs;
CREATE POLICY "Users can view own session logs"
  ON workout_session_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own session logs" ON workout_session_logs;
CREATE POLICY "Users can insert own session logs"
  ON workout_session_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. PROGRESSION GATEKEEPER DATABASE FUNCTION (RPC)
-- Evaluates session quota & average pain score over last 3 sessions.
-- Automatically advances user to next phase or sets requires_more_time flag.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_and_evaluate_rehab_session(
  p_user_id UUID,
  p_program_phase_id UUID,
  p_pain_score INTEGER,
  p_session_id TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_current_phase RECORD;
  v_next_phase RECORD;
  v_sessions_completed INTEGER;
  v_avg_pain NUMERIC(4,2);
  v_advanced BOOLEAN := false;
  v_completed_program BOOLEAN := false;
  v_requires_more_time BOOLEAN := false;
  v_recent_pains INTEGER[];
  v_log_id UUID;
BEGIN
  -- 1. Validate pain score range (0-10)
  IF p_pain_score < 0 OR p_pain_score > 10 THEN
    RAISE EXCEPTION 'Pain score must be an integer between 0 and 10. Received: %', p_pain_score;
  END IF;

  -- 2. Insert new session log
  INSERT INTO workout_session_logs (
    user_id,
    session_id,
    program_phase_id,
    pain_score_recorded,
    duration_minutes,
    notes,
    completed_at
  ) VALUES (
    p_user_id,
    p_session_id,
    p_program_phase_id,
    p_pain_score,
    p_duration_minutes,
    p_notes,
    now()
  ) RETURNING id INTO v_log_id;

  -- 3. Fetch user enrollment for this phase
  SELECT ue.*, rp.title AS program_title
  INTO v_enrollment
  FROM user_enrollments ue
  JOIN program_phases pp ON pp.id = ue.current_phase_id
  JOIN rehab_programs rp ON rp.id = ue.program_id
  WHERE ue.user_id = p_user_id
    AND ue.current_phase_id = p_program_phase_id
    AND ue.status = 'active';

  -- If not enrolled or phase mismatch, return log confirmation without gate evaluation
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'log_id', v_log_id,
      'evaluated', false,
      'message', 'Session logged successfully. User is not currently active in this phase.'
    );
  END IF;

  -- 4. Fetch current phase criteria
  SELECT * INTO v_current_phase
  FROM program_phases
  WHERE id = p_program_phase_id;

  -- 5. Count total completed sessions for this phase
  SELECT COUNT(*)::INTEGER
  INTO v_sessions_completed
  FROM workout_session_logs
  WHERE user_id = p_user_id
    AND program_phase_id = p_program_phase_id;

  -- 6. Calculate average pain score over the LAST 3 sessions (including this one)
  WITH recent_sessions AS (
    SELECT pain_score_recorded
    FROM workout_session_logs
    WHERE user_id = p_user_id
      AND program_phase_id = p_program_phase_id
      AND pain_score_recorded IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 3
  )
  SELECT 
    COALESCE(ROUND(AVG(pain_score_recorded)::NUMERIC, 2), p_pain_score::NUMERIC),
    ARRAY_AGG(pain_score_recorded)
  INTO v_avg_pain, v_recent_pains
  FROM recent_sessions;

  -- --------------------------------------------------------------------------
  -- 7. PROGRESSION GATE EVALUATION
  -- Criterion 1: Sessions completed >= required_sessions_to_pass
  -- Criterion 2: Average pain over last 3 sessions < max_allowed_pain_score
  -- --------------------------------------------------------------------------
  IF v_sessions_completed >= v_current_phase.required_sessions_to_pass THEN

    IF v_avg_pain < v_current_phase.max_allowed_pain_score THEN
      -- BOTH CRITERIA MET -> ADVANCE TO NEXT PHASE
      SELECT * INTO v_next_phase
      FROM program_phases
      WHERE program_id = v_current_phase.program_id
        AND phase_order = v_current_phase.phase_order + 1;

      IF FOUND THEN
        -- Advance to next phase
        UPDATE user_enrollments
        SET 
          current_phase_id = v_next_phase.id,
          requires_more_time = false,
          updated_at = now()
        WHERE id = v_enrollment.id;

        v_advanced := true;
        v_completed_program := false;
        v_requires_more_time := false;
      ELSE
        -- Completed all phases in the program!
        UPDATE user_enrollments
        SET 
          status = 'completed',
          requires_more_time = false,
          completed_at = now(),
          updated_at = now()
        WHERE id = v_enrollment.id;

        v_advanced := true;
        v_completed_program := true;
        v_requires_more_time := false;
      END IF;

    ELSE
      -- Quota met BUT pain is too high -> requires more adaptation time
      UPDATE user_enrollments
      SET 
        requires_more_time = true,
        updated_at = now()
      WHERE id = v_enrollment.id;

      v_advanced := false;
      v_completed_program := false;
      v_requires_more_time := true;
    END IF;

  ELSE
    -- Quota not yet met -> maintain active phase progress
    UPDATE user_enrollments
    SET 
      requires_more_time = false,
      updated_at = now()
    WHERE id = v_enrollment.id;

    v_advanced := false;
    v_completed_program := false;
    v_requires_more_time := false;
  END IF;

  -- 8. Return structured payload to frontend
  RETURN jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'evaluated', true,
    'advanced', v_advanced,
    'completed_program', v_completed_program,
    'requires_more_time', v_requires_more_time,
    'current_phase_id', CASE WHEN v_advanced AND NOT v_completed_program THEN v_next_phase.id ELSE v_current_phase.id END,
    'current_phase_order', CASE WHEN v_advanced AND NOT v_completed_program THEN v_next_phase.phase_order ELSE v_current_phase.phase_order END,
    'current_phase_title', CASE WHEN v_advanced AND NOT v_completed_program THEN v_next_phase.title ELSE v_current_phase.title END,
    'sessions_completed', v_sessions_completed,
    'required_sessions', v_current_phase.required_sessions_to_pass,
    'avg_pain_score', v_avg_pain,
    'max_allowed_pain_score', v_current_phase.max_allowed_pain_score,
    'recent_pain_scores', v_recent_pains,
    'program_title', v_enrollment.program_title
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION log_and_evaluate_rehab_session TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. SEED DATA: "Lower Back Resilience" (Phases 1, 2, 3)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_prog_id UUID;
  v_phase1_id UUID;
  v_phase2_id UUID;
  v_phase3_id UUID;
BEGIN
  -- Insert or fetch Lower Back Resilience program
  INSERT INTO rehab_programs (title, description, target_joint, estimated_weeks)
  VALUES (
    'Lower Back Resilience',
    'Phased, criteria-based lumbar spine rehabilitation targeting motor control, endurance, and loaded posterior chain strength.',
    'lumbar_spine',
    8
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_prog_id 
  FROM rehab_programs 
  WHERE title = 'Lower Back Resilience' 
  LIMIT 1;

  IF v_prog_id IS NOT NULL THEN
    -- Phase 1
    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id,
      1,
      'Phase 1: Acute Decompression & McGill Big 3',
      'Desensitize neural pain triggers and restore isometric spinal stiffness using the McGill Big 3 (Curl-up, Side Bridge, Bird Dog).',
      8,
      4.0
    )
    ON CONFLICT (program_id, phase_order) DO UPDATE
    SET 
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
      max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;

    -- Phase 2
    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id,
      2,
      'Phase 2: Loaded Motor Control & Anti-Extension',
      'Progress from static core stiffness to loaded hip hinge mechanics and anti-rotational resistance (Pallof press, suitcase carries).',
      10,
      3.5
    )
    ON CONFLICT (program_id, phase_order) DO UPDATE
    SET 
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
      max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;

    -- Phase 3
    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id,
      3,
      'Phase 3: Dynamic Plyometric & Rotational Resilience',
      'Recondition the athlete for high-velocity ground reaction forces, medicine ball rotational throws, and multi-planar return to sport.',
      12,
      3.0
    )
    ON CONFLICT (program_id, phase_order) DO UPDATE
    SET 
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
      max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;

  END IF;
END;
$$;
