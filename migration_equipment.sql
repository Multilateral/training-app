-- Migration: Add equipment and muscle_group columns to exercises table and backfill existing library

-- 1. Add columns
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS equipment text DEFAULT 'Bodyweight',
ADD COLUMN IF NOT EXISTS muscle_group text;

-- 2. Backfill TRX exercises
UPDATE exercises 
SET equipment = 'TRX', muscle_group = category
WHERE name ILIKE 'TRX %';

-- 3. Backfill Yoga
UPDATE exercises 
SET equipment = 'Floor Mat', muscle_group = 'Yoga'
WHERE category = 'Yoga';

-- 4. Backfill Barbell & Dumbbells
UPDATE exercises 
SET equipment = 'Dumbbell / Barbell', 
    muscle_group = CASE 
      WHEN name ILIKE '%bench press%' THEN 'Chest'
      WHEN name ILIKE '%squat%' THEN 'Legs'
      WHEN name ILIKE '%deadlift%' THEN 'Back'
      WHEN name ILIKE '%row%' THEN 'Back'
      WHEN name ILIKE '%overhead%' THEN 'Shoulders'
      WHEN name ILIKE '%curl%' THEN 'Arms'
      ELSE 'Full Body'
    END
WHERE category = 'Weightlifting';

-- 5. Backfill Calisthenics
UPDATE exercises 
SET equipment = CASE 
      WHEN name ILIKE '%pull-up%' OR name ILIKE '%muscle-up%' THEN 'Pull-up Bar'
      WHEN name ILIKE '%dip%' THEN 'Dip Station'
      WHEN name ILIKE '%push-up%' OR name ILIKE '%plank%' THEN 'Floor Mat'
      ELSE 'Bodyweight'
    END,
    muscle_group = CASE 
      WHEN name ILIKE '%pull-up%' THEN 'Back'
      WHEN name ILIKE '%push-up%' THEN 'Chest'
      WHEN name ILIKE '%dip%' THEN 'Chest'
      WHEN name ILIKE '%squat%' THEN 'Legs'
      WHEN name ILIKE '%plank%' THEN 'Core'
      WHEN name ILIKE '%muscle-up%' THEN 'Full Body'
      ELSE 'Full Body'
    END
WHERE category = 'Calisthenics';

-- 6. Backfill Plyometrics
UPDATE exercises 
SET equipment = CASE 
      WHEN name ILIKE '%box jump%' THEN 'Plyo Box'
      WHEN name ILIKE '%push-up%' OR name ILIKE '%burpee%' THEN 'Floor Mat'
      ELSE 'Bodyweight'
    END,
    muscle_group = CASE 
      WHEN name ILIKE '%push-up%' THEN 'Chest'
      WHEN name ILIKE '%squat%' OR name ILIKE '%lunge%' OR name ILIKE '%box%' THEN 'Legs'
      ELSE 'Full Body'
    END
WHERE category = 'Plyometrics';

-- 7. Backfill Cardio
UPDATE exercises 
SET equipment = CASE 
      WHEN name ILIKE '%treadmill%' OR name ILIKE '%running%' THEN 'Treadmill'
      WHEN name ILIKE '%cycl%' THEN 'Stationary Bike'
      WHEN name ILIKE '%rowing%' THEN 'Rowing Machine'
      WHEN name ILIKE '%stair%' THEN 'Stair Climber'
      WHEN name ILIKE '%jump rope%' THEN 'Jump Rope'
      ELSE 'Cardio Equipment'
    END,
    muscle_group = 'Cardio'
WHERE category = 'Cardio';

-- 8. Backfill Collective Sports
UPDATE exercises 
SET equipment = 'Sports Equipment', muscle_group = 'Sports'
WHERE category = 'Collective Sports';

-- 9. Fallback for any remaining exercises
UPDATE exercises 
SET equipment = 'Bodyweight' 
WHERE equipment IS NULL;

UPDATE exercises 
SET muscle_group = category 
WHERE muscle_group IS NULL;
