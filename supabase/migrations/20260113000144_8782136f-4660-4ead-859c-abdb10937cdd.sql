-- Create walking_sessions table to track walking during recovery/podcast
CREATE TABLE public.walking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  detox_session_id UUID REFERENCES public.detox_sessions(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  distance_meters INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.walking_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own walking sessions
CREATE POLICY "Users can view their own walking sessions"
ON public.walking_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own walking sessions
CREATE POLICY "Users can create their own walking sessions"
ON public.walking_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own walking sessions
CREATE POLICY "Users can update their own walking sessions"
ON public.walking_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own walking sessions
CREATE POLICY "Users can delete their own walking sessions"
ON public.walking_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_walking_sessions_updated_at
BEFORE UPDATE ON public.walking_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add walking tracking columns to detox_sessions
ALTER TABLE public.detox_sessions 
ADD COLUMN IF NOT EXISTS walking_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS walking_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS walking_distance_meters INTEGER DEFAULT 0;

-- Add daily recovery target to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_recovery_target_minutes INTEGER DEFAULT 30;