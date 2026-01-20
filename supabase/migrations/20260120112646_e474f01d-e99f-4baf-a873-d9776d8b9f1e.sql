-- Create table to store report generation history
CREATE TABLE public.report_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_type TEXT NOT NULL DEFAULT 'cognitive',
  -- Store key metrics snapshot at generation time
  cognitive_age INTEGER,
  sci_score NUMERIC(5,2),
  fast_thinking NUMERIC(5,2),
  slow_thinking NUMERIC(5,2),
  total_sessions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own report history
CREATE POLICY "Users can view their own reports"
ON public.report_generations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own report records
CREATE POLICY "Users can create their own reports"
ON public.report_generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_report_generations_user_date 
ON public.report_generations(user_id, generated_at DESC);