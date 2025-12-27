-- Create table for tracking detox challenge completions
CREATE TABLE public.detox_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_start DATE NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date
);

-- Enable Row Level Security
ALTER TABLE public.detox_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own detox completions" 
ON public.detox_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detox completions" 
ON public.detox_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient weekly queries
CREATE INDEX idx_detox_completions_user_week ON public.detox_completions(user_id, week_start);