-- ============================================================================
-- MIGRATION: Weekly Schedule Planner & Rehab Phase Retention ("Keep Practicing")
-- ============================================================================

-- 1. Create user_weekly_schedules table
CREATE TABLE IF NOT EXISTS public.user_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  day_index SMALLINT NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout', 'rehab', 'sport', 'rest')),
  title TEXT NOT NULL,
  subtitle TEXT,
  worksession_id TEXT,
  program_id TEXT,
  exercise_id TEXT,
  bind_to_active_phase BOOLEAN DEFAULT true,
  target_duration_minutes INTEGER DEFAULT 45,
  intensity_target TEXT DEFAULT 'Moderate',
  notes TEXT,
  order_index SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_weekly_schedules_user_day
  ON public.user_weekly_schedules(user_id, day_index, order_index);

ALTER TABLE public.user_weekly_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own weekly schedule" ON public.user_weekly_schedules;
CREATE POLICY "Users manage own weekly schedule"
  ON public.user_weekly_schedules
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 2. Alter user_enrollments to support Phase Retention ("Keep Practicing") & Frequency Binding
ALTER TABLE public.user_enrollments
  ADD COLUMN IF NOT EXISTS is_phase_extended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extended_sessions_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progression_preference TEXT DEFAULT 'prompt_user'
    CHECK (progression_preference IN ('auto_advance', 'prompt_user', 'manual_hold')),
  ADD COLUMN IF NOT EXISTS custom_target_days_per_week INTEGER DEFAULT NULL;

-- 3. Update log_and_evaluate_rehab_session RPC to support user-controlled phase retention
DROP FUNCTION IF EXISTS public.log_and_evaluate_rehab_session(UUID, UUID, INTEGER, TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.log_and_evaluate_rehab_session(
  p_user_id UUID,
  p_program_phase_id UUID,
  p_pain_score INTEGER,
  p_session_id TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30,
  p_notes TEXT DEFAULT NULL,
  p_auto_advance BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_current_phase program_phases%ROWTYPE;
  v_next_phase program_phases%ROWTYPE;
  v_has_next_phase BOOLEAN := false;
  v_sessions_completed INTEGER;
  v_avg_pain NUMERIC(4,2);
  v_advanced BOOLEAN := false;
  v_eligible_to_advance BOOLEAN := false;
  v_completed_program BOOLEAN := false;
  v_requires_more_time BOOLEAN := false;
  v_is_phase_extended BOOLEAN := false;
  v_extended_sessions_count INTEGER := 0;
  v_recent_pains INTEGER[];
  v_log_id UUID;
  v_out_phase_id UUID;
  v_out_phase_order INTEGER;
  v_out_phase_title TEXT;
  v_next_phase_id UUID := NULL;
  v_next_phase_order INTEGER := NULL;
  v_next_phase_title TEXT := NULL;
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
      'advanced', false,
      'eligible_to_advance', false,
      'message', 'Session logged successfully. User is not currently active in this phase.'
    );
  END IF;

  v_is_phase_extended := COALESCE(v_enrollment.is_phase_extended, false);
  v_extended_sessions_count := COALESCE(v_enrollment.extended_sessions_count, 0);

  -- 4. Fetch current phase criteria
  SELECT * INTO v_current_phase
  FROM program_phases
  WHERE id = p_program_phase_id;

  v_out_phase_id := v_current_phase.id;
  v_out_phase_order := v_current_phase.phase_order;
  v_out_phase_title := v_current_phase.title;

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

  -- 7. PROGRESSION GATE EVALUATION
  IF v_sessions_completed >= v_current_phase.required_sessions_to_pass THEN

    IF v_avg_pain <= v_current_phase.max_allowed_pain_score THEN
      -- Check if a next phase exists
      SELECT * INTO v_next_phase
      FROM program_phases
      WHERE program_id = v_current_phase.program_id
        AND phase_order = v_current_phase.phase_order + 1;

      IF FOUND THEN
        v_has_next_phase := true;
        v_next_phase_id := v_next_phase.id;
        v_next_phase_order := v_next_phase.phase_order;
        v_next_phase_title := v_next_phase.title;
      END IF;

      v_eligible_to_advance := true;

      IF p_auto_advance OR COALESCE(v_enrollment.progression_preference, 'prompt_user') = 'auto_advance' THEN
        IF v_has_next_phase THEN
          UPDATE user_enrollments
          SET 
            current_phase_id = v_next_phase.id,
            requires_more_time = false,
            is_phase_extended = false,
            extended_sessions_count = 0,
            updated_at = now()
          WHERE id = v_enrollment.id;

          v_advanced := true;
          v_completed_program := false;
          v_requires_more_time := false;
          v_is_phase_extended := false;
          v_out_phase_id := v_next_phase.id;
          v_out_phase_order := v_next_phase.phase_order;
          v_out_phase_title := v_next_phase.title;
        ELSE
          UPDATE user_enrollments
          SET 
            status = 'completed',
            requires_more_time = false,
            is_phase_extended = false,
            completed_at = now(),
            updated_at = now()
          WHERE id = v_enrollment.id;

          v_advanced := true;
          v_completed_program := true;
          v_requires_more_time := false;
        END IF;
      ELSE
        -- User preference is 'prompt_user' or 'manual_hold':
        -- Keep user in current phase until they confirm advancement or choose to keep practicing
        IF v_is_phase_extended THEN
          v_extended_sessions_count := v_extended_sessions_count + 1;
        END IF;

        UPDATE user_enrollments
        SET 
          requires_more_time = false,
          extended_sessions_count = v_extended_sessions_count,
          updated_at = now()
        WHERE id = v_enrollment.id;

        v_advanced := false;
        v_completed_program := false;
        v_requires_more_time := false;
      END IF;

    ELSE
      -- Quota met BUT pain is higher than threshold -> requires more adaptation time
      UPDATE user_enrollments
      SET 
        requires_more_time = true,
        updated_at = now()
      WHERE id = v_enrollment.id;

      v_advanced := false;
      v_eligible_to_advance := false;
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
    v_eligible_to_advance := false;
    v_completed_program := false;
    v_requires_more_time := false;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'evaluated', true,
    'advanced', v_advanced,
    'eligible_to_advance', v_eligible_to_advance,
    'completed_program', v_completed_program,
    'requires_more_time', v_requires_more_time,
    'is_phase_extended', v_is_phase_extended,
    'extended_sessions_count', v_extended_sessions_count,
    'current_phase_id', v_out_phase_id,
    'current_phase_order', v_out_phase_order,
    'current_phase_title', v_out_phase_title,
    'next_phase_id', v_next_phase_id,
    'next_phase_order', v_next_phase_order,
    'next_phase_title', v_next_phase_title,
    'sessions_completed', v_sessions_completed,
    'required_sessions', v_current_phase.required_sessions_to_pass,
    'avg_pain_score', v_avg_pain,
    'max_allowed_pain_score', v_current_phase.max_allowed_pain_score,
    'recent_pain_scores', v_recent_pains,
    'program_title', v_enrollment.program_title
  );
