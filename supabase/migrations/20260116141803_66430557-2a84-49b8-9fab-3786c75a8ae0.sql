-- Add IANA timezone column to profiles table
-- Default to 'UTC' for existing users; app will prompt to set on first use
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London). Used for day boundary calculations.';