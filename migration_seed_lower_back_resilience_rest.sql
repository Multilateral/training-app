-- Migration: Overwrite "Lower Back & Lumbar Spine Resilience (Postural Syndrome)" Seed Data
-- Target Supabase Project: nfzuvugwamzjsxngptta

DO $$
DECLARE
  v_program_id uuid;
  v_phase1_id uuid;
  v_phase2_id uuid;
  v_phase3_id uuid;
  v_worksession1_id uuid := 'efe1680f-5fa2-41e8-942a-5ca81f39f14e';
  v_worksession2_id uuid := 'f9a83730-0f90-4ebd-9cf6-c50f168ef323';
  v_worksession3_id uuid := '53d2ece6-fb45-41fc-a5e9-92c06905d57e';
BEGIN
  -- 1. Locate or upsert the main program
  SELECT id INTO v_program_id 
  FROM programs 
  WHERE title ILIKE '%Lower Back & Lumbar Spine Resilience%' OR title ILIKE '%Lower Back Resilience%'
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_program_id IS NULL THEN
    INSERT INTO programs (title, description, target_joint, estimated_weeks, is_active)
    VALUES (
      'Lower Back & Lumbar Spine Resilience (Postural Syndrome)',
      'Clinical progressive rehabilitation protocol targeting lumbar endurance, anti-rotational core stiffness, and functional hinge capacity.',
      'Lumbar Spine',
      12,
      true
    )
    RETURNING id INTO v_program_id;
  ELSE
    UPDATE programs 
    SET title = 'Lower Back & Lumbar Spine Resilience (Postural Syndrome)',
        updated_at = NOW()
    WHERE id = v_program_id;
  END IF;

  -- 2. Update / Insert Phase 1
  SELECT id INTO v_phase1_id 
  FROM program_phases 
  WHERE program_id = v_program_id AND phase_order = 1;

  IF v_phase1_id IS NULL THEN
    INSERT INTO program_phases (program_id, phase_order, title, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (v_program_id, 1, 'Motor Control & Baseline Endurance', 8, 3.0)
    RETURNING id INTO v_phase1_id;
  ELSE
    UPDATE program_phases 
    SET title = 'Motor Control & Baseline Endurance',
        required_sessions_to_pass = 8,
        max_allowed_pain_score = 3.0,
        updated_at = NOW()
    WHERE id = v_phase1_id;
  END IF;

  -- 3. Update / Insert Phase 2
  SELECT id INTO v_phase2_id 
  FROM program_phases 
  WHERE program_id = v_program_id AND phase_order = 2;

  IF v_phase2_id IS NULL THEN
    INSERT INTO program_phases (program_id, phase_order, title, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (v_program_id, 2, 'Leverage & Anti-Rotation', 10, 2.0)
    RETURNING id INTO v_phase2_id;
  ELSE
    UPDATE program_phases 
    SET title = 'Leverage & Anti-Rotation',
        required_sessions_to_pass = 10,
        max_allowed_pain_score = 2.0,
        updated_at = NOW()
    WHERE id = v_phase2_id;
  END IF;

  -- 4. Update / Insert Phase 3
  SELECT id INTO v_phase3_id 
  FROM program_phases 
  WHERE program_id = v_program_id AND phase_order = 3;

  IF v_phase3_id IS NULL THEN
    INSERT INTO program_phases (program_id, phase_order, title, required_sessions_to_pass, max_allowed_pain_score)
    VALUES (v_program_id, 3, 'Load Integration & Functional Hinging', 12, 2.0)
    RETURNING id INTO v_phase3_id;
  ELSE
    UPDATE program_phases 
    SET title = 'Load Integration & Functional Hinging',
        required_sessions_to_pass = 12,
        max_allowed_pain_score = 2.0,
        updated_at = NOW()
    WHERE id = v_phase3_id;
  END IF;

  -- 5. Clear and re-populate worksession_exercises for Phase 1
  DELETE FROM worksession_exercises WHERE worksession_id = v_worksession1_id;

  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, order_index, target_sets, target_reps, target_time, tracking_type, inter_set_rest_seconds, transition_rest_seconds, notes
  ) VALUES
  (v_worksession1_id, (SELECT id FROM exercises WHERE name = 'Cat-Cow Stretch' LIMIT 1), 1, 2, 10, NULL, 'reps_only', 15, 30, '10 reps'),
  (v_worksession1_id, (SELECT id FROM exercises WHERE name = 'Psoas March (Supine)' LIMIT 1), 2, 2, 10, NULL, 'reps_only', 15, 30, '10 reps / side'),
  (v_worksession1_id, (SELECT id FROM exercises WHERE name = 'McGill Curl-up' LIMIT 1), 3, 3, NULL, 50, 'duration', 20, 30, '50s, 30s, 10s'),
  (v_worksession1_id, (SELECT id FROM exercises WHERE name = 'Bird-Dog' LIMIT 1), 4, 3, NULL, 50, 'duration', 20, 30, '50s, 30s, 10s'),
  (v_worksession1_id, (SELECT id FROM exercises WHERE name = 'Side Plank (Short Lever/Knees)' LIMIT 1), 5, 3, NULL, 30, 'duration', 20, 0, '30s / side');

  -- 6. Clear and re-populate worksession_exercises for Phase 2
  DELETE FROM worksession_exercises WHERE worksession_id = v_worksession2_id;

  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, order_index, target_sets, target_reps, target_time, tracking_type, inter_set_rest_seconds, transition_rest_seconds, notes
  ) VALUES
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = 'Cat-Cow Stretch' LIMIT 1), 1, 2, 10, NULL, 'reps_only', 15, 30, '10 reps'),
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = 'Active Straight Leg Raise' LIMIT 1), 2, 2, 12, NULL, 'reps_only', 15, 30, '12 reps / side'),
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = 'Bird-Dog Squares' LIMIT 1), 3, 3, NULL, 45, 'duration', 20, 30, '45s / side'),
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = 'Rolling Side Planks' LIMIT 1), 4, 3, NULL, 60, 'duration', 30, 30, '60s total'),
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = 'Pallof Press (Isometric Hold)' LIMIT 1), 5, 3, NULL, 20, 'duration', 20, 30, '20s / side'),
  (v_worksession2_id, (SELECT id FROM exercises WHERE name = '90/90 Diaphragmatic Breathing' LIMIT 1), 6, 1, NULL, 120, 'duration', 0, 0, '120s');

  -- 7. Clear and re-populate worksession_exercises for Phase 3
  DELETE FROM worksession_exercises WHERE worksession_id = v_worksession3_id;

  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, order_index, target_sets, target_reps, target_time, tracking_type, inter_set_rest_seconds, transition_rest_seconds, notes
  ) VALUES
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = 'McGill Curl-up (Warmup)' LIMIT 1), 1, 1, NULL, 30, 'duration', 0, 30, '30s'),
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = 'Bird-Dog (Warmup)' LIMIT 1), 2, 1, NULL, 30, 'duration', 0, 30, '30s / side'),
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = 'Kettlebell Romanian Deadlift (RDL)' LIMIT 1), 3, 4, 8, NULL, 'weight_reps', 90, 60, '8 reps'),
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = 'Kettlebell Goblet Squat' LIMIT 1), 4, 3, 10, NULL, 'weight_reps', 90, 45, '10 reps'),
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = 'Suitcase Carries' LIMIT 1), 5, 3, 30, NULL, 'weight_distance', 30, 30, '30m / side'),
  (v_worksession3_id, (SELECT id FROM exercises WHERE name = '90/90 Diaphragmatic Breathing' LIMIT 1), 6, 1, NULL, 180, 'duration', 0, 0, '180s');

END $$;
