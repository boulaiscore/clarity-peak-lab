-- Add reminder fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reminder_time time DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false;