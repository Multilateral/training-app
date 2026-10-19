-- Migration: Add 'manual' to allowed tracking_type values and update Collective Sports
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nfzuvugwamzjsxngptta/sql

-- 1. Update check constraint on exercises table
ALTER TABLE exercises 
DROP CONSTRAINT IF EXISTS exercises_tracking_type_check;

ALTER TABLE exercises 
ADD CONSTRAINT exercises_tracking_type_check 
CHECK (tracking_type IN ('time', 'weight_reps', 'reps', 'distance', 'manual'));

COMMENT ON COLUMN exercises.tracking_type IS 'Metric tracking mode: time (isometric/duration hold), weight_reps (loaded resistance), reps (bodyweight/calisthenics), distance (cardio), manual (logged sports duration/hours)';

-- 2. Update all Collective Sports to 'manual' tracking_type
UPDATE exercises 
SET tracking_type = 'manual'
WHERE category = 'Collective Sports';
