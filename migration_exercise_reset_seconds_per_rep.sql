-- Migration: Add reset_seconds_per_rep to exercises and worksession_exercises
-- Target Supabase Project: nfzuvugwamzjsxngptta
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql

-- 1. Add reset_seconds_per_rep column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS reset_seconds_per_rep numeric DEFAULT NULL;

COMMENT ON COLUMN exercises.reset_seconds_per_rep IS 
'Transition or side-switch release duration in seconds between repetitions (e.g. 2.0s for McGill Curl-up and Bird-Dog).';

-- 2. Add reset_seconds_per_rep column to worksession_exercises table
ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS reset_seconds_per_rep numeric DEFAULT NULL;

COMMENT ON COLUMN worksession_exercises.reset_seconds_per_rep IS 
'Worksession-specific side-switch or reset duration in seconds.';

-- 3. Configure Bird-Dog and McGill Curl-up with 10.0s hold + 2.0s switch = 12.0s cycle
UPDATE exercises
SET hold_seconds_per_rep = 10.0,
    reset_seconds_per_rep = 2.0,
    seconds_per_rep = 12.0
WHERE name ILIKE '%bird-dog%' OR name ILIKE '%mcgill%';

UPDATE worksession_exercises we
SET hold_seconds_per_rep = 10.0,
    reset_seconds_per_rep = 2.0,
    seconds_per_rep = 12.0
FROM exercises e
WHERE we.exercise_id = e.id
  AND (e.name ILIKE '%bird-dog%' OR e.name ILIKE '%mcgill%');
