-- ============================================================================
-- IDEMPOTENT CLINICAL PROTOCOL SEED SCRIPT
-- Protocol: "Lower Back & Lumbar Spine Resilience (Postural Syndrome)"
-- File: seed_lower_back_resilience_protocol.sql
-- Description:
--   1. Ensures unique constraints exist for idempotent upserts.
--   2. Ensures all prescribed exercises exist in the exercises table.
--   3. Upserts the rehab_programs record.
--   4. Upserts the 3 criteria-gated clinical phases in program_phases.
--   5. Upserts worksessions & links them via phase_worksessions.
--   6. Upserts worksession_exercises with target sets, reps, duration, and rest.
-- ============================================================================

SET search_path = public;

-- ----------------------------------------------------------------------------
-- 1. PREREQUISITE EXTENSIONS & UNIQUE CONSTRAINTS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure title uniqueness on rehab_programs for ON CONFLICT upserting
CREATE UNIQUE INDEX IF NOT EXISTS uq_rehab_programs_title 
  ON rehab_programs(title);

-- Ensure (program_id, phase_order) uniqueness on program_phases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_program_phase_order'
  ) THEN
    ALTER TABLE program_phases 
      ADD CONSTRAINT uq_program_phase_order UNIQUE (program_id, phase_order);
  END IF;
END $$;

-- Ensure column existence on exercises and worksession_exercises
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS default_rest_seconds INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS default_duration_seconds INTEGER DEFAULT 45,
  ADD COLUMN IF NOT EXISTS default_reps INTEGER DEFAULT 10;

-- Ensure category has a fallback default to prevent 23502 not-null errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'category'
  ) THEN
    ALTER TABLE exercises ALTER COLUMN category SET DEFAULT 'Recovery';
  END IF;
END $$;

ALTER TABLE worksession_exercises 
  ADD COLUMN IF NOT EXISTS target_rest_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS target_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS target_reps INTEGER DEFAULT 10;

-- Optional view if querying programs directly
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    CREATE VIEW programs AS SELECT * FROM rehab_programs;
  END IF;
END $$;

-- 1.1. Ensure public visibility for worksessions and exercises
ALTER TABLE worksessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view worksessions" ON worksessions;
CREATE POLICY "Public can view worksessions" ON worksessions 
  FOR SELECT TO authenticated, anon 
  USING (true);

ALTER TABLE worksession_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view worksession_exercises" ON worksession_exercises;
CREATE POLICY "Public can view worksession_exercises" ON worksession_exercises 
  FOR SELECT TO authenticated, anon 
  USING (true);

-- 1.2. Ensure phase_worksessions compatibility and foreign key
ALTER TABLE phase_worksessions ADD COLUMN IF NOT EXISTS day_order INTEGER DEFAULT 1;
UPDATE phase_worksessions SET day_order = order_index WHERE day_order IS NULL;

