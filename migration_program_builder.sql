-- ============================================================================
-- COMPLETE & SELF-CONTAINED REHABILITATION & PROGRAM BUILDER MIGRATION
-- Migration: migration_program_builder.sql
-- Fixes: ERROR: 42P01: relation "program_phases" does not exist
-- Idempotent: Safe to execute on both fresh and partially migrated databases.
-- ============================================================================

SET search_path = public;

-- Ensure UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. BASE TABLES: exercises, worksessions, worksession_exercises
-- Ensures inline worksession/exercise creation from the builder succeeds
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT DEFAULT 'General',
  equipment TEXT DEFAULT 'Bodyweight',
  instructions TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worksessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  modality TEXT DEFAULT 'Clinical Rehab',
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worksession_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worksession_id UUID NOT NULL REFERENCES worksessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  tracking_type TEXT DEFAULT 'reps',
  target_sets INTEGER DEFAULT 3,
  target_reps INTEGER DEFAULT 10,
  target_time INTEGER DEFAULT 45,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. TABLE: rehab_programs
-- High-level rehabilitation protocols (e.g., "Lower Back Resilience")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rehab_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_joint TEXT DEFAULT 'general',
  estimated_weeks INTEGER DEFAULT 6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABLE: program_phases (Must be created before phase_worksessions/logs)
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
-- 4. TABLE: user_enrollments
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
-- 5. TABLE: workout_session_logs
-- Logs completed sessions with recorded joint pain score (0-10) and phase link
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  program_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
  pain_score_recorded INTEGER CHECK (pain_score_recorded >= 0 AND pain_score_recorded <= 10),
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was previously created without them
ALTER TABLE workout_session_logs
  ADD COLUMN IF NOT EXISTS pain_score_recorded INTEGER CHECK (pain_score_recorded >= 0 AND pain_score_recorded <= 10),
  ADD COLUMN IF NOT EXISTS program_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

-- ----------------------------------------------------------------------------
-- 6. TABLE: builder_drafts
-- Stores debounced JSONB state so users never lose progress on app close
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builder_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_key TEXT NOT NULL DEFAULT 'active_program_builder',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_builder_draft UNIQUE (user_id, draft_key)
);

-- ----------------------------------------------------------------------------
-- 7. TABLE: phase_worksessions
-- Connects worksessions to sequential clinical phases within a program
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phase_worksessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES program_phases(id) ON DELETE CASCADE,
  worksession_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  day_name TEXT DEFAULT 'Day 1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_program_phases_prog_order ON program_phases(program_id, phase_order);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_status ON user_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workout_session_logs_eval ON workout_session_logs(user_id, program_phase_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_phase_worksessions_phase ON phase_worksessions(phase_id, order_index);
