-- Add monthly report tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_report_credits integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_report_reset_at date;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.monthly_report_credits IS 'Report credits available this month (Premium gets 1/month, Pro ignores this)';
COMMENT ON COLUMN public.profiles.monthly_report_reset_at IS 'Date when monthly credits were last reset';