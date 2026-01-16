-- Add global last_xp_at timestamp for XP tracking
ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS last_xp_at TIMESTAMPTZ;

-- Convert skill XP date columns to timestamps for more precision
-- First drop the DATE columns and recreate as TIMESTAMPTZ
ALTER TABLE public.user_cognitive_metrics 
DROP COLUMN IF EXISTS last_ae_xp_date,
DROP COLUMN IF EXISTS last_ra_xp_date,
DROP COLUMN IF EXISTS last_ct_xp_date,
DROP COLUMN IF EXISTS last_in_xp_date;

ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS last_ae_xp_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_ra_xp_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_ct_xp_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_in_xp_at TIMESTAMPTZ;

-- Add daily snapshot tracking for REC streak (idempotent daily updates)
ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS rec_snapshot_date DATE,
ADD COLUMN IF NOT EXISTS rec_snapshot_value NUMERIC,
ADD COLUMN IF NOT EXISTS low_rec_streak_days INTEGER DEFAULT 0;