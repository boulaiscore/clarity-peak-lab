-- Direct wearable connections are deliberately split into user-visible
-- metadata and service-only OAuth credentials. Client roles can never read
-- provider tokens.

CREATE TABLE IF NOT EXISTS public.wearable_provider_connections (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('whoop', 'oura')),
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'revoked')),
  provider_user_id text,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  is_primary boolean NOT NULL DEFAULT false,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

CREATE UNIQUE INDEX IF NOT EXISTS wearable_provider_one_primary_idx
  ON public.wearable_provider_connections (user_id)
  WHERE is_primary AND status = 'connected';

ALTER TABLE public.wearable_provider_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their wearable connections" ON public.wearable_provider_connections;
CREATE POLICY "Users can view their wearable connections"
ON public.wearable_provider_connections
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wearable_provider_tokens (
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at timestamptz,
  token_type text NOT NULL DEFAULT 'Bearer',
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider),
  FOREIGN KEY (user_id, provider)
    REFERENCES public.wearable_provider_connections(user_id, provider)
    ON DELETE CASCADE
);

ALTER TABLE public.wearable_provider_tokens ENABLE ROW LEVEL SECURITY;
-- Intentionally no client policy: only service-role Edge Functions may read
-- or modify encrypted OAuth credentials.

CREATE TABLE IF NOT EXISTS public.wearable_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('whoop', 'oura')),
  return_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wearable_oauth_states_expiry_idx
  ON public.wearable_oauth_states (expires_at);

ALTER TABLE public.wearable_oauth_states ENABLE ROW LEVEL SECURITY;
-- Intentionally no client policy: state is created and consumed server-side.

-- A provider connection marked primary wins when the same signal is available
-- from both the direct API and Apple Health / Health Connect. Selection is
-- field-by-field so a source missing RHR, for example, cannot erase a valid RHR
-- supplied by the system health hub.
CREATE OR REPLACE VIEW public.wearable_daily_canonical
WITH (security_invoker = true)
AS
WITH ranked AS (
  SELECT
    ws.*,
    CASE
      WHEN pc.is_primary AND ws.source = pc.provider || '_direct' THEN 10
      WHEN ws.source IN ('whoop_direct', 'oura_direct') THEN 20
      WHEN ws.source IN ('healthkit', 'health_connect') THEN 30
      ELSE 40
    END AS source_priority
  FROM public.wearable_snapshots ws
  LEFT JOIN public.wearable_provider_connections pc
    ON pc.user_id = ws.user_id
   AND pc.status = 'connected'
   AND ws.source = pc.provider || '_direct'
), merged AS (
  SELECT
    user_id,
    date,
    (array_agg(hrv_ms ORDER BY source_priority, updated_at DESC)
      FILTER (WHERE hrv_ms IS NOT NULL))[1] AS hrv_ms,
    (array_agg(resting_hr ORDER BY source_priority, updated_at DESC)
      FILTER (WHERE resting_hr IS NOT NULL))[1] AS resting_hr,
    (array_agg(sleep_duration_min ORDER BY source_priority, updated_at DESC)
      FILTER (WHERE sleep_duration_min IS NOT NULL))[1] AS sleep_duration_min,
    (array_agg(sleep_efficiency ORDER BY source_priority, updated_at DESC)
      FILTER (WHERE sleep_efficiency IS NOT NULL))[1] AS sleep_efficiency,
    (array_agg(activity_score ORDER BY source_priority, updated_at DESC)
      FILTER (WHERE activity_score IS NOT NULL))[1] AS activity_score,
    (array_agg(source ORDER BY source_priority, updated_at DESC))[1] AS source,
    max(updated_at) AS updated_at
  FROM ranked
  GROUP BY user_id, date
)
SELECT * FROM merged;

GRANT SELECT ON public.wearable_daily_canonical TO authenticated;

COMMENT ON VIEW public.wearable_daily_canonical IS
  'One de-duplicated wearable row per user/day, merged field-by-field using explicit source precedence.';

