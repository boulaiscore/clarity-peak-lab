-- Add new exercise categories for Neuro Gym
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'attention';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'working_memory';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'inhibition';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'cognitive_control';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'executive_control';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'insight';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'reflection';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'philosophical';

-- Add new duration option for Neuro Gym sessions
ALTER TYPE exercise_duration ADD VALUE IF NOT EXISTS '3min';
ALTER TYPE exercise_duration ADD VALUE IF NOT EXISTS '7min';

-- Create neuro_gym_sessions table to track Neuro Gym specific sessions
CREATE TABLE IF NOT EXISTS public.neuro_gym_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('focus', 'memory', 'control', 'reasoning', 'creativity', 'neuro-activation')),
  duration_option TEXT NOT NULL CHECK (duration_option IN ('3min', '7min')),
  exercises_used TEXT[] NOT NULL DEFAULT '{}',
  score NUMERIC NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neuro_gym_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for neuro_gym_sessions
CREATE POLICY "Users can view their own neuro gym sessions"
ON public.neuro_gym_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own neuro gym sessions"
ON public.neuro_gym_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);