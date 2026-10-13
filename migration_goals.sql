-- Migration for user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'weekly_frequency',
  target_value NUMERIC NOT NULL DEFAULT 4,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'sessions',
  timeframe TEXT NOT NULL DEFAULT 'weekly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissive policy
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_goals" ON user_goals;
CREATE POLICY "Allow all access to user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);
