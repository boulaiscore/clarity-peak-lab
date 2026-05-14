ALTER TABLE public.phone_health_snapshots
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS available_sources text[] DEFAULT '{}'::text[];