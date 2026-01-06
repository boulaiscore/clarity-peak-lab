-- Add daily detox goal settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_detox_goal_minutes integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS detox_reminder_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS detox_reminder_time text DEFAULT '20:00';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.daily_detox_goal_minutes IS 'Daily detox goal in minutes (default 60)';
COMMENT ON COLUMN public.profiles.detox_reminder_enabled IS 'Whether to send reminder if daily detox goal not reached';
COMMENT ON COLUMN public.profiles.detox_reminder_time IS 'Time to send detox reminder notification (HH:mm format)';