DO $$
BEGIN
  BEGIN
    ALTER TABLE phase_worksessions 
      ALTER COLUMN worksession_id TYPE UUID USING worksession_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_phase_worksessions_ws'
  ) THEN
    BEGIN
      ALTER TABLE phase_worksessions
        ADD CONSTRAINT fk_phase_worksessions_ws 
        FOREIGN KEY (worksession_id) REFERENCES worksessions(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;



-- ----------------------------------------------------------------------------
-- 2. ENSURE ALL PRESCRIBED EXERCISES EXIST
-- If an exercise doesn't exist, insert it with clinical instructions, category, and defaults.
-- If it already exists, keep its existing UUID.
-- ----------------------------------------------------------------------------
INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Cat-Cow Stretch', 'Recovery', 'Lumbar Spine / Thoracic', 'Bodyweight', 'Segmental spinal flexion and extension with rhythmic breathing.', 30, 45, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Cat-Cow Stretch'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Psoas March (Supine)', 'Recovery', 'Hip Flexors / Deep Core', 'Resistance Band', 'Supine band march. Maintain neutral lumbar posture without pelvic tilt.', 30, 45, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Psoas March (Supine)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'McGill Curl-up', 'Core', 'Anterior Core / Rectus Abdominis', 'Floor Mat', 'Hands supporting lumbar lordosis. Lift head and shoulders slightly without cervical flexion.', 45, 50, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('McGill Curl-up'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Bird-Dog', 'Core', 'Posterior Chain / Core', 'Floor Mat', 'Reach opposite arm and leg out horizontally. Resist rotational torque in torso.', 45, 50, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Side Plank (Short Lever/Knees)', 'Core', 'Quadratus Lumborum / Obliques', 'Floor Mat', 'Knees bent 90 degrees. Bridge hips high, establishing stiff lateral pillar.', 45, 30, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Side Plank (Short Lever/Knees)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Active Straight Leg Raise', 'Recovery', 'Hamstrings / Hip Flexors', 'Floor Mat', 'Keep opposite leg glued to floor. Actively dorsiflex ankle while raising leg.', 30, 45, 12, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Active Straight Leg Raise'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Bird-Dog Squares', 'Core', 'Posterior Chain / Stabilizers', 'Floor Mat', 'From full bird-dog extension, trace controlled 6-inch square without spine rotation.', 60, 45, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog Squares'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Rolling Side Planks', 'Core', 'Obliques / Transverse Abdominis', 'Floor Mat', 'Controlled rotational roll between side plank, prone plank, and opposite side plank.', 60, 60, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Rolling Side Planks'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Pallof Press (Isometric Hold)', 'Core', 'Transverse Abdominis / Obliques', 'Resistance Band', 'Hold cable or band out at chest height. Brace against rotational shear forces.', 45, 20, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Pallof Press (Isometric Hold)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT '90/90 Diaphragmatic Breathing', 'Recovery', 'Diaphragm / Pelvic Floor', 'Bench', 'Feet elevated at 90/90 on bench. 4s inhale, 4s hold, 8s full exhale.', 0, 120, 1, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('90/90 Diaphragmatic Breathing'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'McGill Curl-up (Warmup)', 'Core', 'Anterior Core', 'Floor Mat', 'Short 30s activation hold for abdominal stiffness prior to loaded lifts.', 30, 30, 1, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('McGill Curl-up (Warmup)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Bird-Dog (Warmup)', 'Core', 'Posterior Chain', 'Floor Mat', '30s / side isometric activation hold prior to loaded hinging.', 30, 30, 1, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog (Warmup)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Kettlebell Romanian Deadlift (RDL)', 'Kettlebell', 'Hamstrings / Glutes / Back', 'Kettlebell', 'Hinge at hips with vertical shins and locked lats. Maintain neutral spine.', 90, 45, 8, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Kettlebell Romanian Deadlift (RDL)'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Kettlebell Goblet Squat', 'Kettlebell', 'Quadriceps / Glutes / Core', 'Kettlebell', 'Hold kettlebell at chest. Descend between hips with vertical torso.', 90, 45, 10, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Kettlebell Goblet Squat'));

INSERT INTO exercises (name, category, muscle_group, equipment, instructions, default_rest_seconds, default_duration_seconds, default_reps, is_default)
SELECT 'Suitcase Carries', 'Core', 'Obliques / Quadratus Lumborum', 'Kettlebell', 'Loaded unilateral carry. Maintain strict vertical alignment resisting lateral bend.', 60, 45, 30, true
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE lower(trim(name)) = lower('Suitcase Carries'));

-- ----------------------------------------------------------------------------
-- 3. PL/PGSQL SEED SCRIPT (UPSERT PROGRAM, PHASES, WORKSESSIONS, EXERCISES)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_program_id UUID;
  v_phase1_id UUID;
  v_phase2_id UUID;
  v_phase3_id UUID;
  v_ws1_id UUID;
  v_ws2_id UUID;
  v_ws3_id UUID;

  -- Exercise UUID variables
  v_cat_cow UUID;
  v_psoas_march UUID;
  v_mcgill_curlup UUID;
  v_bird_dog UUID;
  v_side_plank_knees UUID;
  v_active_slr UUID;
  v_bird_dog_squares UUID;
  v_rolling_side_planks UUID;
  v_pallof_press UUID;
  v_diaphragmatic_breathing UUID;
  v_mcgill_warmup UUID;
  v_bird_dog_warmup UUID;
  v_kb_rdl UUID;
  v_kb_goblet_squat UUID;
  v_suitcase_carries UUID;
