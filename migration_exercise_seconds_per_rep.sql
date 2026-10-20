-- Migration: Add seconds_per_rep to exercises and worksession_exercises
-- Target Supabase Project: nfzuvugwamzjsxngptta
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql

-- 1. Add seconds_per_rep column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS seconds_per_rep numeric DEFAULT NULL;

COMMENT ON COLUMN exercises.seconds_per_rep IS 
'Target execution tempo or hold duration in seconds per repetition (e.g., 4.5s for Cat-Cow, 10.0s for McGill/Bird-Dog holds).';

-- 2. Add seconds_per_rep column to worksession_exercises table
ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS seconds_per_rep numeric DEFAULT NULL;

COMMENT ON COLUMN worksession_exercises.seconds_per_rep IS 
'Worksession-specific tempo in seconds per repetition.';

-- 3. Update exercises tracking_type to 'reps' with tempo regulation
-- Cat-Cow: 10 reps @ 4.5s/rep (45s total cycle)
UPDATE exercises
SET tracking_type = 'reps',
    seconds_per_rep = 4.5,
    default_reps = 10
WHERE name ILIKE '%cat-cow%' OR name ILIKE '%cat cow%';

-- Bird-Dog: Repetition holds @ 10.0s/rep
UPDATE exercises
SET tracking_type = 'reps',
    seconds_per_rep = 10.0,
    default_reps = 5
WHERE name ILIKE '%bird-dog%' OR name ILIKE '%bird dog%';

-- McGill Curl-up: Repetition holds @ 10.0s/rep
UPDATE exercises
SET tracking_type = 'reps',
    seconds_per_rep = 10.0,
    default_reps = 5
WHERE name ILIKE '%mcgill curl%';

-- Diaphragmatic / Box Breathing: 10 breaths @ 6.0s/breath
UPDATE exercises
SET tracking_type = 'reps',
    seconds_per_rep = 6.0,
    default_reps = 10
WHERE name ILIKE '%breathing%' OR name ILIKE '%diaphragmatic%';

-- 4. Update existing worksession_exercises instances
UPDATE worksession_exercises we
SET tracking_type = 'reps',
    seconds_per_rep = e.seconds_per_rep
FROM exercises e
WHERE we.exercise_id = e.id
  AND e.seconds_per_rep IS NOT NULL;
