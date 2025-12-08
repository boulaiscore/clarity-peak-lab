-- Create enum types for cognitive exercises
CREATE TYPE public.exercise_category AS ENUM (
  'reasoning',
  'clarity',
  'decision',
  'fast',
  'slow',
  'bias',
  'logic_puzzle',
  'creative'
);

CREATE TYPE public.exercise_type AS ENUM (
  'multiple_choice',
  'detect_fallacy',
  'open_reflection',
  'logic_puzzle',
  'scenario_choice',
  'probability_estimation'
);

CREATE TYPE public.exercise_difficulty AS ENUM (
  'easy',
  'medium',
  'hard'
);

CREATE TYPE public.exercise_duration AS ENUM (
  '30s',
  '2min',
  '5min'
);

-- Create cognitive_exercises table
CREATE TABLE public.cognitive_exercises (
  id TEXT PRIMARY KEY,
  category exercise_category NOT NULL,
  type exercise_type NOT NULL,
  difficulty exercise_difficulty NOT NULL,
  duration exercise_duration NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options TEXT[] DEFAULT NULL,
  correct_option_index INTEGER DEFAULT NULL,
  explanation TEXT DEFAULT NULL,
  metrics_affected TEXT[] NOT NULL DEFAULT '{}',
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for exercises)
ALTER TABLE public.cognitive_exercises ENABLE ROW LEVEL SECURITY;

-- Everyone can read exercises (they are public content)
CREATE POLICY "Exercises are publicly readable"
ON public.cognitive_exercises
FOR SELECT
USING (true);

-- Create training_sessions table to track user training history
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  training_mode exercise_category NOT NULL,
  duration_option exercise_duration NOT NULL,
  exercises_used TEXT[] NOT NULL DEFAULT '{}',
  score NUMERIC NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for training_sessions
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own training sessions"
ON public.training_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own training sessions"
ON public.training_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create user_cognitive_metrics table
CREATE TABLE public.user_cognitive_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reasoning_accuracy NUMERIC NOT NULL DEFAULT 50,
  clarity_score NUMERIC NOT NULL DEFAULT 50,
  decision_quality NUMERIC NOT NULL DEFAULT 50,
  fast_thinking NUMERIC NOT NULL DEFAULT 50,
  slow_thinking NUMERIC NOT NULL DEFAULT 50,
  bias_resistance NUMERIC NOT NULL DEFAULT 50,
  critical_thinking_score NUMERIC NOT NULL DEFAULT 50,
  creativity NUMERIC NOT NULL DEFAULT 50,
  philosophical_reasoning NUMERIC NOT NULL DEFAULT 50,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_cognitive_metrics
ALTER TABLE public.user_cognitive_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view their own metrics
CREATE POLICY "Users can view their own metrics"
ON public.user_cognitive_metrics
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own metrics
CREATE POLICY "Users can insert their own metrics"
ON public.user_cognitive_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own metrics
CREATE POLICY "Users can update their own metrics"
ON public.user_cognitive_metrics
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_cognitive_exercises_updated_at
BEFORE UPDATE ON public.cognitive_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_cognitive_metrics_updated_at
BEFORE UPDATE ON public.user_cognitive_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();