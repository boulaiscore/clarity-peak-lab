-- Create table to track individual exercise completions with XP
CREATE TABLE public.exercise_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exercise_id text NOT NULL,
  gym_area text NOT NULL,
  thinking_mode text,
  difficulty text NOT NULL,
  xp_earned integer NOT NULL,
  score numeric DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date
);

-- Enable RLS
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own exercise completions"
ON public.exercise_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise completions"
ON public.exercise_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster weekly queries
CREATE INDEX idx_exercise_completions_user_week 
ON public.exercise_completions(user_id, week_start);

CREATE INDEX idx_exercise_completions_user_date 
ON public.exercise_completions(user_id, completed_at);