-- Migration: Split rest times into inter-set rest and transition rest
-- Target Supabase Project: nfzuvugwamzjsxngptta

-- 1. exercises table:
-- Rename default_rest_seconds to default_inter_set_rest_seconds
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'default_rest_seconds'
  ) THEN
    ALTER TABLE exercises RENAME COLUMN default_rest_seconds TO default_inter_set_rest_seconds;
  END IF;
END $$;

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS default_inter_set_rest_seconds integer DEFAULT 60;

COMMENT ON COLUMN exercises.default_inter_set_rest_seconds IS 
'Default pause duration in seconds between sets of the same exercise.';

-- Add default_transition_rest_seconds
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS default_transition_rest_seconds integer DEFAULT 30;

COMMENT ON COLUMN exercises.default_transition_rest_seconds IS 
'Default pause duration in seconds triggered ONLY after completing the final set of an exercise, allowing time to set up for the next movement.';

-- 2. worksession_exercises table:
-- Rename target_rest_seconds to inter_set_rest_seconds
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worksession_exercises' AND column_name = 'target_rest_seconds'
  ) THEN
    ALTER TABLE worksession_exercises RENAME COLUMN target_rest_seconds TO inter_set_rest_seconds;
  END IF;
END $$;

ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS inter_set_rest_seconds integer DEFAULT 60;

COMMENT ON COLUMN worksession_exercises.inter_set_rest_seconds IS 
'Worksession-specific pause duration in seconds between sets of the same exercise.';

-- Add transition_rest_seconds
ALTER TABLE worksession_exercises 
ADD COLUMN IF NOT EXISTS transition_rest_seconds integer DEFAULT 30;

COMMENT ON COLUMN worksession_exercises.transition_rest_seconds IS 
'Worksession-specific pause duration in seconds triggered after the final set of this exercise to transition to the next exercise.';

-- 3. Update trigger function set_worksession_exercise_defaults
CREATE OR REPLACE FUNCTION set_worksession_exercise_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_default_inter_rest INTEGER;
  v_default_trans_rest INTEGER;
  v_default_duration INTEGER;
  v_default_reps INTEGER;
BEGIN
  SELECT 
    COALESCE(default_inter_set_rest_seconds, 60),
    COALESCE(default_transition_rest_seconds, 30),
    COALESCE(default_duration_seconds, 45),
    COALESCE(default_reps, 10)
  INTO 
    v_default_inter_rest,
    v_default_trans_rest,
    v_default_duration,
    v_default_reps
  FROM exercises
  WHERE id = NEW.exercise_id;

  IF NEW.inter_set_rest_seconds IS NULL THEN
    NEW.inter_set_rest_seconds := COALESCE(v_default_inter_rest, 60);
  END IF;

  IF NEW.transition_rest_seconds IS NULL THEN
    NEW.transition_rest_seconds := COALESCE(v_default_trans_rest, 30);
  END IF;

  IF NEW.target_duration_seconds IS NULL THEN
    NEW.target_duration_seconds := COALESCE(NEW.target_time, v_default_duration, 45);
  END IF;

  IF NEW.target_reps IS NULL THEN
    NEW.target_reps := COALESCE(v_default_reps, 10);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
