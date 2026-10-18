-- ============================================================================
-- FIX: Enable Public Read Access on Worksessions & Phase Relationships
-- File: fix_worksessions_rls.sql
-- ============================================================================

SET search_path = public;

-- 1. Enable RLS and public SELECT on worksessions
ALTER TABLE worksessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view worksessions" ON worksessions;
CREATE POLICY "Public can view worksessions" ON worksessions 
  FOR SELECT TO authenticated, anon 
  USING (true);

-- 2. Enable RLS and public SELECT on worksession_exercises
ALTER TABLE worksession_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view worksession_exercises" ON worksession_exercises;
CREATE POLICY "Public can view worksession_exercises" ON worksession_exercises 
  FOR SELECT TO authenticated, anon 
  USING (true);

-- 3. Compatibility column on phase_worksessions
ALTER TABLE phase_worksessions ADD COLUMN IF NOT EXISTS day_order INTEGER DEFAULT 1;
UPDATE phase_worksessions SET day_order = order_index WHERE day_order IS NULL;

-- 4. Foreign key constraint from phase_worksessions to worksessions
DO $$
BEGIN
  BEGIN
    ALTER TABLE phase_worksessions 
      ALTER COLUMN worksession_id TYPE UUID USING worksession_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_phase_worksessions_ws'
  ) THEN
    BEGIN
      ALTER TABLE phase_worksessions
        ADD CONSTRAINT fk_phase_worksessions_ws 
        FOREIGN KEY (worksession_id) REFERENCES worksessions(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;
