-- Migration: Add user_id, is_default, equipment, and muscle_group to exercises table

-- 1. Add columns to exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS equipment text DEFAULT 'Bodyweight',
ADD COLUMN IF NOT EXISTS muscle_group text;

-- 2. Mark all currently existing exercises as default
UPDATE exercises 
SET is_default = true 
WHERE is_default IS NOT TRUE;

-- 3. Backfill TRX exercises
UPDATE exercises 
SET equipment = 'TRX', muscle_group = category
WHERE name ILIKE 'TRX %';

-- 4. Backfill Yoga
UPDATE exercises 
SET equipment = 'Floor Mat', muscle_group = 'Yoga'
WHERE category = 'Yoga';

-- 5. Backfill Barbell & Dumbbells
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

-- 6. Backfill Calisthenics
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

-- 7. Backfill Plyometrics
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

-- 8. Backfill Cardio
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

-- 9. Backfill Collective Sports
UPDATE exercises 
SET equipment = 'Sports Equipment', muscle_group = 'Sports'
WHERE category = 'Collective Sports';

-- 10. Fallback for remaining
UPDATE exercises 
SET equipment = 'Bodyweight' 
WHERE equipment IS NULL;

UPDATE exercises 
SET muscle_group = category 
WHERE muscle_group IS NULL;

-- 11. Enable Row Level Security (RLS)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- 12. Clean up any existing policies on exercises
DROP POLICY IF EXISTS "Public exercises are viewable by everyone" ON exercises;
DROP POLICY IF EXISTS "Users can view default and their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can insert their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON exercises;
DROP POLICY IF EXISTS "Admins can manage all exercises" ON exercises;

-- 13. RLS Policies:

-- SELECT: View default exercises + user's own custom exercises
CREATE POLICY "Users can view default and their own exercises" 
ON exercises FOR SELECT 
USING (
  is_default = true 
  OR user_id = auth.uid() 
  OR user_id IS NULL
);

-- INSERT: Authenticated users can insert their own exercises; Admins can insert defaults directly
CREATE POLICY "Users can insert their own exercises" 
ON exercises FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    (user_id = auth.uid() AND (is_default = false OR is_default IS NULL))
    OR (auth.jwt() ->> 'email' IN ('condrea.vlad@gmail.com', 'condrea.vlad@icloud.com'))
  )
);

-- UPDATE: Users can update their own custom exercises; Admins can update any (e.g. promote to default)
CREATE POLICY "Users can update their own exercises" 
ON exercises FOR UPDATE 
USING (
  (user_id = auth.uid() AND is_default = false)
  OR (auth.jwt() ->> 'email' IN ('condrea.vlad@gmail.com', 'condrea.vlad@icloud.com'))
);

-- DELETE: Users can delete their own custom exercises; Admins can delete any
CREATE POLICY "Users can delete their own exercises" 
ON exercises FOR DELETE 
USING (
  (user_id = auth.uid() AND is_default = false) 
  OR (auth.jwt() ->> 'email' IN ('condrea.vlad@gmail.com', 'condrea.vlad@icloud.com'))
);
