-- Create game_sessions table for tracking game completions
-- This enables daily/weekly cap enforcement per Training Plan
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  system_type TEXT NOT NULL CHECK (system_type IN ('S1', 'S2')),
  skill_routed TEXT NOT NULL CHECK (skill_routed IN ('AE', 'RA', 'CT', 'IN')),
  game_type TEXT NOT NULL CHECK (game_type IN ('S1-AE', 'S1-RA', 'S2-CT', 'S2-IN')),
  gym_area TEXT NOT NULL,
  thinking_mode TEXT NOT NULL CHECK (thinking_mode IN ('fast', 'slow')),
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own game sessions"
ON public.game_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient daily/weekly queries
CREATE INDEX idx_game_sessions_user_completed ON public.game_sessions(user_id, completed_at DESC);
CREATE INDEX idx_game_sessions_user_system ON public.game_sessions(user_id, system_type, completed_at DESC);
CREATE INDEX idx_game_sessions_user_game_type ON public.game_sessions(user_id, game_type, completed_at DESC);