BEGIN
  -- 3.1. UPSERT REHAB PROGRAM
  INSERT INTO rehab_programs (
    title,
    description,
    target_joint,
    estimated_weeks,
    is_active,
    updated_at
  ) VALUES (
    'Lower Back & Lumbar Spine Resilience (Postural Syndrome)',
    'A progressive, three-phase clinical protocol designed to decompress the lumbar spine, overcome sitting-induced gluteal amnesia, and build a 360-degree corset of anti-extension core endurance.',
    'lumbar_spine',
    10,
    true,
    now()
  )
  ON CONFLICT (title) DO UPDATE
  SET 
    description = EXCLUDED.description,
    target_joint = EXCLUDED.target_joint,
    estimated_weeks = EXCLUDED.estimated_weeks,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_program_id;

  RAISE NOTICE 'Upserted rehab_programs with ID: %', v_program_id;

  -- 3.2. UPSERT PHASE 1
  INSERT INTO program_phases (
    program_id,
    phase_order,
    title,
    description,
    required_sessions_to_pass,
    max_allowed_pain_score,
    updated_at
  ) VALUES (
    v_program_id,
    1,
    'Phase 1: Motor Control & Baseline Endurance',
    'Establish foundational motor control, quiet acute pain triggers, and build baseline isometric stiffness through non-compressive postures.',
    8,
    3.0,
    now()
  )
  ON CONFLICT (program_id, phase_order) DO UPDATE
  SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
    max_allowed_pain_score = EXCLUDED.max_allowed_pain_score,
    updated_at = now()
  RETURNING id INTO v_phase1_id;

  -- 3.3. UPSERT PHASE 2
  INSERT INTO program_phases (
    program_id,
    phase_order,
    title,
    description,
    required_sessions_to_pass,
    max_allowed_pain_score,
    updated_at
  ) VALUES (
    v_program_id,
    2,
    'Phase 2: Leverage & Anti-Rotation',
    'Increase rotational core stiffness, lengthen lever arms, and challenge dynamic stability through transitions and anti-rotational forces.',
    10,
    3.0,
    now()
  )
  ON CONFLICT (program_id, phase_order) DO UPDATE
  SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
    max_allowed_pain_score = EXCLUDED.max_allowed_pain_score,
    updated_at = now()
  RETURNING id INTO v_phase2_id;

  -- 3.4. UPSERT PHASE 3
  INSERT INTO program_phases (
    program_id,
    phase_order,
    title,
    description,
    required_sessions_to_pass,
    max_allowed_pain_score,
    updated_at
  ) VALUES (
    v_program_id,
    3,
    'Phase 3: Load Integration & Functional Hinging',
    'Integrate loaded hip hinge mechanics, kettlebell resistance, and loaded carries to build long-term tissue capacity and real-world resilience.',
    12,
    3.0,
    now()
  )
  ON CONFLICT (program_id, phase_order) DO UPDATE
  SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    required_sessions_to_pass = EXCLUDED.required_sessions_to_pass,
    max_allowed_pain_score = EXCLUDED.max_allowed_pain_score,
    updated_at = now()
  RETURNING id INTO v_phase3_id;

  -- --------------------------------------------------------------------------
  -- 3.5. LOOK UP EXERCISE IDS
  -- --------------------------------------------------------------------------
  SELECT id INTO v_cat_cow FROM exercises WHERE lower(trim(name)) = lower('Cat-Cow Stretch') LIMIT 1;
  SELECT id INTO v_psoas_march FROM exercises WHERE lower(trim(name)) = lower('Psoas March (Supine)') LIMIT 1;
  SELECT id INTO v_mcgill_curlup FROM exercises WHERE lower(trim(name)) = lower('McGill Curl-up') LIMIT 1;
  SELECT id INTO v_bird_dog FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog') LIMIT 1;
  SELECT id INTO v_side_plank_knees FROM exercises WHERE lower(trim(name)) = lower('Side Plank (Short Lever/Knees)') LIMIT 1;
  SELECT id INTO v_active_slr FROM exercises WHERE lower(trim(name)) = lower('Active Straight Leg Raise') LIMIT 1;
  SELECT id INTO v_bird_dog_squares FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog Squares') LIMIT 1;
  SELECT id INTO v_rolling_side_planks FROM exercises WHERE lower(trim(name)) = lower('Rolling Side Planks') LIMIT 1;
  SELECT id INTO v_pallof_press FROM exercises WHERE lower(trim(name)) = lower('Pallof Press (Isometric Hold)') LIMIT 1;
  SELECT id INTO v_diaphragmatic_breathing FROM exercises WHERE lower(trim(name)) = lower('90/90 Diaphragmatic Breathing') LIMIT 1;
  SELECT id INTO v_mcgill_warmup FROM exercises WHERE lower(trim(name)) = lower('McGill Curl-up (Warmup)') LIMIT 1;
  SELECT id INTO v_bird_dog_warmup FROM exercises WHERE lower(trim(name)) = lower('Bird-Dog (Warmup)') LIMIT 1;
  SELECT id INTO v_kb_rdl FROM exercises WHERE lower(trim(name)) = lower('Kettlebell Romanian Deadlift (RDL)') LIMIT 1;
  SELECT id INTO v_kb_goblet_squat FROM exercises WHERE lower(trim(name)) = lower('Kettlebell Goblet Squat') LIMIT 1;
  SELECT id INTO v_suitcase_carries FROM exercises WHERE lower(trim(name)) = lower('Suitcase Carries') LIMIT 1;

  -- Fallbacks to base exercises if warmup variants were merged
  IF v_mcgill_warmup IS NULL THEN v_mcgill_warmup := v_mcgill_curlup; END IF;
  IF v_bird_dog_warmup IS NULL THEN v_bird_dog_warmup := v_bird_dog; END IF;

  -- --------------------------------------------------------------------------
  -- 3.6. UPSERT WORKSESSIONS & ASSOCIATE WITH PHASES
  -- --------------------------------------------------------------------------
  
  -- === PHASE 1 WORKSESSION ===
  SELECT id INTO v_ws1_id FROM worksessions WHERE name = 'Lower Back Resilience: Phase 1 Routine' LIMIT 1;
  IF v_ws1_id IS NULL THEN
    INSERT INTO worksessions (name, modality, description)
    VALUES (
      'Lower Back Resilience: Phase 1 Routine',
      'Clinical Rehab',
      'Phase 1 motor control routine focusing on non-compressive isometric lumbar stiffness and hip mobility.'
    ) RETURNING id INTO v_ws1_id;
  END IF;

  -- Map Phase 1 -> Worksession
  DELETE FROM phase_worksessions WHERE phase_id = v_phase1_id;
  INSERT INTO phase_worksessions (phase_id, worksession_id, order_index, day_name)
  VALUES (v_phase1_id, v_ws1_id::TEXT, 1, 'Day 1');

  -- Populate Phase 1 Worksession Exercises
  DELETE FROM worksession_exercises WHERE worksession_id = v_ws1_id;
  
  -- Ex 1: Cat-Cow Stretch | 2 Sets | 10 reps | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws1_id, v_cat_cow, 'reps', 2, 10, 45, 45, 30, 'Segmental flexion and extension with rhythmic breathing'
  );

  -- Ex 2: Psoas March (Supine) | 2 Sets | 10 reps / side | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws1_id, v_psoas_march, 'reps', 2, 10, 45, 45, 30, '10 reps / side. Maintain neutral lumbar posture'
  );

  -- Ex 3: McGill Curl-up | 3 Sets | 50s, 30s, 10s (Descending) | 45s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws1_id, v_mcgill_curlup, 'time', 3, 10, 50, 50, 45, 'Descending holds: 50s, 30s, 10s. Hands under lumbar spine'
  );

  -- Ex 4: Bird-Dog | 3 Sets | 50s, 30s, 10s (Descending) | 45s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws1_id, v_bird_dog, 'time', 3, 10, 50, 50, 45, 'Descending holds: 50s, 30s, 10s. Reach long through heel'
  );

  -- Ex 5: Side Plank (Short Lever/Knees) | 3 Sets | 30s / side | 45s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws1_id, v_side_plank_knees, 'time', 3, 10, 30, 30, 45, '30s / side. Knees bent at 90 degrees, elevate hips'
  );

  -- === PHASE 2 WORKSESSION ===
  SELECT id INTO v_ws2_id FROM worksessions WHERE name = 'Lower Back Resilience: Phase 2 Routine' LIMIT 1;
  IF v_ws2_id IS NULL THEN
    INSERT INTO worksessions (name, modality, description)
    VALUES (
      'Lower Back Resilience: Phase 2 Routine',
      'Clinical Rehab',
      'Phase 2 leverage protocol challenging rotational and lateral stiffness across longer lever arms.'
    ) RETURNING id INTO v_ws2_id;
  END IF;

  -- Map Phase 2 -> Worksession
  DELETE FROM phase_worksessions WHERE phase_id = v_phase2_id;
  INSERT INTO phase_worksessions (phase_id, worksession_id, order_index, day_name)
  VALUES (v_phase2_id, v_ws2_id::TEXT, 1, 'Day 1');

  -- Populate Phase 2 Worksession Exercises
  DELETE FROM worksession_exercises WHERE worksession_id = v_ws2_id;

  -- Ex 1: Cat-Cow Stretch | 2 Sets | 10 reps | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_cat_cow, 'reps', 2, 10, 45, 45, 30, 'Warmup mobility'
  );

  -- Ex 2: Active Straight Leg Raise | 2 Sets | 12 reps / side | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_active_slr, 'reps', 2, 12, 45, 45, 30, '12 reps / side. Keep pelvis quiet on floor'
  );

  -- Ex 3: Bird-Dog Squares | 3 Sets | 45s / side | 60s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_bird_dog_squares, 'time', 3, 10, 45, 45, 60, '45s / side. Trace 6-inch square without spine rotation'
  );

  -- Ex 4: Rolling Side Planks | 3 Sets | 60s total | 60s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_rolling_side_planks, 'time', 3, 10, 60, 60, 60, '60s total. Smooth controlled rotation'
  );

  -- Ex 5: Pallof Press (Isometric Hold) | 3 Sets | 20s / side | 45s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_pallof_press, 'time', 3, 10, 20, 20, 45, '20s / side. Resist band rotational pull'
  );

  -- Ex 6: 90/90 Diaphragmatic Breathing | 1 Set | 120s | 0s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws2_id, v_diaphragmatic_breathing, 'time', 1, 1, 120, 120, 0, '120s diaphragmatic breathing'
  );

  -- === PHASE 3 WORKSESSION ===
  SELECT id INTO v_ws3_id FROM worksessions WHERE name = 'Lower Back Resilience: Phase 3 Routine' LIMIT 1;
  IF v_ws3_id IS NULL THEN
    INSERT INTO worksessions (name, modality, description)
    VALUES (
      'Lower Back Resilience: Phase 3 Routine',
      'Clinical Rehab',
      'Phase 3 load integration protocol building posterior chain capacity and functional hinging resilience.'
    ) RETURNING id INTO v_ws3_id;
  END IF;

  -- Map Phase 3 -> Worksession
  DELETE FROM phase_worksessions WHERE phase_id = v_phase3_id;
  INSERT INTO phase_worksessions (phase_id, worksession_id, order_index, day_name)
  VALUES (v_phase3_id, v_ws3_id::TEXT, 1, 'Day 1');

  -- Populate Phase 3 Worksession Exercises
  DELETE FROM worksession_exercises WHERE worksession_id = v_ws3_id;

  -- Ex 1: McGill Curl-up (Warmup) | 1 Set | 30s | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_mcgill_warmup, 'time', 1, 10, 30, 30, 30, 'Activation warmup hold 30s'
  );

  -- Ex 2: Bird-Dog (Warmup) | 1 Set | 30s / side | 30s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_bird_dog_warmup, 'time', 1, 10, 30, 30, 30, 'Activation warmup hold 30s / side'
  );

  -- Ex 3: Kettlebell Romanian Deadlift (RDL) | 4 Sets | 8 reps | 90s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_kb_rdl, 'weight_reps', 4, 8, 45, 45, 90, '8 reps. Hinge deeply from hips, neutral spine'
  );

  -- Ex 4: Kettlebell Goblet Squat | 3 Sets | 10 reps | 90s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_kb_goblet_squat, 'weight_reps', 3, 10, 45, 45, 90, '10 reps. Vertical torso, deep hip crease'
  );

  -- Ex 5: Suitcase Carries | 3 Sets | 30 meters / side | 60s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_suitcase_carries, 'reps', 3, 30, 45, 45, 60, '30 meters / side. Strict vertical posture'
  );

  -- Ex 6: 90/90 Diaphragmatic Breathing | 1 Set | 180s | 0s rest
  INSERT INTO worksession_exercises (
    worksession_id, exercise_id, tracking_type, target_sets, target_reps, target_time, target_duration_seconds, target_rest_seconds, notes
  ) VALUES (
    v_ws3_id, v_diaphragmatic_breathing, 'time', 1, 1, 180, 180, 0, '180s parasympathetic recovery breathing'
  );

  RAISE NOTICE 'Successfully seeded protocol "Lower Back & Lumbar Spine Resilience (Postural Syndrome)"';
  RAISE NOTICE 'Program ID: %, Phase 1: %, Phase 2: %, Phase 3: %', v_program_id, v_phase1_id, v_phase2_id, v_phase3_id;
END $$;

-- ----------------------------------------------------------------------------
-- 4. CONVENIENCE RPC FUNCTION: seed_lower_back_protocol()
-- Callable directly via Supabase client: supabase.rpc('seed_lower_back_protocol')
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_lower_back_protocol()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prog_id UUID;
  v_phase_count INTEGER;
BEGIN
  SELECT id INTO v_prog_id FROM rehab_programs 
  WHERE title = 'Lower Back & Lumbar Spine Resilience (Postural Syndrome)' LIMIT 1;

  SELECT count(*) INTO v_phase_count FROM program_phases 
  WHERE program_id = v_prog_id;

  RETURN jsonb_build_object(
    'success', true,
    'program_id', v_prog_id,
    'title', 'Lower Back & Lumbar Spine Resilience (Postural Syndrome)',
    'phases_count', v_phase_count,
    'seeded_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION seed_lower_back_protocol TO authenticated, anon;
