-- Add RRI (Recovery Readiness Init) columns to profiles table
-- These store onboarding answers for initial recovery estimate

-- Sleep last 2 days: '<5h', '5-6h', '6-7h', '7-8h', '>8h'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rri_sleep_hours text DEFAULT NULL;

-- Mental detox last 2 days: 'almost_none', '<30min', '30-60min', '1-2h', '>2h'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rri_detox_hours text DEFAULT NULL;

-- Current mental state: 'very_tired', 'bit_tired', 'ok', 'clear', 'very_clear'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rri_mental_state text DEFAULT NULL;

-- Computed RRI value (35-55 range)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rri_value integer DEFAULT NULL;

-- Timestamp when RRI was set (for 72h expiry)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rri_set_at timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.rri_value IS 'Recovery Readiness Init: temporary estimate (35-55) used until first detox/walk';