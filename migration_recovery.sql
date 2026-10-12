-- ==============================================================================
-- MIGRATION: Recovery & Rehabilitation Schema and Seed Data
-- ==============================================================================

-- 1. SCHEMA MIGRATION: Ensure instruction, description, and metadata columns exist

-- Exercises table additions
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS mechanics TEXT;

-- Worksessions table additions
ALTER TABLE worksessions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Allow worksessions to be global templates (user_id nullable)
ALTER TABLE worksessions 
ALTER COLUMN user_id DROP NOT NULL;

-- Worksession exercises table additions
ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS notes TEXT;


-- 2. SEED EXERCISES (19 Rehabilitation & Recovery Exercises)
INSERT INTO exercises (id, name, category, muscle_group, equipment, difficulty, mechanics, instructions, is_default, user_id)
VALUES 
  (
    'e0000001-0000-4000-a000-000000000001',
    'Terminal Knee Extension (TKE)',
    'Recovery',
    'Knee Rehab',
    'Resistance Band',
    'Beginner',
    'Isometric / Concentric',
    'Anchor a resistance band at knee height behind the knee. Step back for tension. Start with knee slightly bent, then contract quad to fully lock knee straight against the band. Pause 2 seconds; return slowly.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000002',
    'Spanish Squat',
    'Recovery',
    'Knee Rehab',
    'Resistance Band',
    'Intermediate',
    'Isometric',
    'Loop a heavy strap/band behind both knees anchored to a rig. Lean back keeping shins vertical. Squat to ~70-90° knee flexion. Hold position isometrically without letting knees travel forward.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000003',
    'Peterson Step-Up',
    'Recovery',
    'Knee Rehab',
    'Plyo Box',
    'Intermediate',
    'Concentric',
    'Stand on a small elevation on the ball of the active foot with heel lifted. Slowly lower the trailing heel straight down to lightly touch floor, then drive through the active midfoot/forefoot to return.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000004',
    'Glute Bridge',
    'Recovery',
    'Knee Rehab',
    'Floor Mat',
    'Beginner',
    'Concentric',
    'Lie on back, knees bent at 90°, feet flat. Drive through heels to lift hips until thighs and torso align. Squeeze glutes for 2 seconds at the peak without overarching lower back.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000005',
    'Nordic Hamstring Curl',
    'Recovery',
    'Knee Rehab',
    'Bodyweight',
    'Advanced',
    'Eccentric',
    'Kneel tall with feet anchored securely. Keep hips extended in line with torso. Lower chest toward the floor as slowly as possible using hamstrings to brake; catch with hands and push back up.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000006',
    'McGill Curl-up',
    'Recovery',
    'Lower Back Pain',
    'Floor Mat',
    'Beginner',
    'Isometric',
    'Lie face up with hands under lumbar spine to preserve natural curve. One knee bent, one leg straight. Elevate only head and upper shoulders slightly off floor without flexing neck. Hold 10 seconds.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000007',
    'Bird-Dog',
    'Recovery',
    'Lower Back Pain',
    'Floor Mat',
    'Beginner',
    'Core Stability',
    'On all fours, spine neutral. Simultaneously extend opposite arm forward and leg straight back until parallel to floor. Hold 10 seconds without rotating hips or arching back; return with control.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000008',
    'Side Plank',
    'Recovery',
    'Lower Back Pain',
    'Floor Mat',
    'Intermediate',
    'Isometric',
    'Lie on side resting on forearm elbow directly below shoulder. Stack feet and elevate hips until body forms a straight line from ankles to ears. Hold steady without sagging.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000009',
    'Cat-Cow Stretch',
    'Recovery',
    'Lower Back Pain',
    'Floor Mat',
    'Beginner',
    'Mobility',
    'On all fours, alternate smoothly between extending spine (belly down, chest forward) and flexing spine (tucking pelvis, rounding upper back toward ceiling). Move slowly within pain-free range.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000010',
    'Pallof Press',
    'Recovery',
    'Lower Back Pain',
    'Resistance Band',
    'Intermediate',
    'Isometric',
    'Stand perpendicular to cable or resistance band anchored at chest level. Hold handle at sternum with both hands, press straight forward resisting torso rotation, hold 2 seconds, and return to chest.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000011',
    'Scapular Wall Slides',
    'Recovery',
    'Shoulder Rehab',
    'Bodyweight',
    'Beginner',
    'Mobility',
    'Stand with back, head, and elbows/wrists flush against a wall in a goalpost position. Slide forearms upward while maintaining constant contact with wall and ribcage pulled down.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000012',
    'Banded External Rotation',
    'Recovery',
    'Shoulder Rehab',
    'Resistance Band',
    'Beginner',
    'Concentric / Eccentric',
    'Keep working elbow pinned at 90° against side (use towel roll if helpful). Hold band across torso and rotate forearm outward away from abdomen. Control the eccentric return.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000013',
    'Face Pulls',
    'Recovery',
    'Shoulder Rehab',
    'Resistance Band',
    'Intermediate',
    'Concentric',
    'Set cable/band at eye level. Pull rope attachment toward bridge of nose while externally rotating hands so thumbs point backward. Squeeze shoulder blades together for 2 seconds.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000014',
    'Thread the Needle',
    'Recovery',
    'Shoulder Rehab',
    'Floor Mat',
    'Beginner',
    'Mobility',
    'From hands and knees, reach one arm under torso across body, resting shoulder and temple lightly on mat while rotating upper spine. Hold or flow rhythmically for mobility.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000015',
    'Y-T-W Raises',
    'Recovery',
    'Shoulder Rehab',
    'Floor Mat',
    'Intermediate',
    'Isotonic',
    'Prone on an incline bench or floor. Thumbs pointing up. Raise arms into a "Y" position (10 reps), then straight out to sides into a "T" (10 reps), then bend elbows into a "W" pulling shoulder blades back (10 reps).',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000016',
    'Eccentric Heel Drops',
    'Recovery',
    'Ankle & Achilles',
    'Plyo Box',
    'Beginner',
    'Eccentric',
    'Stand with balls of feet on edge of a step. Rise up on both feet, shift all weight onto target leg, and slowly lower heel below step level over a 3-5 second count. Step back up using both legs.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000017',
    'Tibialis Wall Raises',
    'Recovery',
    'Ankle & Achilles',
    'Bodyweight',
    'Beginner',
    'Concentric',
    'Lean upper back against a wall with feet placed 1-2 feet in front. Keeping knees straight and heels planted, pull toes and forefoot up toward shins as high as possible. Pause and lower slowly.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000018',
    'Single-Leg Balance (Pad)',
    'Recovery',
    'Ankle & Achilles',
    'Floor Mat',
    'Intermediate',
    'Isometric',
    'Stand on one leg on an unstable balance pad or folded towel with a slight micro-bend in knee. Keep hips level and fix gaze on a point ahead. Progress by closing eyes.',
    true,
    NULL
  ),
  (
    'e0000001-0000-4000-a000-000000000019',
    'Ankle Alphabet',
    'Recovery',
    'Ankle & Achilles',
    'Bodyweight',
    'Beginner',
    'Mobility',
    'Seated with leg elevated, trace capital letters from A to Z in the air using only the big toe and ankle joint, moving through maximum active range of motion.',
    true,
    NULL
  )
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  difficulty = EXCLUDED.difficulty,
  mechanics = EXCLUDED.mechanics,
  instructions = EXCLUDED.instructions,
  is_default = true;


