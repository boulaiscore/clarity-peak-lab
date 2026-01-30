-- Create intraday metric events table for real-time event logging
CREATE TABLE public.intraday_metric_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL, -- 'decay', 'task', 'game', 'detox', 'walking', 'app_open'
  
  -- Metric values at the moment of the event
  readiness NUMERIC,
  sharpness NUMERIC,
  recovery NUMERIC,
  reasoning_quality NUMERIC,
  
  -- Optional metadata
  event_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by user and date
CREATE INDEX idx_intraday_events_user_date ON public.intraday_metric_events (user_id, event_date);
CREATE INDEX idx_intraday_events_timestamp ON public.intraday_metric_events (event_timestamp);

-- Enable RLS
ALTER TABLE public.intraday_metric_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view their own intraday events"
  ON public.intraday_metric_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own intraday events"
  ON public.intraday_metric_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own old events (cleanup)
CREATE POLICY "Users can delete their own intraday events"
  ON public.intraday_metric_events
  FOR DELETE
  USING (auth.uid() = user_id);