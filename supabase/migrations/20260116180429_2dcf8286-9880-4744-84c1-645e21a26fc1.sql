-- Add Training Capacity columns to user_cognitive_metrics
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS training_capacity numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS tc_last_updated_at timestamptz DEFAULT null;