-- ============================================================================
-- FIX: log_and_evaluate_rehab_session RPC Function
-- Resolves PostgreSQL error 55000: record "v_next_phase" is not assigned yet
-- (The tuple structure of a not-yet-assigned record is indeterminate)
-- ============================================================================

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
  v_current_phase program_phases%ROWTYPE;
  v_next_phase program_phases%ROWTYPE;
  v_sessions_completed INTEGER;
  v_avg_pain NUMERIC(4,2);
  v_advanced BOOLEAN := false;
  v_completed_program BOOLEAN := false;
  v_requires_more_time BOOLEAN := false;
  v_recent_pains INTEGER[];
  v_log_id UUID;
  v_out_phase_id UUID;
  v_out_phase_order INTEGER;
  v_out_phase_title TEXT;
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
        v_out_phase_id := v_next_phase.id;
        v_out_phase_order := v_next_phase.phase_order;
        v_out_phase_title := v_next_phase.title;
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
    'current_phase_id', v_out_phase_id,
    'current_phase_order', v_out_phase_order,
    'current_phase_title', v_out_phase_title,
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
