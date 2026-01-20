-- Create user_game_history table for anti-repetition engine
CREATE TABLE public.user_game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  combo_hash TEXT NOT NULL,
  difficulty TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Analytics metadata
  quality_score NUMERIC,
  bonus_applied BOOLEAN DEFAULT false,
  near_duplicate_rejected INTEGER DEFAULT 0,
  fallback_used BOOLEAN DEFAULT false
);

-- Indexes for efficient querying
CREATE INDEX idx_game_history_user_game ON public.user_game_history(user_id, game_name);
CREATE INDEX idx_game_history_combo ON public.user_game_history(user_id, game_name, combo_hash);
CREATE INDEX idx_game_history_recent ON public.user_game_history(user_id, completed_at DESC);

-- Enable RLS
ALTER TABLE public.user_game_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own game history"
ON public.user_game_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game history"
ON public.user_game_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add quality/anti-repetition columns to game_sessions
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS quality_score NUMERIC,
ADD COLUMN IF NOT EXISTS bonus_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anti_repetition_triggered BOOLEAN DEFAULT false;