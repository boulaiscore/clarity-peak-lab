-- Add primary_device column to profiles table
-- Values: 'apple_health', 'whoop', 'oura', 'garmin', 'other', NULL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_device TEXT DEFAULT NULL;