-- Migration: Add tracking_type parameter to exercises table
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql

-- 1. Add tracking_type column to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS tracking_type text DEFAULT 'weight_reps';

-- 2. Add check constraint for allowed tracking metric types
ALTER TABLE exercises 
DROP CONSTRAINT IF EXISTS exercises_tracking_type_check;

ALTER TABLE exercises 
ADD CONSTRAINT exercises_tracking_type_check 
CHECK (tracking_type IN ('time', 'weight_reps', 'reps', 'distance'));

COMMENT ON COLUMN exercises.tracking_type IS 'Metric tracking mode: time (isometric/duration hold), weight_reps (loaded resistance), reps (bodyweight/calisthenics), distance (cardio)';

-- 3. Backfill Time-Related Exercises (Isometric holds, static stretches, yoga poses, duration holds)
UPDATE exercises 
SET tracking_type = 'time'
WHERE name ILIKE '%hold%' 
   OR name ILIKE '%plank%' 
   OR name ILIKE '%spanish squat%' 
   OR name ILIKE '%balance%' 
   OR name ILIKE '%deadbug%' 
   OR name ILIKE '%bird-dog%' 
   OR name ILIKE '%cat-cow%' 
   OR name ILIKE '%alphabet%' 
   OR category ILIKE '%yoga%' 
   OR name ILIKE '%pose%' 
   OR name ILIKE '%dog%' 
   OR name ILIKE '%chaturanga%' 
   OR name ILIKE '%warrior%' 
   OR name ILIKE '%thread the needle%'
   OR mechanics ILIKE '%isometric%';

-- 4. Backfill Weight + Rep Related Exercises (Barbell, dumbbell, kettlebell, loaded compound/isolation)
UPDATE exercises 
SET tracking_type = 'weight_reps'
WHERE equipment ILIKE '%dumbbell%' 
   OR equipment ILIKE '%barbell%' 
   OR equipment ILIKE '%kettlebell%' 
   OR name ILIKE '%bench press%' 
   OR name ILIKE '%deadlift%' 
   OR (name ILIKE '%squat%' AND name NOT ILIKE '%pistol%' AND name NOT ILIKE '%jump%' AND name NOT ILIKE '%spanish%')
   OR (name ILIKE '%curl%' AND name NOT ILIKE '%nordic%' AND name NOT ILIKE '%mcgill%')
   OR name ILIKE '%overhead press%' 
   OR name ILIKE '%clean%' 
   OR name ILIKE '%snatch%' 
   OR name ILIKE '%kettlebell%' 
   OR (name ILIKE '%row%' AND name NOT ILIKE '%trx%' AND name NOT ILIKE '%inverted%' AND name NOT ILIKE '%rowing%')
   OR name ILIKE '%farmer%' 
   OR name ILIKE '%suitcase%' 
   OR name ILIKE '%halo%';

-- 5. Backfill Rep-Related / Bodyweight Exercises (Pushups, pullups, box jumps, TRX, calisthenics, plyometrics)
UPDATE exercises 
SET tracking_type = 'reps'
WHERE tracking_type IS NULL 
   OR (tracking_type != 'time' AND tracking_type != 'weight_reps');