END;
$$;

-- 4. RPC: Explicitly advance user enrollment to the next rehab phase
CREATE OR REPLACE FUNCTION public.advance_rehab_phase(
  p_user_id UUID,
  p_enrollment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_current_phase program_phases%ROWTYPE;
  v_next_phase program_phases%ROWTYPE;
BEGIN
  SELECT * INTO v_enrollment
  FROM user_enrollments
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (p_enrollment_id IS NULL OR id = p_enrollment_id)
  ORDER BY started_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Active enrollment not found.');
  END IF;

  SELECT * INTO v_current_phase
  FROM program_phases
  WHERE id = v_enrollment.current_phase_id;

  SELECT * INTO v_next_phase
  FROM program_phases
  WHERE program_id = v_enrollment.program_id
    AND phase_order = v_current_phase.phase_order + 1;

  IF FOUND THEN
    UPDATE user_enrollments
    SET
      current_phase_id = v_next_phase.id,
      requires_more_time = false,
      is_phase_extended = false,
      extended_sessions_count = 0,
      progression_preference = 'prompt_user',
      updated_at = now()
    WHERE id = v_enrollment.id;

    RETURN jsonb_build_object(
      'success', true,
      'advanced', true,
      'completed_program', false,
      'new_phase_id', v_next_phase.id,
      'new_phase_order', v_next_phase.phase_order,
      'new_phase_title', v_next_phase.title
    );
  ELSE
    UPDATE user_enrollments
    SET
      status = 'completed',
      requires_more_time = false,
      is_phase_extended = false,
      completed_at = now(),
      updated_at = now()
    WHERE id = v_enrollment.id;

    RETURN jsonb_build_object(
      'success', true,
      'advanced', true,
      'completed_program', true
    );
  END IF;
END;
$$;

-- 5. RPC: Keep practicing current phase (User-controlled phase retention)
CREATE OR REPLACE FUNCTION public.extend_rehab_phase(
  p_user_id UUID,
  p_enrollment_id UUID DEFAULT NULL,
  p_additional_sessions INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_new_count INTEGER;
BEGIN
  SELECT * INTO v_enrollment
  FROM user_enrollments
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (p_enrollment_id IS NULL OR id = p_enrollment_id)
  ORDER BY started_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Active enrollment not found.');
  END IF;

  v_new_count := COALESCE(v_enrollment.extended_sessions_count, 0) + GREATEST(1, COALESCE(p_additional_sessions, 1));

  UPDATE user_enrollments
  SET
    is_phase_extended = true,
    extended_sessions_count = v_new_count,
    progression_preference = 'manual_hold',
    updated_at = now()
  WHERE id = v_enrollment.id;

  RETURN jsonb_build_object(
    'success', true,
    'is_phase_extended', true,
    'extended_sessions_count', v_new_count,
    'current_phase_id', v_enrollment.current_phase_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_and_evaluate_rehab_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_rehab_phase TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_rehab_phase TO authenticated;
