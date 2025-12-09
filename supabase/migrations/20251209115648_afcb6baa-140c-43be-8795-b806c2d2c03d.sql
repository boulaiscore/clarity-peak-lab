-- Create wearable_snapshots table
CREATE TABLE public.wearable_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  hrv_ms NUMERIC NULL,
  resting_hr NUMERIC NULL,
  sleep_duration_min NUMERIC NULL,
  sleep_efficiency NUMERIC NULL,
  activity_score NUMERIC NULL,
  raw_json JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, source)
);

-- Enable RLS
ALTER TABLE public.wearable_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for wearable_snapshots
CREATE POLICY "Users can view their own wearable snapshots"
ON public.wearable_snapshots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wearable snapshots"
ON public.wearable_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wearable snapshots"
ON public.wearable_snapshots
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wearable_snapshots_updated_at
BEFORE UPDATE ON public.wearable_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add readiness fields to user_cognitive_metrics (existing table)
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS cognitive_performance_score NUMERIC NULL,
ADD COLUMN IF NOT EXISTS physio_component_score NUMERIC NULL,
ADD COLUMN IF NOT EXISTS cognitive_readiness_score NUMERIC NULL,
ADD COLUMN IF NOT EXISTS readiness_classification TEXT NULL;