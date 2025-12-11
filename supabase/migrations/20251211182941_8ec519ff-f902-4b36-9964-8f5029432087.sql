-- Add is_daily_training column to track daily training sessions
ALTER TABLE neuro_gym_sessions 
ADD COLUMN IF NOT EXISTS is_daily_training boolean DEFAULT false;