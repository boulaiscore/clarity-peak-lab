-- Adaptive Cognitive Coach v2: privacy-safe passive context.
--
-- Device-level rows deliberately contain aggregates only. Package names, app
-- names, visited domains, message content and social identities must never be
-- written to either table.

CREATE TABLE IF NOT EXISTS public.device_usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('android_usage_stats', 'ios_device_activity')),
  coverage text NOT NULL DEFAULT 'attention_apps'
    CHECK (coverage IN ('attention_apps', 'screen_time_categories')),
  attention_usage_min integer CHECK (attention_usage_min IS NULL OR attention_usage_min >= 0),
  active_app_count integer CHECK (active_app_count IS NULL OR active_app_count >= 0),
  last_attention_use_at timestamptz,
  permission_state text NOT NULL DEFAULT 'granted'
    CHECK (permission_state IN ('granted', 'limited', 'denied', 'unavailable')),
  confidence numeric(5,4) NOT NULL DEFAULT 0
    CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date, source)
);

CREATE INDEX IF NOT EXISTS device_usage_snapshots_user_date_idx
  ON public.device_usage_snapshots (user_id, snapshot_date DESC);

ALTER TABLE public.device_usage_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own device usage snapshots" ON public.device_usage_snapshots;
CREATE POLICY "Users can view own device usage snapshots"
ON public.device_usage_snapshots
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own device usage snapshots" ON public.device_usage_snapshots;
CREATE POLICY "Users can insert own device usage snapshots"
ON public.device_usage_snapshots
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own device usage snapshots" ON public.device_usage_snapshots;
CREATE POLICY "Users can update own device usage snapshots"
ON public.device_usage_snapshots
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own device usage snapshots" ON public.device_usage_snapshots;
CREATE POLICY "Users can delete own device usage snapshots"
ON public.device_usage_snapshots
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_device_usage_snapshots_updated_at ON public.device_usage_snapshots;
CREATE TRIGGER update_device_usage_snapshots_updated_at
BEFORE UPDATE ON public.device_usage_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.device_usage_snapshots IS
  'User-owned daily device-use aggregates. Never stores package/app names, domains, content, contacts or social identities.';

CREATE TABLE IF NOT EXISTS public.adaptive_daily_feature_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_date date NOT NULL,
  schema_version text NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 80),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metrics) = 'object'),
  behavior jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(behavior) = 'object'),
  health jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(health) = 'object'),
  device_usage jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(device_usage) = 'object'),
  availability jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(availability) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_date, schema_version)
);

CREATE INDEX IF NOT EXISTS adaptive_daily_feature_snapshots_user_date_idx
  ON public.adaptive_daily_feature_snapshots (user_id, feature_date DESC);

ALTER TABLE public.adaptive_daily_feature_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own adaptive feature snapshots" ON public.adaptive_daily_feature_snapshots;
CREATE POLICY "Users can view own adaptive feature snapshots"
ON public.adaptive_daily_feature_snapshots
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own adaptive feature snapshots" ON public.adaptive_daily_feature_snapshots;
CREATE POLICY "Users can insert own adaptive feature snapshots"
ON public.adaptive_daily_feature_snapshots
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own adaptive feature snapshots" ON public.adaptive_daily_feature_snapshots;
CREATE POLICY "Users can update own adaptive feature snapshots"
ON public.adaptive_daily_feature_snapshots
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own adaptive feature snapshots" ON public.adaptive_daily_feature_snapshots;
CREATE POLICY "Users can delete own adaptive feature snapshots"
ON public.adaptive_daily_feature_snapshots
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_adaptive_daily_feature_snapshots_updated_at ON public.adaptive_daily_feature_snapshots;
CREATE TRIGGER update_adaptive_daily_feature_snapshots_updated_at
BEFORE UPDATE ON public.adaptive_daily_feature_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.adaptive_daily_feature_snapshots IS
  'Versioned daily features for the explainable shadow coach. Inputs remain user-owned and cannot activate training changes.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_usage_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adaptive_daily_feature_snapshots TO authenticated;
GRANT ALL ON public.device_usage_snapshots TO service_role;
GRANT ALL ON public.adaptive_daily_feature_snapshots TO service_role;