-- Create table for daily metric snapshots (readiness, sharpness, recovery, reasoning quality)
CREATE TABLE public.daily_metric_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Core metrics
  readiness NUMERIC(5,2),
  sharpness NUMERIC(5,2),
  recovery NUMERIC(5,2),
  reasoning_quality NUMERIC(5,2),
  
  -- Additional context (optional)
  s1 NUMERIC(5,2),
  s2 NUMERIC(5,2),
  ae NUMERIC(5,2),
  ra NUMERIC(5,2),
  ct NUMERIC(5,2),
  in_score NUMERIC(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one snapshot per user per day
  CONSTRAINT unique_user_date UNIQUE (user_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.daily_metric_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own snapshots"
ON public.daily_metric_snapshots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
ON public.daily_metric_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots"
ON public.daily_metric_snapshots
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for efficient date-range queries
CREATE INDEX idx_daily_metric_snapshots_user_date 
ON public.daily_metric_snapshots (user_id, snapshot_date DESC);