-- 3. SEED WORKSESSIONS
-- Worksession A
INSERT INTO worksessions (id, name, modality, description, user_id)
VALUES (
  'b0000001-0000-4000-a000-000000000001',
  'The Overhead Athlete''s Shoulder Protocol',
  'Calisthenics',
  'Restores scapular kinematics, thoracic mobility, and rotator cuff integrity following repetitive overhead striking or pressing.',
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  modality = EXCLUDED.modality,
  description = EXCLUDED.description;

-- Worksession B
INSERT INTO worksessions (id, name, modality, description, user_id)
VALUES (
  'b0000001-0000-4000-a000-000000000002',
  'Jumper''s Knee (Patellar Tendinopathy) Relief',
  'Plyometrics',
  'Uses isometric loading for tendon analgesia followed by slow eccentrics and posterior chain engagement to restore jump landing tolerance.',
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  modality = EXCLUDED.modality,
  description = EXCLUDED.description;

-- Worksession C
INSERT INTO worksessions (id, name, modality, description, user_id)
VALUES (
  'b0000001-0000-4000-a000-000000000003',
  'Acute Lower Back McGill Protocol',
  'Yoga',
  'Stabilizes the lumbar spine using Dr. Stuart McGill''s proven endurance trio without creating destructive spinal flexion or shear forces.',
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  modality = EXCLUDED.modality,
  description = EXCLUDED.description;

-- Worksession D
INSERT INTO worksessions (id, name, modality, description, user_id)
VALUES (
  'b0000001-0000-4000-a000-000000000004',
  'Lower Leg & Achilles Resilience',
  'Plyometrics',
  'Strengthens the calf-achilles complex, reinforces the anterior compartment, and trains ankle proprioception for dynamic stability.',
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  modality = EXCLUDED.modality,
  description = EXCLUDED.description;


-- 4. LINK WORKSESSION EXERCISES

-- Worksession A links (Shoulder)
DELETE FROM worksession_exercises WHERE worksession_id = 'b0000001-0000-4000-a000-000000000001';
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
VALUES
  ('b0000001-0000-4000-a000-000000000001', 'e0000001-0000-4000-a000-000000000014', 2, 10, 'reps', NULL, 'Warm-up'),
  ('b0000001-0000-4000-a000-000000000001', 'e0000001-0000-4000-a000-000000000011', 3, 12, 'reps', NULL, 'Activation'),
  ('b0000001-0000-4000-a000-000000000001', 'e0000001-0000-4000-a000-000000000012', 3, 15, 'reps', NULL, 'Strength'),
  ('b0000001-0000-4000-a000-000000000001', 'e0000001-0000-4000-a000-000000000015', 3, 10, 'reps', NULL, 'Stability'),
  ('b0000001-0000-4000-a000-000000000001', 'e0000001-0000-4000-a000-000000000013', 3, 15, 'reps', 2, 'Finisher');

-- Worksession B links (Knee)
DELETE FROM worksession_exercises WHERE worksession_id = 'b0000001-0000-4000-a000-000000000002';
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
VALUES
  ('b0000001-0000-4000-a000-000000000002', 'e0000001-0000-4000-a000-000000000004', 2, 15, 'reps', NULL, 'Warm-up'),
  ('b0000001-0000-4000-a000-000000000002', 'e0000001-0000-4000-a000-000000000002', 4, 1, 'time', 45, 'Tendon Analgesia'),
  ('b0000001-0000-4000-a000-000000000002', 'e0000001-0000-4000-a000-000000000001', 3, 15, 'reps', NULL, 'Tracking'),
  ('b0000001-0000-4000-a000-000000000002', 'e0000001-0000-4000-a000-000000000003', 3, 10, 'reps', NULL, 'Eccentric Load'),
  ('b0000001-0000-4000-a000-000000000002', 'e0000001-0000-4000-a000-000000000005', 3, 5, 'reps', NULL, 'Posterior Chain');

-- Worksession C links (Lower Back)
DELETE FROM worksession_exercises WHERE worksession_id = 'b0000001-0000-4000-a000-000000000003';
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
VALUES
  ('b0000001-0000-4000-a000-000000000003', 'e0000001-0000-4000-a000-000000000009', 2, 10, 'reps', NULL, 'Mobility'),
  ('b0000001-0000-4000-a000-000000000003', 'e0000001-0000-4000-a000-000000000006', 3, 5, 'time', 10, 'Anterior Core'),
  ('b0000001-0000-4000-a000-000000000003', 'e0000001-0000-4000-a000-000000000007', 3, 5, 'time', 10, 'Posterior Core'),
  ('b0000001-0000-4000-a000-000000000003', 'e0000001-0000-4000-a000-000000000008', 3, 3, 'time', 10, 'Lateral Core'),
  ('b0000001-0000-4000-a000-000000000003', 'e0000001-0000-4000-a000-000000000010', 3, 12, 'reps', NULL, 'Anti-rotation');

-- Worksession D links (Ankle & Achilles)
DELETE FROM worksession_exercises WHERE worksession_id = 'b0000001-0000-4000-a000-000000000004';
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
VALUES
  ('b0000001-0000-4000-a000-000000000004', 'e0000001-0000-4000-a000-000000000019', 1, 26, 'reps', NULL, 'Mobility'),
  ('b0000001-0000-4000-a000-000000000004', 'e0000001-0000-4000-a000-000000000016', 3, 15, 'reps', NULL, 'Tendon Load'),
  ('b0000001-0000-4000-a000-000000000004', 'e0000001-0000-4000-a000-000000000017', 3, 20, 'reps', NULL, 'Deceleration Prep'),
  ('b0000001-0000-4000-a000-000000000004', 'e0000001-0000-4000-a000-000000000018', 3, 1, 'time', 45, 'Proprioception');


-- 5. SEED MASTER STANDARD TEMPLATE TRAINING PLAN
INSERT INTO training_plans (id, name, is_standard_template, schedule_type, goal_category, intensity, sessions_per_week, description, user_id)
VALUES (
  'c0000001-0000-4000-a000-000000000001',
  'Rehabilitation & Recovery Protocol',
  true,
  'floating',
  'Rehab & Recovery',
  'Intermediate',
  4,
  'Comprehensive clinical recovery protocols targeting shoulder impingement, jumper''s knee (patellar tendon), lower back resilience (McGill Big 3), and Achilles/ankle stability.',
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  is_standard_template = true,
  schedule_type = EXCLUDED.schedule_type,
  goal_category = EXCLUDED.goal_category,
  intensity = EXCLUDED.intensity,
  sessions_per_week = EXCLUDED.sessions_per_week,
  description = EXCLUDED.description;

-- Link worksessions to plan
DELETE FROM plan_worksessions WHERE plan_id = 'c0000001-0000-4000-a000-000000000001';
INSERT INTO plan_worksessions (plan_id, worksession_id, order_index, day_name)
VALUES 
  ('c0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000001', 1, 'Day 1 - Shoulder Rehab'),
  ('c0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000002', 2, 'Day 2 - Jumper''s Knee'),
  ('c0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000003', 3, 'Day 3 - Lower Back McGill'),
  ('c0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000004', 4, 'Day 4 - Lower Leg & Achilles');
