-- =============================================
-- REASON SESSIONS TABLE
-- Tracks reading/listening sessions Strava-style
-- =============================================

CREATE TABLE public.reason_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Session type
  session_type TEXT NOT NULL CHECK (session_type IN ('reading', 'listening')),
  
  -- Source: LOOMA curated list or custom item
  source TEXT NOT NULL CHECK (source IN ('looma_list', 'custom')),
  
  -- For LOOMA list items
  item_id TEXT,
  
  -- For custom items
  custom_title TEXT,
  custom_author TEXT,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Weight calculation (0.8 - 1.6 range)
  weight NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0.8 AND weight <= 1.6),
  
  -- Proof level for anti-cheat
  proof_level TEXT NOT NULL DEFAULT 'timer_only' CHECK (proof_level IN ('timer_only', 'timer_foreground')),
  background_interrupts INTEGER NOT NULL DEFAULT 0,
  
  -- Validation
  is_valid_for_rq BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reason_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reason sessions"
  ON public.reason_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reason sessions"
  ON public.reason_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reason sessions"
  ON public.reason_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reason sessions"
  ON public.reason_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reason_sessions_updated_at
  BEFORE UPDATE ON public.reason_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_reason_sessions_user_date ON public.reason_sessions (user_id, started_at DESC);
CREATE INDEX idx_reason_sessions_valid ON public.reason_sessions (user_id, is_valid_for_rq, started_at DESC);