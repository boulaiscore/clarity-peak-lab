-- Add Recovery v2.0 columns to user_cognitive_metrics
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS rec_value numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rec_last_ts timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_recovery_baseline boolean DEFAULT false;