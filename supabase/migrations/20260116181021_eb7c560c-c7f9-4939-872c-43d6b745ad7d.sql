-- Add column to track previous TC value for trend calculation
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS tc_previous_value numeric DEFAULT null;