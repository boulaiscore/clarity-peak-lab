-- Add daily session tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_sessions_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_date date;