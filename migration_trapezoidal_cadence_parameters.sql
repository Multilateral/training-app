-- Migration: Add universal trapezoidal cadence parameters to exercises and worksession_exercises
-- Target Supabase Project: nfzuvugwamzjsxngptta
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql

-- 1. Ensure hold_seconds_per_rep and reset_seconds_per_rep exist on exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS hold_seconds_per_rep numeric DEFAULT NULL;

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS reset_seconds_per_rep numeric DEFAULT NULL;

-- 2. Add transition_seconds (duration of ramp up/down between low and high plateaus)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS transition_seconds numeric DEFAULT 1.0;

COMMENT ON COLUMN exercises.transition_seconds IS 
'Duration in seconds of the movement transition (rise ramp and fall ramp) between low and high trapezoidal plateaus. Default 1.0s, 0.5s for fast mobility.';

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS transition_seconds numeric DEFAULT 1.0;

COMMENT ON COLUMN worksession_exercises.transition_seconds IS 
'Worksession-specific transition duration in seconds between low and high plateaus.';

-- 3. Add high_phase_name and low_phase_name for custom trapezoid state labels
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS high_phase_name text DEFAULT NULL;

COMMENT ON COLUMN exercises.high_phase_name IS 
'Label for the high plateau state (e.g. Cat Arch, Tensioned Hold, Plank Hold).';

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS low_phase_name text DEFAULT NULL;

COMMENT ON COLUMN exercises.low_phase_name IS 
'Label for the low plateau state (e.g. Cow Dip, Release & Switch, Switch Sides).';

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS high_phase_name text DEFAULT NULL;

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS low_phase_name text DEFAULT NULL;

-- 4. Add is_unilateral boolean flag
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS is_unilateral boolean DEFAULT FALSE;

COMMENT ON COLUMN exercises.is_unilateral IS 
'Whether this exercise alternates between left and right sides (e.g. Bird-Dog, Side Plank, Single-Leg Glute Bridge).';

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS is_unilateral boolean DEFAULT FALSE;

-- 5. Seed clinical parameters for key exercises

-- A. Cat-Cow Stretch (Symmetrical two-phase flow: 1.5s Cow + 0.5s Ramp + 1.5s Cat + 0.5s Ramp = 4.0s)
UPDATE exercises
SET seconds_per_rep = 4.0,
    hold_seconds_per_rep = 1.5,
    reset_seconds_per_rep = 1.5,
    transition_seconds = 0.5,
    high_phase_name = 'Cat (Arch Up)',
    low_phase_name = 'Cow (Dip Down)',
    is_unilateral = FALSE
WHERE name ILIKE '%cat-cow%' OR name ILIKE '%cat cow%';

UPDATE worksession_exercises we
SET seconds_per_rep = 4.0,
    hold_seconds_per_rep = 1.5,
    reset_seconds_per_rep = 1.5,
    transition_seconds = 0.5,
    high_phase_name = 'Cat (Arch Up)',
    low_phase_name = 'Cow (Dip Down)',
    is_unilateral = FALSE
FROM exercises e
WHERE we.exercise_id = e.id
  AND (e.name ILIKE '%cat-cow%' OR e.name ILIKE '%cat cow%');

-- B. McGill Curl-up (8.0s Core Tension + 1.0s Fall + 2.0s Release + 1.0s Rise = 12.0s)
UPDATE exercises
SET seconds_per_rep = 12.0,
    hold_seconds_per_rep = 8.0,
    reset_seconds_per_rep = 2.0,
    transition_seconds = 1.0,
    high_phase_name = 'Tensioned Core Hold',
    low_phase_name = 'Release to Floor',
    is_unilateral = FALSE
WHERE name ILIKE '%mcgill%';

UPDATE worksession_exercises we
SET seconds_per_rep = 12.0,
    hold_seconds_per_rep = 8.0,
    reset_seconds_per_rep = 2.0,
    transition_seconds = 1.0,
    high_phase_name = 'Tensioned Core Hold',
    low_phase_name = 'Release to Floor',
    is_unilateral = FALSE
FROM exercises e
WHERE we.exercise_id = e.id
  AND e.name ILIKE '%mcgill%';

-- C. Bird-Dog (10.0s Reach Hold + 1.0s Fall + 2.0s Switch + 1.0s Rise = 14.0s)
UPDATE exercises
SET seconds_per_rep = 14.0,
    hold_seconds_per_rep = 10.0,
    reset_seconds_per_rep = 2.0,
    transition_seconds = 1.0,
    high_phase_name = 'Extend & Reach Hold',
    low_phase_name = 'Switch Sides',
    is_unilateral = TRUE
WHERE name ILIKE '%bird-dog%' OR name ILIKE '%bird dog%';

UPDATE worksession_exercises we
SET seconds_per_rep = 14.0,
    hold_seconds_per_rep = 10.0,
    reset_seconds_per_rep = 2.0,
    transition_seconds = 1.0,
    high_phase_name = 'Extend & Reach Hold',
    low_phase_name = 'Switch Sides',
    is_unilateral = TRUE
FROM exercises e
WHERE we.exercise_id = e.id
  AND (e.name ILIKE '%bird-dog%' OR e.name ILIKE '%bird dog%');

-- D. Side Plank (30.0s Hold + 1.0s Fall + 3.0s Switch Sides + 1.0s Rise = 35.0s)
UPDATE exercises
SET target_duration_seconds = 30,
    hold_seconds_per_rep = 30.0,
    reset_seconds_per_rep = 3.0,
    transition_seconds = 1.0,
    high_phase_name = 'Side Plank Hold',
    low_phase_name = 'Switch Sides',
    is_unilateral = TRUE
WHERE name ILIKE '%side plank%';

UPDATE worksession_exercises we
SET target_duration_seconds = 30,
    hold_seconds_per_rep = 30.0,
    reset_seconds_per_rep = 3.0,
    transition_seconds = 1.0,
    high_phase_name = 'Side Plank Hold',
    low_phase_name = 'Switch Sides',
    is_unilateral = TRUE
FROM exercises e
WHERE we.exercise_id = e.id
  AND e.name ILIKE '%side plank%';

-- E. Psoas March / Deadbug (1.5s Knee Lift/Brace + 1.0s Fall + 0.5s Switch + 1.0s Rise = 4.0s)
UPDATE exercises
SET seconds_per_rep = 4.0,
    hold_seconds_per_rep = 1.5,
    reset_seconds_per_rep = 0.5,
    transition_seconds = 1.0,
    high_phase_name = 'Knee Lift & Core Brace',
    low_phase_name = 'Switch Sides / Reset',
    is_unilateral = TRUE
WHERE name ILIKE '%psoas%' OR name ILIKE '%march%';

UPDATE worksession_exercises we
SET seconds_per_rep = 4.0,
    hold_seconds_per_rep = 1.5,
    reset_seconds_per_rep = 0.5,
    transition_seconds = 1.0,
    high_phase_name = 'Knee Lift & Core Brace',
    low_phase_name = 'Switch Sides / Reset',
    is_unilateral = TRUE
FROM exercises e
WHERE we.exercise_id = e.id
  AND (e.name ILIKE '%psoas%' OR e.name ILIKE '%march%');