CREATE INDEX IF NOT EXISTS idx_builder_drafts_user ON builder_drafts(user_id, draft_key);

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE rehab_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_worksessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view rehab programs" ON rehab_programs;
CREATE POLICY "Public can view rehab programs" ON rehab_programs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Public can view program phases" ON program_phases;
CREATE POLICY "Public can view program phases" ON program_phases FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can view own enrollments" ON user_enrollments;
CREATE POLICY "Users can view own enrollments" ON user_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON user_enrollments;
CREATE POLICY "Users can insert own enrollments" ON user_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON user_enrollments;
CREATE POLICY "Users can update own enrollments" ON user_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own session logs" ON workout_session_logs;
CREATE POLICY "Users can view own session logs" ON workout_session_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own session logs" ON workout_session_logs;
CREATE POLICY "Users can insert own session logs" ON workout_session_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own drafts" ON builder_drafts;
CREATE POLICY "Users can manage own drafts" ON builder_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view phase worksessions" ON phase_worksessions;
CREATE POLICY "Public can view phase worksessions" ON phase_worksessions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can insert phase worksessions" ON phase_worksessions;
CREATE POLICY "Users can insert phase worksessions" ON phase_worksessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. RPC FUNCTION: save_builder_draft (Debounced Autosave)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION save_builder_draft(
  p_user_id UUID,
  p_draft_key TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO builder_drafts (user_id, draft_key, payload, updated_at)
  VALUES (p_user_id, p_draft_key, p_payload, now())
  ON CONFLICT (user_id, draft_key) DO UPDATE
  SET 
    payload = EXCLUDED.payload,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'saved_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION save_builder_draft TO authenticated;

-- ----------------------------------------------------------------------------
-- 11. RPC FUNCTION: publish_rehab_program (Transactional Canvas Publisher)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION publish_rehab_program(
  p_user_id UUID,
  p_program JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_id UUID;
  v_phase RECORD;
  v_phase_id UUID;
  v_ws RECORD;
  v_ws_id TEXT;
  v_ex RECORD;
  v_ex_id TEXT;
  v_order INTEGER;
  v_ws_order INTEGER;
BEGIN
  -- 1. Create or Update Rehab Program
  IF (p_program->>'id') IS NOT NULL AND (p_program->>'id') ~ '^[0-9a-fA-F-]{36}$' THEN
    v_program_id := (p_program->>'id')::UUID;
    UPDATE rehab_programs
    SET 
      title = COALESCE(p_program->>'title', 'Untitled Rehab Program'),
      description = p_program->>'description',
      target_joint = COALESCE(p_program->>'target_joint', 'general'),
      estimated_weeks = COALESCE((p_program->>'estimated_weeks')::INTEGER, 8),
      updated_at = now()
    WHERE id = v_program_id;
  ELSE
    INSERT INTO rehab_programs (
      title,
      description,
      target_joint,
      estimated_weeks,
      is_active
    ) VALUES (
      COALESCE(p_program->>'title', 'Untitled Rehab Program'),
      p_program->>'description',
      COALESCE(p_program->>'target_joint', 'general'),
      COALESCE((p_program->>'estimated_weeks')::INTEGER, 8),
      true
    ) RETURNING id INTO v_program_id;
  END IF;

  -- 2. Clean out old phase associations if updating existing program
  DELETE FROM program_phases WHERE program_id = v_program_id;

  -- 3. Loop through Phases
  v_order := 1;
  IF p_program->'phases' IS NOT NULL THEN
    FOR v_phase IN SELECT * FROM jsonb_array_elements(p_program->'phases')
    LOOP
      INSERT INTO program_phases (
        program_id,
        phase_order,
        title,
        description,
        required_sessions_to_pass,
        max_allowed_pain_score
      ) VALUES (
        v_program_id,
        v_order,
        COALESCE(v_phase.value->>'title', 'Phase ' || v_order),
        v_phase.value->>'description',
        COALESCE((v_phase.value->>'required_sessions_to_pass')::INTEGER, 8),
        COALESCE((v_phase.value->>'max_allowed_pain_score')::NUMERIC, 4.0)
      ) RETURNING id INTO v_phase_id;

      -- 4. Loop through Worksessions in this Phase
      v_ws_order := 0;
      IF v_phase.value->'worksessions' IS NOT NULL THEN
        FOR v_ws IN SELECT * FROM jsonb_array_elements(v_phase.value->'worksessions')
        LOOP
          v_ws_id := v_ws.value->>'id';

          -- If worksession was created new inline
          IF v_ws_id IS NULL OR v_ws_id LIKE 'temp-%' OR v_ws_id LIKE 'ws-%' OR (v_ws.value->>'is_new')::BOOLEAN = true THEN
            INSERT INTO worksessions (
              user_id,
              name,
              modality
            ) VALUES (
              p_user_id,
              COALESCE(v_ws.value->>'name', 'Rehab Worksession'),
              COALESCE(v_ws.value->>'modality', 'Clinical Rehab')
            ) RETURNING id::TEXT INTO v_ws_id;

            -- Add exercises if attached to new worksession
            IF v_ws.value->'exercises' IS NOT NULL THEN
              FOR v_ex IN SELECT * FROM jsonb_array_elements(v_ws.value->'exercises')
              LOOP
                v_ex_id := v_ex.value->>'id';
                -- If exercise was created new inline
                IF v_ex_id IS NULL OR v_ex_id LIKE 'temp-%' OR v_ex_id LIKE 'ex-%' OR (v_ex.value->>'is_new')::BOOLEAN = true THEN
                  INSERT INTO exercises (
                    name,
                    muscle_group,
                    equipment,
                    instructions,
                    user_id
                  ) VALUES (
                    COALESCE(v_ex.value->>'name', 'Custom Exercise'),
                    COALESCE(v_ex.value->>'muscle_group', 'General'),
                    COALESCE(v_ex.value->>'equipment', 'Bodyweight'),
                    v_ex.value->>'cue',
                    p_user_id
                  ) RETURNING id::TEXT INTO v_ex_id;
                END IF;

                -- Link exercise to worksession
                IF v_ex_id ~ '^[0-9a-fA-F-]{36}$' AND v_ws_id ~ '^[0-9a-fA-F-]{36}$' THEN
                  INSERT INTO worksession_exercises (
                    worksession_id,
                    exercise_id,
                    tracking_type,
                    target_sets,
                    target_reps,
                    target_time,
                    notes
                  ) VALUES (
                    v_ws_id::UUID,
                    v_ex_id::UUID,
                    COALESCE(v_ex.value->>'tracking_type', 'reps'),
                    COALESCE((v_ex.value->>'target_sets')::INTEGER, 3),
                    COALESCE((v_ex.value->>'target_reps')::INTEGER, 10),
                    COALESCE((v_ex.value->>'target_time')::INTEGER, 45),
                    v_ex.value->>'cue'
                  );
                END IF;
              END LOOP;
            END IF;
          END IF;

          -- Attach Worksession to Phase
          INSERT INTO phase_worksessions (
            phase_id,
            worksession_id,
            order_index,
            day_name
          ) VALUES (
            v_phase_id,
            v_ws_id,
            v_ws_order,
            COALESCE(v_ws.value->>'day_name', 'Day ' || (v_ws_order + 1))
          );

          v_ws_order := v_ws_order + 1;
        END LOOP;
      END IF;

      v_order := v_order + 1;
    END LOOP;
  END IF;

  -- 5. Clear draft upon successful publish
  DELETE FROM builder_drafts 
  WHERE user_id = p_user_id AND draft_key = 'active_program_builder';

  RETURN jsonb_build_object(
    'success', true,
    'program_id', v_program_id,
    'phases_count', v_order - 1,
    'message', 'Program and all nested phases published successfully!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION publish_rehab_program TO authenticated;

-- ----------------------------------------------------------------------------
-- 12. RPC FUNCTION: log_and_evaluate_rehab_session (Progression Gatekeeper)
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

  -- 6. Calculate average pain score over the LAST 3 sessions
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

  -- 7. PROGRESSION GATE EVALUATION
  IF v_sessions_completed >= v_current_phase.required_sessions_to_pass THEN
    IF v_avg_pain < v_current_phase.max_allowed_pain_score THEN
      -- Advance to next phase
      SELECT * INTO v_next_phase
      FROM program_phases
      WHERE program_id = v_current_phase.program_id
        AND phase_order = v_current_phase.phase_order + 1;

      IF FOUND THEN
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
      -- Quota met but pain too high
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
    -- Quota not met yet
    UPDATE user_enrollments
    SET 
      requires_more_time = false,
      updated_at = now()
    WHERE id = v_enrollment.id;

    v_advanced := false;
    v_completed_program := false;
    v_requires_more_time := false;
  END IF;

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

GRANT EXECUTE ON FUNCTION log_and_evaluate_rehab_session TO authenticated;

-- ----------------------------------------------------------------------------
-- 13. SEED STARTER PROGRAM: Lower Back Resilience
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_prog_id UUID;
BEGIN
  INSERT INTO rehab_programs (title, description, target_joint, estimated_weeks)
  VALUES (
    'Lower Back Resilience',
    'Phased, criteria-based lumbar spine rehabilitation targeting motor control, endurance, and loaded posterior chain strength.',
    'lumbar_spine',
    8
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_prog_id FROM rehab_programs WHERE title = 'Lower Back Resilience' LIMIT 1;

  IF v_prog_id IS NOT NULL THEN
    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id, 1,
      'Phase 1: Acute Decompression & McGill Big 3',
      'Desensitize neural pain triggers and restore isometric spinal stiffness using the McGill Big 3 (Curl-up, Side Bridge, Bird Dog).',
      8, 4.0
    ) ON CONFLICT (program_id, phase_order) DO UPDATE
      SET title = EXCLUDED.title, required_sessions_to_pass = EXCLUDED.required_sessions_to_pass, max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;

    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id, 2,
      'Phase 2: Loaded Motor Control & Anti-Extension',
      'Progress from static core stiffness to loaded hip hinge mechanics and anti-rotational resistance (Pallof press, suitcase carries).',
      10, 3.5
    ) ON CONFLICT (program_id, phase_order) DO UPDATE
      SET title = EXCLUDED.title, required_sessions_to_pass = EXCLUDED.required_sessions_to_pass, max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;

    INSERT INTO program_phases (program_id, phase_order, title, description, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (
      v_prog_id, 3,
      'Phase 3: Dynamic Plyometric & Rotational Resilience',
      'Recondition the athlete for high-velocity ground reaction forces, medicine ball rotational throws, and multi-planar return to sport.',
      12, 3.0
    ) ON CONFLICT (program_id, phase_order) DO UPDATE
      SET title = EXCLUDED.title, required_sessions_to_pass = EXCLUDED.required_sessions_to_pass, max_allowed_pain_score = EXCLUDED.max_allowed_pain_score;
  END IF;
END;
$$;
