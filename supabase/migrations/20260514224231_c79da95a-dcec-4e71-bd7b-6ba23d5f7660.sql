
CREATE TABLE public.phone_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  sleep_min NUMERIC,
  bedtime_dev_min NUMERIC,
  steps INTEGER,
  active_min NUMERIC,
  pickups INTEGER,
  phi NUMERIC,
  target_rec NUMERIC,
  source TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.phone_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phone health snapshots"
ON public.phone_health_snapshots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone health snapshots"
ON public.phone_health_snapshots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone health snapshots"
ON public.phone_health_snapshots FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX idx_phone_health_snapshots_user_date
  ON public.phone_health_snapshots (user_id, date DESC);

CREATE TRIGGER update_phone_health_snapshots_updated_at
BEFORE UPDATE ON public.phone_health_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
