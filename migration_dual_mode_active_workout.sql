-- ============================================================================
-- MIGRATION: Dual-Mode Active Workout & Cascading Builder Defaults
-- File: migration_dual_mode_active_workout.sql
-- Description:
--   1. Adds default rest, duration, and rep targets to the exercises table.
--   2. Adds target rest, duration, and reps to worksession_exercises.
--   3. Implements an automatic cascading trigger so newly attached exercises
--      inherit defaults directly from the base exercise definition.
-- ============================================================================

SET search_path = public;

-- ----------------------------------------------------------------------------
-- 1. UPDATE EXERCISES TABLE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Add default_rest_seconds (e.g., 60 seconds)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'default_rest_seconds'
  ) THEN
    ALTER TABLE exercises ADD COLUMN default_rest_seconds INTEGER DEFAULT 60;
  END IF;

  -- Add default_duration_seconds (e.g., 45 seconds for holds/planks)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'default_duration_seconds'
  ) THEN
    ALTER TABLE exercises ADD COLUMN default_duration_seconds INTEGER DEFAULT 45;
  END IF;

  -- Add default_reps (e.g., 10 repetitions)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercises' AND column_name = 'default_reps'
  ) THEN
    ALTER TABLE exercises ADD COLUMN default_reps INTEGER DEFAULT 10;
  END IF;
END $$;

-- Backfill existing exercises with sensible defaults if null
UPDATE exercises 
SET 
  default_rest_seconds = COALESCE(default_rest_seconds, 60),
  default_duration_seconds = COALESCE(default_duration_seconds, 45),
  default_reps = COALESCE(default_reps, 10);

-- ----------------------------------------------------------------------------
-- 2. UPDATE WORKSESSION_EXERCISES TABLE (Join Table)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Add target_rest_seconds
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worksession_exercises' AND column_name = 'target_rest_seconds'
  ) THEN
    ALTER TABLE worksession_exercises ADD COLUMN target_rest_seconds INTEGER;
  END IF;

  -- Add target_duration_seconds
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worksession_exercises' AND column_name = 'target_duration_seconds'
  ) THEN
    ALTER TABLE worksession_exercises ADD COLUMN target_duration_seconds INTEGER;
  END IF;

  -- Add target_reps (if not already present)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worksession_exercises' AND column_name = 'target_reps'
  ) THEN
    ALTER TABLE worksession_exercises ADD COLUMN target_reps INTEGER DEFAULT 10;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. CASCADING DEFAULTS TRIGGER FUNCTION
-- Automatically inherits target rest, duration, and reps from exercises table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_worksession_exercise_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_default_rest INTEGER;
  v_default_duration INTEGER;
  v_default_reps INTEGER;
BEGIN
  -- Fetch defaults from parent exercise definition
  SELECT 
    COALESCE(default_rest_seconds, 60),
    COALESCE(default_duration_seconds, 45),
    COALESCE(default_reps, 10)
  INTO 
    v_default_rest,
    v_default_duration,
    v_default_reps
  FROM exercises
  WHERE id = NEW.exercise_id;

  -- Apply cascading inheritance if the worksession exercise left them null
  IF NEW.target_rest_seconds IS NULL THEN
    NEW.target_rest_seconds := COALESCE(v_default_rest, 60);
  END IF;

  IF NEW.target_duration_seconds IS NULL THEN
    -- Fall back to existing target_time column if present
    NEW.target_duration_seconds := COALESCE(NEW.target_time, v_default_duration, 45);
  END IF;

  IF NEW.target_reps IS NULL THEN
    NEW.target_reps := COALESCE(v_default_reps, 10);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to worksession_exercises
DROP TRIGGER IF EXISTS trigger_set_worksession_exercise_defaults ON worksession_exercises;
CREATE TRIGGER trigger_set_worksession_exercise_defaults
BEFORE INSERT ON worksession_exercises
FOR EACH ROW
EXECUTE FUNCTION set_worksession_exercise_defaults();

-- Backfill existing worksession_exercises from linked exercises
UPDATE worksession_exercises we
SET 
  target_rest_seconds = COALESCE(we.target_rest_seconds, e.default_rest_seconds, 60),
  target_duration_seconds = COALESCE(we.target_duration_seconds, we.target_time, e.default_duration_seconds, 45),
  target_reps = COALESCE(we.target_reps, e.default_reps, 10)
FROM exercises e
WHERE we.exercise_id = e.id
  AND (we.target_rest_seconds IS NULL OR we.target_duration_seconds IS NULL OR we.target_reps IS NULL);

-- Final fallback for any unlinked orphaned rows
UPDATE worksession_exercises
SET 
  target_rest_seconds = COALESCE(target_rest_seconds, 60),
  target_duration_seconds = COALESCE(target_duration_seconds, target_time, 45),
  target_reps = COALESCE(target_reps, 10)
WHERE target_rest_seconds IS NULL OR target_duration_seconds IS NULL OR target_reps IS NULL;
