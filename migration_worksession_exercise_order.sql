-- ============================================================================
-- Migration: Add order_index to worksession_exercises & Restore Clinical Consecutivity
-- ============================================================================

-- 1. Add order_index column to worksession_exercises if not present
ALTER TABLE worksession_exercises 
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Create index on (worksession_id, order_index) for fast ordered queries
CREATE INDEX IF NOT EXISTS idx_worksession_exercises_order 
  ON worksession_exercises (worksession_id, order_index);

-- 3. Populate order_index for Lower Back Resilience: Phase 1 Routine
-- Clinical sequence:
-- 1. Cat-Cow Stretch (Warm-up / joint lubrication)
-- 2. Psoas March (Supine) (Deep core motor control)
-- 3. McGill Curl-up (Anterior core isometric endurance)
-- 4. Bird-Dog (Posterior extensor chain endurance)
-- 5. Side Plank (Short Lever/Knees) (Lateral core stiffness)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Cat-Cow%' THEN 1
  WHEN e.name ILIKE '%Psoas March%' THEN 2
  WHEN e.name ILIKE '%McGill Curl-up%' THEN 3
  WHEN e.name ILIKE '%Bird-Dog%' THEN 4
  WHEN e.name ILIKE '%Side Plank%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name = 'Lower Back Resilience: Phase 1 Routine';

-- 4. Populate order_index for Lower Back Resilience: Phase 2 Routine
-- Clinical sequence:
-- 1. Cat-Cow Stretch (Warmup mobility)
-- 2. Active Straight Leg Raise (Motor control / hip dissociation)
-- 3. Bird-Dog Squares (Perturbation & anti-rotation)
-- 4. Rolling Side Planks (Rotational & lateral stability)
-- 5. Pallof Press (Isometric Hold) (Anti-rotation)
-- 6. 90/90 Diaphragmatic Breathing (Autonomic / respiratory reset)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Cat-Cow%' THEN 1
  WHEN e.name ILIKE '%Straight Leg Raise%' THEN 2
  WHEN e.name ILIKE '%Bird-Dog Squares%' THEN 3
  WHEN e.name ILIKE '%Rolling Side Plank%' THEN 4
  WHEN e.name ILIKE '%Pallof Press%' THEN 5
  WHEN e.name ILIKE '%Diaphragmatic Breathing%' THEN 6
  ELSE 7
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name = 'Lower Back Resilience: Phase 2 Routine';

-- 5. Populate order_index for Lower Back Resilience: Phase 3 Routine
-- Clinical sequence:
-- 1. McGill Curl-up (Warmup)
-- 2. Bird-Dog (Warmup)
-- 3. Kettlebell Romanian Deadlift (RDL) (Loaded hip hinge)
-- 4. Kettlebell Goblet Squat (Loaded squat pattern)
-- 5. Suitcase Carries (Loaded anti-lateral flexion)
-- 6. 90/90 Diaphragmatic Breathing (Autonomic down-regulation)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%McGill Curl-up%Warmup%' THEN 1
  WHEN e.name ILIKE '%Bird-Dog%Warmup%' THEN 2
  WHEN e.name ILIKE '%Romanian Deadlift%' THEN 3
  WHEN e.name ILIKE '%Goblet Squat%' THEN 4
  WHEN e.name ILIKE '%Suitcase Carrie%' OR e.name ILIKE '%Suitcase Carry%' THEN 5
  WHEN e.name ILIKE '%Diaphragmatic Breathing%' THEN 6
  ELSE 7
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name = 'Lower Back Resilience: Phase 3 Routine';

-- 6. Populate order_index for Acute Lower Back McGill Protocol
-- Clinical sequence:
-- 1. Cat-Cow Stretch (Warm-up / joint lubrication)
-- 2. McGill Curl-up (Anterior Core)
-- 3. Bird-Dog (Posterior Core)
-- 4. Side Plank (Lateral Core)
-- 5. Pallof Press (Anti-rotation)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Cat-Cow%' THEN 1
  WHEN e.name ILIKE '%McGill Curl-up%' THEN 2
  WHEN e.name ILIKE '%Bird-Dog%' THEN 3
  WHEN e.name ILIKE '%Side Plank%' THEN 4
  WHEN e.name ILIKE '%Pallof Press%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%McGill Protocol%';

