-- ==============================================================================
-- MIGRATION: Kettlebell & Core / TRX Schema and Seed Data
-- ==============================================================================

-- 1. SCHEMA VERIFICATION & COLUMN ENSURANCES
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT,
ADD COLUMN IF NOT EXISTS mechanics TEXT,
ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT 'Bodyweight',
ADD COLUMN IF NOT EXISTS muscle_group TEXT,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE worksessions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS modality TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE worksessions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'reps',
ADD COLUMN IF NOT EXISTS target_time INTEGER;

-- 2. SEED KETTLEBELL EXERCISES (14 Exercises)
INSERT INTO exercises (id, name, category, muscle_group, equipment, difficulty, mechanics, instructions, is_default, user_id)
VALUES 
  (
    'e0000002-0000-4000-a000-000000000001',
    'Kettlebell Russian Swing',
    'Kettlebell',
    'Posterior Chain / Glutes & Hips',
    'Kettlebell',
    'Beginner',
    'Ballistic / Hip Hinge',
    'Stand feet shoulder-width. Hinge at hips, hike bell between legs, then snap hips forward explosively to swing bell to chest height. Squeeze glutes at top.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000002',
    'Single-Arm Kettlebell Swing',
    'Kettlebell',
    'Posterior Chain / Anti-Rotation',
    'Kettlebell',
    'Intermediate',
    'Ballistic / Dynamic',
    'Perform a standard swing using one arm. Keep shoulders square and resist trunk rotation as the bell swings back through legs.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000003',
    'Kettlebell Goblet Squat',
    'Kettlebell',
    'Quadriceps / Glutes / Core',
    'Kettlebell',
    'Beginner',
    'Knee-Dominant',
    'Hold bell by the horns tight against chest. Squat down between knees keeping chest tall and elbows inside knees. Drive through midfoot to stand.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000004',
    'Kettlebell Clean',
    'Kettlebell',
    'Hips / Lats / Forearms',
    'Kettlebell',
    'Intermediate',
    'Triple Extension',
    'Hinge and hike bell back. Explosively drive hips forward, pull elbow back, and rotate hand under bell to catch softly in rack position against chest.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000005',
    'Kettlebell Overhead Press',
    'Kettlebell',
    'Shoulders / Triceps / Core',
    'Kettlebell',
    'Intermediate',
    'Vertical Push',
    'From rack position, brace core and glutes. Press bell vertically overhead in a slight arc until arm locks out beside ear. Lower under control.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000006',
    'Kettlebell Push Press',
    'Kettlebell',
    'Full Body / Shoulders / Legs',
    'Kettlebell',
    'Intermediate',
    'Explosive Push',
    'From rack position, dip knees 2-3 inches, then aggressively drive legs straight to propel bell overhead, finishing with locked-out arm.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000007',
    'Kettlebell Turkish Get-Up',
    'Kettlebell',
    'Full Body / Shoulder Stability / Core',
    'Kettlebell',
    'Advanced',
    'Multi-Planar Mobility',
    'Lie supine, press bell overhead. Roll to elbow, then hand, bridge hips, sweep leg into half-kneeling, and stand tall. Reverse steps with bell overhead.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000008',
    'Kettlebell Snatch',
    'Kettlebell',
    'Hips / Back / Shoulder Stabilizers',
    'Kettlebell',
    'Advanced',
    'Power / Ballistic',
    'Swing bell between legs, drive hips forward explosively, high-pull with elbow, and punch hand through at top to lock bell overhead without banging wrist.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000009',
    'Kettlebell Romanian Deadlift (RDL)',
    'Kettlebell',
    'Hamstrings / Glutes',
    'Kettlebell',
    'Beginner',
    'Hip Hinge',
    'Stand tall holding bell(s). Soften knees, push hips back keeping back flat until hamstrings stretch; return by driving hips forward.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000010',
    'Kettlebell Gorilla Row',
    'Kettlebell',
    'Lats / Rhomboids / Core',
    'Kettlebell',
    'Intermediate',
    'Horizontal Pull',
    'Hinge over two bells on floor. Keep torso parallel to ground and row one bell to hip while pushing other bell firmly into floor; alternate sides.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000011',
    'Kettlebell Windmill',
    'Kettlebell',
    'Obliques / Hamstrings / Shoulder',
    'Kettlebell',
    'Intermediate',
    'Lateral Flexion / Mobility',
    'Press bell overhead with feet turned 45° away. Hinge hip back and slide opposite hand down inner leg toward floor while looking up at bell.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000012',
    'Kettlebell Farmer''s Carry',
    'Kettlebell',
    'Forearms / Traps / Core Stability',
    'Kettlebell',
    'Beginner',
    'Loaded Carry',
    'Hold a heavy kettlebell in each hand at sides. Walk forward in a straight line with upright posture, packed shoulders, and tight core.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000013',
    'Kettlebell Suitcase Carry',
    'Kettlebell',
    'Obliques / Quadratus Lumborum',
    'Kettlebell',
    'Intermediate',
    'Loaded Carry / Anti-Lateral',
    'Hold a single heavy kettlebell in one hand. Walk with upright, level shoulders, actively resisting leaning sideways toward the weight.',
    true,
    NULL
  ),
  (
    'e0000002-0000-4000-a000-000000000014',
    'Kettlebell Halo',
    'Kettlebell',
    'Shoulders / Scapula / Core',
    'Kettlebell',
    'Beginner',
    'Rotational Mobility',
    'Hold bell upside down by horns at chest. Circle the bell smoothly around head, keeping ribs down and neck relaxed without moving torso.',
    true,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  difficulty = EXCLUDED.difficulty,
  mechanics = EXCLUDED.mechanics,
  instructions = EXCLUDED.instructions,
  is_default = EXCLUDED.is_default;


-- 3. UPDATE PRE-EXISTING CORE / TRX EXERCISES (Preserving Existing IDs)
UPDATE exercises
SET 
  category = 'Core',
  muscle_group = 'Lower Abs / Hip Flexors / Shoulders',
  equipment = 'TRX',
  difficulty = 'Intermediate',
  mechanics = 'Flexion / Anti-Extension',
  instructions = 'Start in a high push-up plank with feet in TRX cradles. Keeping legs straight, lift hips up toward ceiling while drawing toes toward chest until forming an inverted ''V''. Lower slowly.'
WHERE name ILIKE 'TRX Pike';

UPDATE exercises
SET 
  category = 'Core',
  muscle_group = 'Rectus Abdominis / Hip Flexors',
  equipment = 'TRX',
  difficulty = 'Beginner',
  mechanics = 'Dynamic Alternating',
  instructions = 'Set up in a high plank with feet in TRX cradles. Drive one knee smoothly toward chest while keeping hips level, then return and drive opposite knee.'
WHERE name ILIKE 'TRX Mountain Climber';

UPDATE exercises
SET 
  category = 'Core',
  muscle_group = 'Transverse Abdominis / Core',
  equipment = 'TRX',
  difficulty = 'Beginner',
  mechanics = 'Isometric',
  instructions = 'Place feet into TRX cradles and hold a forearm or hand plank. Brace core, engage glutes, and keep head to heels in a rigid straight line without sagging.'
WHERE name ILIKE 'TRX Plank';


-- 4. INSERT REMAINING CORE EXERCISES
INSERT INTO exercises (id, name, category, muscle_group, equipment, difficulty, mechanics, instructions, is_default, user_id)
VALUES
  (
    'e0000003-0000-4000-a000-000000000004',
    'Hollow Body Hold',
    'Core',
    'Rectus Abdominis / Transverse Abdominis',
    'Floor Mat',
    'Intermediate',
    'Anti-Extension',
    'Lie supine, press lower back flat into floor. Extend legs and arms out long, elevating shoulders and feet 6-8 inches off floor. Hold tight hollow shape.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000005',
    'Ab Wheel Rollout',
    'Core',
    'Rectus Abdominis / Lats',
    'Ab Wheel',
    'Advanced',
    'Eccentric Anti-Extension',
    'Kneel on floor with wheel below chest. Slowly roll wheel forward, extending body as low as possible without letting lumbar spine sag; pull back with abs.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000006',
    'Deadbug',
    'Core',
    'Deep Core / Hip Flexors',
    'Floor Mat',
    'Beginner',
    'Motor Control',
    'Lie on back, knees at 90°, arms up. Slowly extend opposite arm and leg toward floor while keeping lower back glued to mat. Return and switch.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000007',
    'TRX Body Saw',
    'Core',
    'Rectus Abdominis / Serratus',
    'TRX',
    'Intermediate',
    'Dynamic Anti-Extension',
    'Feet in TRX straps, assume forearm plank. Rock body forward and backward from elbows, keeping core locked without dipping hips.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000008',
    'TRX Side Plank (Feet in Straps)',
    'Core',
    'Obliques / Abductors',
    'TRX',
    'Intermediate',
    'Isometric Lateral Stability',
    'Place both feet into TRX loops, turn sideways onto bottom forearm. Elevate hips until body forms a straight diagonal line. Hold steady.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000009',
    'Hanging Knee / Leg Raise',
    'Core',
    'Lower Abs / Hip Flexors',
    'Pull-up Bar',
    'Intermediate',
    'Hip Flexion',
    'Hang from pull-up bar. Without swinging, curl pelvis up and lift legs/knees toward chest. Lower under control without overarching.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000010',
    'Russian Twist',
    'Core',
    'Obliques / Transverse Abdominis',
    'Floor Mat',
    'Beginner',
    'Rotational Dynamic',
    'Sit on floor with knees bent, torso reclined at 45°. Rotate torso side to side, tapping floor beside hip while keeping pelvis stable.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000011',
    'Side Plank Dip',
    'Core',
    'Obliques / Quadratus Lumborum',
    'Floor Mat',
    'Intermediate',
    'Dynamic Lateral Flexion',
    'Set up in a side plank on elbow. Lower bottom hip until it lightly touches floor, then contract obliques to elevate hip slightly above neutral line.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000012',
    'TRX Torso Rotation',
    'Core',
    'Obliques / Transverse Abdominis',
    'TRX',
    'Intermediate',
    'Anti-Rotation / Rotational',
    'Stand facing anchor holding TRX handles at chest with straight arms. Lean back, rotate arms and torso diagonally to one side, pull back up using core.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000013',
    'Bicycle Crunch',
    'Core',
    'Rectus Abdominis / Obliques',
    'Floor Mat',
    'Beginner',
    'Dynamic Alternating Flexion',
    'Lie on back, hands behind ears. Bring opposite elbow toward opposite knee while extending other leg long. Alternate smoothly without pulling neck.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000014',
    'V-Up',
    'Core',
    'Full Abdominal Wall',
    'Floor Mat',
    'Intermediate',
    'Dynamic Flexion',
    'Lie flat on back with arms overhead. Simultaneously hinge at hips to raise straight legs and torso, reaching fingers toward toes at top. Lower slowly.',
    true,
    NULL
  ),
  (
    'e0000003-0000-4000-a000-000000000015',
    'TRX Knee Tuck (Crunch)',
    'Core',
    'Rectus Abdominis / Hip Flexors',
    'TRX',
    'Beginner',
    'Dynamic Concentric',
    'Feet in TRX straps in high push-up plank. Drive both knees together straight toward chest, rounding lower back slightly at end, then extend legs back.',
    true,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  difficulty = EXCLUDED.difficulty,
  mechanics = EXCLUDED.mechanics,
  instructions = EXCLUDED.instructions,
  is_default = EXCLUDED.is_default;


-- 5. SEED WORKSESSIONS
INSERT INTO worksessions (id, name, modality, description, user_id)
VALUES 
  (
    'b0000001-0000-4000-a000-000000000005',
    'Worksession E: Kettlebell Power & Hinge',
    'Kettlebell',
    'Focuses on explosive hip hinge power, posterior chain strengthening, and foundational loaded carrying.',
    NULL
  ),
  (
    'b0000001-0000-4000-a000-000000000006',
    'Worksession F: 360° Core & Anti-Rotation',
    'Core',
    'Delivers comprehensive midsection conditioning across sagittal, frontal, and transverse planes blending TRX and loaded carries.',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  modality = EXCLUDED.modality,
  description = EXCLUDED.description;


-- 6. LINK EXERCISES TO WORKSESSIONS
DELETE FROM worksession_exercises 
WHERE worksession_id IN (
  'b0000001-0000-4000-a000-000000000005',
  'b0000001-0000-4000-a000-000000000006'
);

-- Worksession E Links
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000005',
  e.id,
  2,
  10,
  'reps',
  NULL,
  '10 reps each direction'
FROM exercises e WHERE e.name = 'Kettlebell Halo';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000005',
  e.id,
  4,
  15,
  'reps',
  NULL,
  'Explosive hip snap'
FROM exercises e WHERE e.name = 'Kettlebell Russian Swing';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000005',
  e.id,
  3,
  10,
  'reps',
  NULL,
  'Chest tall, elbows inside knees'
FROM exercises e WHERE e.name = 'Kettlebell Goblet Squat';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000005',
  e.id,
  3,
  8,
  'reps',
  NULL,
  '8 reps/arm'
FROM exercises e WHERE e.name = 'Kettlebell Gorilla Row';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000005',
  e.id,
  3,
  40,
  'reps',
  NULL,
  '3 sets x 40m'
FROM exercises e WHERE e.name = 'Kettlebell Farmer''s Carry';

-- Worksession F Links
INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000006',
  e.id,
  3,
  10,
  'reps',
  NULL,
  '10 reps/side'
FROM exercises e WHERE e.name = 'Deadbug';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000006',
  e.id,
  3,
  10,
  'reps',
  NULL,
  'Controlled inverted V'
FROM exercises e WHERE e.name = 'TRX Pike';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000006',
  e.id,
  3,
  20,
  'reps',
  NULL,
  '20 total reps'
FROM exercises e WHERE e.name = 'Russian Twist';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000006',
  e.id,
  3,
  30,
  'reps',
  NULL,
  '30m/side'
FROM exercises e WHERE e.name = 'Kettlebell Suitcase Carry';

INSERT INTO worksession_exercises (worksession_id, exercise_id, target_sets, target_reps, tracking_type, target_time, notes)
SELECT 
  'b0000001-0000-4000-a000-000000000006',
  e.id,
  3,
  NULL,
  'time',
  40,
  '30–45s hold'
FROM exercises e WHERE e.name = 'Hollow Body Hold';
