-- Add difficulty_override column to game_sessions table
-- Tracks when user selects a difficulty different from the recommended one
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS difficulty_override boolean DEFAULT false;