-- 7. Populate order_index for The Overhead Athlete's Shoulder Protocol
-- Clinical sequence:
-- 1. Thread the Needle (Warm-up / thoracic mobility)
-- 2. Scapular Wall Slides (Activation)
-- 3. Banded External Rotation (Eccentric Focus) (Strength)
-- 4. Y-T-W Raises (Stability)
-- 5. Face Pulls (Finisher / Posterior delt)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Thread the Needle%' THEN 1
  WHEN e.name ILIKE '%Scapular Wall Slides%' THEN 2
  WHEN e.name ILIKE '%External Rotation%' THEN 3
  WHEN e.name ILIKE '%Y-T-W%' THEN 4
  WHEN e.name ILIKE '%Face Pull%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%Shoulder Protocol%';

-- 8. Populate order_index for Jumper's Knee (Patellar Tendinopathy) Relief
-- Clinical sequence:
-- 1. Glute Bridge (Warm-up)
-- 2. Spanish Squat (Tendon Analgesia Iso)
-- 3. Terminal Knee Extension (TKE) (Tracking)
-- 4. Peterson Step-Up (Eccentric Load)
-- 5. Nordic Hamstring Curl (Posterior Chain)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Glute Bridge%' THEN 1
  WHEN e.name ILIKE '%Spanish Squat%' THEN 2
  WHEN e.name ILIKE '%Terminal Knee%' OR e.name ILIKE '%TKE%' THEN 3
  WHEN e.name ILIKE '%Step-Up%' THEN 4
  WHEN e.name ILIKE '%Nordic%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%Jumper%Knee%';

-- 9. Populate order_index for Lower Leg & Achilles Resilience
-- Clinical sequence:
-- 1. Ankle Alphabet (Mobility)
-- 2. Eccentric Heel Drops (Tendon Load)
-- 3. Tibialis Wall Raises (Deceleration Prep)
-- 4. Single-Leg Balance (Proprioception)
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Ankle Alphabet%' THEN 1
  WHEN e.name ILIKE '%Heel Drop%' THEN 2
  WHEN e.name ILIKE '%Tibialis%' THEN 3
  WHEN e.name ILIKE '%Single-Leg Balance%' THEN 4
  ELSE 5
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%Achilles Resilience%';

-- 10. Populate order_index for Worksession E: Kettlebell Power & Hinge
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Kettlebell Russian Swing%' THEN 1
  WHEN e.name ILIKE '%Kettlebell Goblet Squat%' THEN 2
  WHEN e.name ILIKE '%Kettlebell Gorilla Row%' THEN 3
  WHEN e.name ILIKE '%Kettlebell Farmer%Carry%' THEN 4
  WHEN e.name ILIKE '%Kettlebell Halo%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%Kettlebell Power & Hinge%';

-- 11. Populate order_index for Worksession F: 360° Core & Anti-Rotation
UPDATE worksession_exercises we
SET order_index = CASE 
  WHEN e.name ILIKE '%Deadbug%' THEN 1
  WHEN e.name ILIKE '%Hollow Body Hold%' THEN 2
  WHEN e.name ILIKE '%Russian Twist%' THEN 3
  WHEN e.name ILIKE '%TRX Pike%' THEN 4
  WHEN e.name ILIKE '%Kettlebell Suitcase Carry%' THEN 5
  ELSE 6
END
FROM exercises e, worksessions w
WHERE we.exercise_id = e.id 
  AND we.worksession_id = w.id 
  AND w.name ILIKE '%360%Core%';

-- 12. For any remaining worksession_exercises where order_index is 0 or null,
-- set order_index based on ROW_NUMBER() over created_at / id
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY worksession_id ORDER BY created_at ASC, id ASC) as seq
  FROM worksession_exercises
  WHERE order_index = 0 OR order_index IS NULL
)
UPDATE worksession_exercises we
SET order_index = numbered.seq
FROM numbered
WHERE we.id = numbered.id AND (we.order_index = 0 OR we.order_index IS NULL);
