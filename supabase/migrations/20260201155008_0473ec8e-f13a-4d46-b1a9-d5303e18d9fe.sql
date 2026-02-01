-- ============================================
-- COGNITIVE AGE V2 - DATABASE SCHEMA
-- ============================================

-- 1. Add new columns to user_cognitive_age_weekly
ALTER TABLE public.user_cognitive_age_weekly
ADD COLUMN IF NOT EXISTS regression_penalty_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS perf_short_30d NUMERIC,
ADD COLUMN IF NOT EXISTS perf_long_180d NUMERIC,
ADD COLUMN IF NOT EXISTS pace_of_aging_x NUMERIC,
ADD COLUMN IF NOT EXISTS engagement_index NUMERIC,
ADD COLUMN IF NOT EXISTS sessions_30d INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pre_regression_warning JSONB;

-- 2. Create daily tracking table for accurate streak detection
CREATE TABLE IF NOT EXISTS public.user_cognitive_age_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calc_date DATE NOT NULL,
  perf_daily NUMERIC,
  perf_21d NUMERIC,
  perf_30d NUMERIC,
  perf_180d NUMERIC,
  below_threshold BOOLEAN DEFAULT false,
  regression_streak_days INTEGER DEFAULT 0,
  rq_today NUMERIC,
  sessions_today INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, calc_date)
);

-- 3. Enable RLS on new table
ALTER TABLE public.user_cognitive_age_daily ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for user_cognitive_age_daily
CREATE POLICY "Users can view their own daily cognitive age"
ON public.user_cognitive_age_daily
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily cognitive age"
ON public.user_cognitive_age_daily
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Add UPDATE policy to user_cognitive_age_weekly (needed for v2 logic)
CREATE POLICY "Users can update their own weekly cognitive age"
ON public.user_cognitive_age_weekly
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_cognitive_age_daily_user_date 
ON public.user_cognitive_age_daily(user_id, calc_date DESC);