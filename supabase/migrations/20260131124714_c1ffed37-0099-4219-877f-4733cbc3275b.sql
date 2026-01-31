-- ============================================
-- COGNITIVE AGE v1.1 - Database Schema Update
-- ============================================

-- 1) Add 'did_training' column to daily_metric_snapshots
-- This table already has ae, ra, ct, in_score, s2, etc.
ALTER TABLE public.daily_metric_snapshots
ADD COLUMN IF NOT EXISTS did_training boolean DEFAULT false;

-- 2) Create user_cognitive_baselines table (WHOOP-style baseline)
CREATE TABLE IF NOT EXISTS public.user_cognitive_baselines (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chrono_age_at_onboarding numeric NOT NULL DEFAULT 30,
  baseline_score_90d numeric,
  baseline_rq_90d numeric,
  baseline_start_date date,
  baseline_end_date date,
  is_baseline_calibrated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_cognitive_baselines ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cognitive baselines"
ON public.user_cognitive_baselines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cognitive baselines"
ON public.user_cognitive_baselines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cognitive baselines"
ON public.user_cognitive_baselines FOR UPDATE
USING (auth.uid() = user_id);

-- 3) Create user_cognitive_age_weekly table (weekly snapshots)
CREATE TABLE IF NOT EXISTS public.user_cognitive_age_weekly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  cognitive_age numeric,
  score_90d numeric,
  score_30d numeric,
  rq_30d numeric,
  rq_90d numeric,
  improvement_points numeric,
  regression_risk text DEFAULT 'low',
  regression_streak_days integer DEFAULT 0,
  regression_triggered boolean DEFAULT false,
  cap_applied boolean DEFAULT false,
  last_regression_trigger_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.user_cognitive_age_weekly ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own weekly cognitive age"
ON public.user_cognitive_age_weekly FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly cognitive age"
ON public.user_cognitive_age_weekly FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cognitive_age_weekly_user_week 
ON public.user_cognitive_age_weekly(user_id, week_start DESC);

-- 4) Add regression tracking columns to user_cognitive_metrics (if not exist)
-- Use existing consecutive_performance_drop_days for streak
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS regression_risk text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS last_regression_trigger_at timestamp with time zone;

-- Add check constraint for regression_risk values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'regression_risk_check'
  ) THEN
    ALTER TABLE public.user_cognitive_metrics 
    ADD CONSTRAINT regression_risk_check 
    CHECK (regression_risk IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Add check constraint for user_cognitive_age_weekly regression_risk
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'weekly_regression_risk_check'
  ) THEN
    ALTER TABLE public.user_cognitive_age_weekly 
    ADD CONSTRAINT weekly_regression_risk_check 
    CHECK (regression_risk IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- 5) Comments for documentation
COMMENT ON TABLE public.user_cognitive_baselines IS 'WHOOP-style stabilized baseline for Cognitive Age calculation';
COMMENT ON COLUMN public.user_cognitive_baselines.chrono_age_at_onboarding IS 'User chronological age at signup';
COMMENT ON COLUMN public.user_cognitive_baselines.baseline_score_90d IS 'Stabilized 90-day average skill score (AE, RA, CT, IN, S2)';
COMMENT ON COLUMN public.user_cognitive_baselines.baseline_rq_90d IS 'Stabilized 90-day average Reasoning Quality';
COMMENT ON COLUMN public.user_cognitive_baselines.is_baseline_calibrated IS 'True when user has 21+ days of data';

COMMENT ON TABLE public.user_cognitive_age_weekly IS 'Weekly snapshots of Cognitive Age (updated Sundays)';
COMMENT ON COLUMN public.user_cognitive_age_weekly.improvement_points IS 'score_90d - baseline_score_90d';
COMMENT ON COLUMN public.user_cognitive_age_weekly.regression_risk IS 'low/medium/high based on consecutive days below threshold';
COMMENT ON COLUMN public.user_cognitive_age_weekly.regression_streak_days IS 'Days consecutively 10+ points below baseline';
COMMENT ON COLUMN public.user_cognitive_age_weekly.regression_triggered IS 'True if +1 year was applied this week';

COMMENT ON COLUMN public.daily_metric_snapshots.did_training IS 'True if user completed at least 1 training session that day';