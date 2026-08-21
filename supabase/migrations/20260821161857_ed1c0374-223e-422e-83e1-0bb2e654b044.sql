ALTER TABLE public.daily_metric_snapshots
  ADD COLUMN IF NOT EXISTS formula_version TEXT,
  ADD COLUMN IF NOT EXISTS signal_coverage NUMERIC,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS source_freshness JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS timezone TEXT;