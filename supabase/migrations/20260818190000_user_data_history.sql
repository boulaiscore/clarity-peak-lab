-- LOOMA canonical user data history.
--
-- The product keeps fast mutable projections for Home, but every meaningful
-- source revision and metric change is appended here so historical values,
-- formula versions and model inputs remain auditable over time.

ALTER TABLE public.daily_metric_snapshots
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS formula_version text,
  ADD COLUMN IF NOT EXISTS signal_coverage numeric(5,4),
  ADD COLUMN IF NOT EXISTS confidence numeric(5,4),
  ADD COLUMN IF NOT EXISTS source_freshness jsonb,
  ADD COLUMN IF NOT EXISTS timezone text;

UPDATE public.daily_metric_snapshots
SET updated_at = created_at
WHERE updated_at IS NULL;

UPDATE public.daily_metric_snapshots
SET formula_version = 'metric-integrity-2026-08'
WHERE formula_version IS NULL;

UPDATE public.daily_metric_snapshots
SET source_freshness = '{}'::jsonb
WHERE source_freshness IS NULL;

ALTER TABLE public.daily_metric_snapshots
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN formula_version SET DEFAULT 'metric-integrity-2026-08',
  ALTER COLUMN formula_version SET NOT NULL,
  ALTER COLUMN source_freshness SET DEFAULT '{}'::jsonb,
  ALTER COLUMN source_freshness SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.daily_metric_snapshots
    ADD CONSTRAINT daily_metric_snapshots_signal_coverage_check
      CHECK (signal_coverage IS NULL OR signal_coverage BETWEEN 0 AND 1),
    ADD CONSTRAINT daily_metric_snapshots_confidence_check
      CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    ADD CONSTRAINT daily_metric_snapshots_source_freshness_object_check
      CHECK (jsonb_typeof(source_freshness) = 'object');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_daily_metric_snapshots_updated_at
  ON public.daily_metric_snapshots;
CREATE TRIGGER update_daily_metric_snapshots_updated_at
BEFORE UPDATE ON public.daily_metric_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- An event log, not a mutable boolean. Revoking consent creates a new row so
-- the exact permission history and policy version remain auditable.
CREATE TABLE IF NOT EXISTS public.data_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 80),
  purpose text NOT NULL CHECK (char_length(purpose) BETWEEN 1 AND 120),
  action text NOT NULL CHECK (action IN ('granted', 'limited', 'denied', 'revoked')),
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  policy_version text NOT NULL CHECK (char_length(policy_version) BETWEEN 1 AND 80),
  actor text NOT NULL DEFAULT 'user' CHECK (actor IN ('user', 'system', 'provider')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_consent_events_user_time_idx
  ON public.data_consent_events (user_id, occurred_at DESC);

ALTER TABLE public.data_consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consent history" ON public.data_consent_events;
CREATE POLICY "Users can view own consent history"
ON public.data_consent_events FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can append own consent events" ON public.data_consent_events;
CREATE POLICY "Users can append own consent events"
ON public.data_consent_events FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id AND actor = 'user');

GRANT SELECT, INSERT ON public.data_consent_events TO authenticated;
GRANT ALL ON public.data_consent_events TO service_role;

CREATE OR REPLACE VIEW public.current_data_consents
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (user_id, source, purpose)
  id,
  user_id,
  source,
  purpose,
  action,
  scopes,
  policy_version,
  actor,
  metadata,
  occurred_at
FROM public.data_consent_events
ORDER BY user_id, source, purpose, occurred_at DESC, created_at DESC;

GRANT SELECT ON public.current_data_consents TO authenticated;

-- Immutable, normalized copies of every daily aggregate revision. Provider
-- payloads, app identities, calendar content and OAuth credentials are never
-- copied into this table.
CREATE TABLE IF NOT EXISTS public.canonical_observation_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL CHECK (domain IN ('health', 'digital', 'calendar', 'features')),
  source text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 80),
  observation_date date NOT NULL,
  recorded_at timestamptz NOT NULL,
  schema_version text NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 80),
  source_table text NOT NULL CHECK (char_length(source_table) BETWEEN 1 AND 80),
  source_record_id uuid NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  quality jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(quality) = 'object'),
  fingerprint text NOT NULL CHECK (char_length(fingerprint) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_record_id, recorded_at, fingerprint)
);

CREATE INDEX IF NOT EXISTS canonical_observation_revisions_user_date_idx
  ON public.canonical_observation_revisions (user_id, observation_date DESC, recorded_at DESC);
CREATE INDEX IF NOT EXISTS canonical_observation_revisions_user_domain_idx
  ON public.canonical_observation_revisions (user_id, domain, recorded_at DESC);

ALTER TABLE public.canonical_observation_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own observation history"
  ON public.canonical_observation_revisions;
CREATE POLICY "Users can view own observation history"
ON public.canonical_observation_revisions FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

GRANT SELECT ON public.canonical_observation_revisions TO authenticated;
GRANT ALL ON public.canonical_observation_revisions TO service_role;

CREATE OR REPLACE FUNCTION public.capture_canonical_observation_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
  v_source text;
  v_date date;
  v_recorded_at timestamptz;
  v_schema_version text := 'canonical-observation-v1';
  v_payload jsonb;
  v_quality jsonb := '{}'::jsonb;
  v_fingerprint text;
  v_previous_fingerprint text;
BEGIN
  IF TG_TABLE_NAME = 'wearable_snapshots' THEN
    v_domain := 'health';
    v_source := NEW.source;
    v_date := NEW.date;
    v_recorded_at := COALESCE(NEW.updated_at, NEW.created_at, now());
    v_payload := jsonb_strip_nulls(jsonb_build_object(
      'hrv_ms', NEW.hrv_ms,
      'resting_hr_bpm', NEW.resting_hr,
      'sleep_duration_min', NEW.sleep_duration_min,
      'sleep_efficiency', NEW.sleep_efficiency,
      'activity_score', NEW.activity_score
    ));
    v_quality := jsonb_build_object('aggregation', 'daily');
  ELSIF TG_TABLE_NAME = 'phone_health_snapshots' THEN
    v_domain := 'health';
    v_source := NEW.source;
    v_date := NEW.date;
    v_recorded_at := COALESCE(NEW.updated_at, NEW.created_at, now());
    v_payload := jsonb_strip_nulls(jsonb_build_object(
      'sleep_min', NEW.sleep_min,
      'bedtime_deviation_min', NEW.bedtime_dev_min,
      'steps', NEW.steps,
      'active_min', NEW.active_min,
      'pickups', NEW.pickups,
      'phone_health_index', NEW.phi,
      'recovery_target', NEW.target_rec
    ));
    v_quality := jsonb_strip_nulls(jsonb_build_object(
      'confidence', NEW.confidence,
      'available_sources', NEW.available_sources
    ));
  ELSIF TG_TABLE_NAME = 'device_usage_snapshots' THEN
    v_domain := 'digital';
    v_source := NEW.source;
    v_date := NEW.snapshot_date;
    v_recorded_at := COALESCE(NEW.updated_at, NEW.created_at, now());
    v_payload := jsonb_strip_nulls(jsonb_build_object(
      'coverage', NEW.coverage,
      'attention_usage_min', NEW.attention_usage_min,
      'active_app_count', NEW.active_app_count,
      'attention_session_count', NEW.attention_session_count,
      'attention_switch_count', NEW.attention_switch_count,
      'brief_session_count', NEW.brief_session_count,
      'last_attention_use_at', NEW.last_attention_use_at
    ));
    v_quality := jsonb_build_object(
      'permission_state', NEW.permission_state,
      'confidence', NEW.confidence
    );
  ELSIF TG_TABLE_NAME = 'calendar_context_snapshots' THEN
    v_domain := 'calendar';
    v_source := NEW.source;
    v_date := NEW.snapshot_date;
    v_recorded_at := COALESCE(NEW.updated_at, NEW.created_at, now());
    v_payload := jsonb_strip_nulls(jsonb_build_object(
      'busy_minutes', NEW.busy_minutes,
      'meeting_count', NEW.meeting_count,
      'longest_meeting_minutes', NEW.longest_meeting_minutes,
      'first_event_minute', NEW.first_event_minute,
      'last_event_minute', NEW.last_event_minute,
      'longest_open_start_minute', NEW.longest_open_start_minute,
      'longest_open_minutes', NEW.longest_open_minutes
    ));
    v_quality := jsonb_build_object(
      'permission_state', NEW.permission_state,
      'confidence', NEW.confidence
    );
  ELSIF TG_TABLE_NAME = 'adaptive_daily_feature_snapshots' THEN
    v_domain := 'features';
    v_source := 'adaptive_coach';
    v_date := NEW.feature_date;
    v_recorded_at := COALESCE(NEW.updated_at, NEW.created_at, now());
    v_schema_version := NEW.schema_version;
    v_payload := jsonb_build_object(
      'metrics', NEW.metrics,
      'behavior', NEW.behavior,
      'health', NEW.health,
      'device_usage', NEW.device_usage
    );
    v_quality := NEW.availability;
  ELSE
    RAISE EXCEPTION 'Unsupported observation source table: %', TG_TABLE_NAME;
  END IF;

  v_fingerprint := md5(v_payload::text || '|' || v_quality::text);

  SELECT revision.fingerprint
  INTO v_previous_fingerprint
  FROM public.canonical_observation_revisions revision
  WHERE revision.source_table = TG_TABLE_NAME
    AND revision.source_record_id = NEW.id
  ORDER BY revision.recorded_at DESC, revision.created_at DESC
  LIMIT 1;

  -- Sync jobs may touch `updated_at` even when a provider returns the same
  -- aggregate. Keep real state changes, not duplicate polling revisions.
  IF v_previous_fingerprint IS NOT DISTINCT FROM v_fingerprint THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.canonical_observation_revisions (
    user_id,
    domain,
    source,
    observation_date,
    recorded_at,
    schema_version,
    source_table,
    source_record_id,
    payload,
    quality,
    fingerprint
  ) VALUES (
    NEW.user_id,
    v_domain,
    v_source,
    v_date,
    v_recorded_at,
    v_schema_version,
    TG_TABLE_NAME,
    NEW.id,
    v_payload,
    v_quality,
    v_fingerprint
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_wearable_observation_revision ON public.wearable_snapshots;
CREATE TRIGGER capture_wearable_observation_revision
AFTER INSERT OR UPDATE ON public.wearable_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_canonical_observation_revision();

DROP TRIGGER IF EXISTS capture_phone_health_observation_revision ON public.phone_health_snapshots;
CREATE TRIGGER capture_phone_health_observation_revision
AFTER INSERT OR UPDATE ON public.phone_health_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_canonical_observation_revision();

DROP TRIGGER IF EXISTS capture_device_usage_observation_revision ON public.device_usage_snapshots;
CREATE TRIGGER capture_device_usage_observation_revision
AFTER INSERT OR UPDATE ON public.device_usage_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_canonical_observation_revision();

DROP TRIGGER IF EXISTS capture_calendar_observation_revision ON public.calendar_context_snapshots;
CREATE TRIGGER capture_calendar_observation_revision
AFTER INSERT OR UPDATE ON public.calendar_context_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_canonical_observation_revision();

DROP TRIGGER IF EXISTS capture_adaptive_feature_revision ON public.adaptive_daily_feature_snapshots;
CREATE TRIGGER capture_adaptive_feature_revision
AFTER INSERT OR UPDATE ON public.adaptive_daily_feature_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_canonical_observation_revision();

-- Seed the immutable history with the latest normalized projection already
-- present at rollout. Subsequent upserts are captured by the triggers above.
WITH normalized AS (
  SELECT
    snapshot.id,
    snapshot.user_id,
    snapshot.source,
    snapshot.date AS observation_date,
    COALESCE(snapshot.updated_at, snapshot.created_at) AS recorded_at,
    jsonb_strip_nulls(jsonb_build_object(
      'hrv_ms', snapshot.hrv_ms,
      'resting_hr_bpm', snapshot.resting_hr,
      'sleep_duration_min', snapshot.sleep_duration_min,
      'sleep_efficiency', snapshot.sleep_efficiency,
      'activity_score', snapshot.activity_score
    )) AS payload,
    jsonb_build_object('aggregation', 'daily') AS quality
  FROM public.wearable_snapshots snapshot
)
INSERT INTO public.canonical_observation_revisions (
  user_id, domain, source, observation_date, recorded_at, schema_version,
  source_table, source_record_id, payload, quality, fingerprint
)
SELECT
  user_id,
  'health',
  source,
  observation_date,
  recorded_at,
  'canonical-observation-v1',
  'wearable_snapshots',
  id,
  payload,
  quality,
  md5(payload::text || '|' || quality::text)
FROM normalized
ON CONFLICT DO NOTHING;

WITH normalized AS (
  SELECT
    snapshot.id,
    snapshot.user_id,
    snapshot.source,
    snapshot.date AS observation_date,
    COALESCE(snapshot.updated_at, snapshot.created_at) AS recorded_at,
    jsonb_strip_nulls(jsonb_build_object(
      'sleep_min', snapshot.sleep_min,
      'bedtime_deviation_min', snapshot.bedtime_dev_min,
      'steps', snapshot.steps,
      'active_min', snapshot.active_min,
      'pickups', snapshot.pickups,
      'phone_health_index', snapshot.phi,
      'recovery_target', snapshot.target_rec
    )) AS payload,
    jsonb_strip_nulls(jsonb_build_object(
      'confidence', snapshot.confidence,
      'available_sources', snapshot.available_sources
    )) AS quality
  FROM public.phone_health_snapshots snapshot
)
INSERT INTO public.canonical_observation_revisions (
  user_id, domain, source, observation_date, recorded_at, schema_version,
  source_table, source_record_id, payload, quality, fingerprint
)
SELECT
  user_id,
  'health',
  source,
  observation_date,
  recorded_at,
  'canonical-observation-v1',
  'phone_health_snapshots',
  id,
  payload,
  quality,
  md5(payload::text || '|' || quality::text)
FROM normalized
ON CONFLICT DO NOTHING;

WITH normalized AS (
  SELECT
    snapshot.id,
    snapshot.user_id,
    snapshot.source,
    snapshot.snapshot_date AS observation_date,
    COALESCE(snapshot.updated_at, snapshot.created_at) AS recorded_at,
    jsonb_strip_nulls(jsonb_build_object(
      'coverage', snapshot.coverage,
      'attention_usage_min', snapshot.attention_usage_min,
      'active_app_count', snapshot.active_app_count,
      'attention_session_count', snapshot.attention_session_count,
      'attention_switch_count', snapshot.attention_switch_count,
      'brief_session_count', snapshot.brief_session_count,
      'last_attention_use_at', snapshot.last_attention_use_at
    )) AS payload,
    jsonb_build_object(
      'permission_state', snapshot.permission_state,
      'confidence', snapshot.confidence
    ) AS quality
  FROM public.device_usage_snapshots snapshot
)
INSERT INTO public.canonical_observation_revisions (
  user_id, domain, source, observation_date, recorded_at, schema_version,
  source_table, source_record_id, payload, quality, fingerprint
)
SELECT
  user_id,
  'digital',
  source,
  observation_date,
  recorded_at,
  'canonical-observation-v1',
  'device_usage_snapshots',
  id,
  payload,
  quality,
  md5(payload::text || '|' || quality::text)
FROM normalized
ON CONFLICT DO NOTHING;

WITH normalized AS (
  SELECT
    snapshot.id,
    snapshot.user_id,
    snapshot.source,
    snapshot.snapshot_date AS observation_date,
    COALESCE(snapshot.updated_at, snapshot.created_at) AS recorded_at,
    jsonb_strip_nulls(jsonb_build_object(
      'busy_minutes', snapshot.busy_minutes,
      'meeting_count', snapshot.meeting_count,
      'longest_meeting_minutes', snapshot.longest_meeting_minutes,
      'first_event_minute', snapshot.first_event_minute,
      'last_event_minute', snapshot.last_event_minute,
      'longest_open_start_minute', snapshot.longest_open_start_minute,
      'longest_open_minutes', snapshot.longest_open_minutes
    )) AS payload,
    jsonb_build_object(
      'permission_state', snapshot.permission_state,
      'confidence', snapshot.confidence
    ) AS quality
  FROM public.calendar_context_snapshots snapshot
)
INSERT INTO public.canonical_observation_revisions (
  user_id, domain, source, observation_date, recorded_at, schema_version,
  source_table, source_record_id, payload, quality, fingerprint
)
SELECT
  user_id,
  'calendar',
  source,
  observation_date,
  recorded_at,
  'canonical-observation-v1',
  'calendar_context_snapshots',
  id,
  payload,
  quality,
  md5(payload::text || '|' || quality::text)
FROM normalized
ON CONFLICT DO NOTHING;

WITH normalized AS (
  SELECT
    snapshot.id,
    snapshot.user_id,
    snapshot.feature_date AS observation_date,
    snapshot.schema_version,
    COALESCE(snapshot.updated_at, snapshot.created_at) AS recorded_at,
    jsonb_build_object(
      'metrics', snapshot.metrics,
      'behavior', snapshot.behavior,
      'health', snapshot.health,
      'device_usage', snapshot.device_usage
    ) AS payload,
    snapshot.availability AS quality
  FROM public.adaptive_daily_feature_snapshots snapshot
)
INSERT INTO public.canonical_observation_revisions (
  user_id, domain, source, observation_date, recorded_at, schema_version,
  source_table, source_record_id, payload, quality, fingerprint
)
SELECT
  user_id,
  'features',
  'adaptive_coach',
  observation_date,
  recorded_at,
  schema_version,
  'adaptive_daily_feature_snapshots',
  id,
  payload,
  quality,
  md5(payload::text || '|' || quality::text)
FROM normalized
ON CONFLICT DO NOTHING;

-- One row per metric change. `calculation_id` groups all metrics emitted by the
-- same calculation, while `source_record_id` links the value to its projection.
CREATE TABLE IF NOT EXISTS public.metric_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_code text NOT NULL CHECK (metric_code IN (
    'ae', 'ra', 'ct', 'in', 's1', 's2', 'sharpness', 'readiness',
    'recovery', 'reasoning_quality', 'cognitive_performance'
  )),
  value numeric(6,2) NOT NULL CHECK (value BETWEEN 0 AND 100),
  confidence numeric(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  coverage numeric(5,4) CHECK (coverage IS NULL OR coverage BETWEEN 0 AND 1),
  effective_at timestamptz NOT NULL,
  local_date date,
  formula_version text NOT NULL CHECK (char_length(formula_version) BETWEEN 1 AND 80),
  source_table text NOT NULL CHECK (char_length(source_table) BETWEEN 1 AND 80),
  source_record_id uuid NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('daily_snapshot', 'state_update', 'backfill')),
  lineage jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(lineage) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_record_id, metric_code, effective_at)
);

CREATE INDEX IF NOT EXISTS metric_estimates_user_metric_time_idx
  ON public.metric_estimates (user_id, metric_code, effective_at DESC);
CREATE INDEX IF NOT EXISTS metric_estimates_user_date_idx
  ON public.metric_estimates (user_id, local_date DESC, effective_at DESC);
CREATE INDEX IF NOT EXISTS metric_estimates_calculation_idx
  ON public.metric_estimates (calculation_id);

ALTER TABLE public.metric_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metric history" ON public.metric_estimates;
CREATE POLICY "Users can view own metric history"
ON public.metric_estimates FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

GRANT SELECT ON public.metric_estimates TO authenticated;
GRANT ALL ON public.metric_estimates TO service_role;

CREATE OR REPLACE FUNCTION public.capture_daily_metric_estimates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calculation_id uuid := gen_random_uuid();
  v_effective_at timestamptz := clock_timestamp();
  v_new_values jsonb;
  v_old_values jsonb := '{}'::jsonb;
  v_item record;
  v_formula_version text;
BEGIN
  v_new_values := jsonb_build_object(
    'sharpness', NEW.sharpness,
    'readiness', NEW.readiness,
    'recovery', NEW.recovery,
    'reasoning_quality', NEW.reasoning_quality,
    's1', NEW.s1,
    's2', NEW.s2,
    'ae', NEW.ae,
    'ra', NEW.ra,
    'ct', NEW.ct,
    'in', NEW.in_score
  );

  IF TG_OP = 'UPDATE' THEN
    v_old_values := jsonb_build_object(
      'sharpness', OLD.sharpness,
      'readiness', OLD.readiness,
      'recovery', OLD.recovery,
      'reasoning_quality', OLD.reasoning_quality,
      's1', OLD.s1,
      's2', OLD.s2,
      'ae', OLD.ae,
      'ra', OLD.ra,
      'ct', OLD.ct,
      'in', OLD.in_score
    );
  END IF;

  FOR v_item IN SELECT key, value FROM jsonb_each(v_new_values)
  LOOP
    IF v_item.value <> 'null'::jsonb
       AND (TG_OP = 'INSERT' OR v_old_values -> v_item.key IS DISTINCT FROM v_item.value) THEN
      v_formula_version := CASE v_item.key
        WHEN 'recovery' THEN 'recovery-v2'
        WHEN 'reasoning_quality' THEN 'reasoning-quality-v2'
        ELSE NEW.formula_version
      END;

      INSERT INTO public.metric_estimates (
        calculation_id,
        user_id,
        metric_code,
        value,
        confidence,
        coverage,
        effective_at,
        local_date,
        formula_version,
        source_table,
        source_record_id,
        event_kind,
        lineage
      ) VALUES (
        v_calculation_id,
        NEW.user_id,
        v_item.key,
        (v_item.value #>> '{}')::numeric,
        NEW.confidence,
        NEW.signal_coverage,
        v_effective_at,
        NEW.snapshot_date,
        v_formula_version,
        TG_TABLE_NAME,
        NEW.id,
        'daily_snapshot',
        jsonb_strip_nulls(jsonb_build_object(
          'timezone', NEW.timezone,
          'projection_updated_at', NEW.updated_at,
          'source_freshness', NEW.source_freshness
        ))
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_daily_metric_estimates_trigger
  ON public.daily_metric_snapshots;
CREATE TRIGGER capture_daily_metric_estimates_trigger
AFTER INSERT OR UPDATE ON public.daily_metric_snapshots
FOR EACH ROW EXECUTE FUNCTION public.capture_daily_metric_estimates();

CREATE OR REPLACE FUNCTION public.capture_cognitive_state_estimates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calculation_id uuid := gen_random_uuid();
  v_effective_at timestamptz := clock_timestamp();
  v_new_values jsonb;
  v_old_values jsonb := '{}'::jsonb;
  v_item record;
  v_formula_version text;
BEGIN
  v_new_values := jsonb_build_object(
    'ae', NEW.focus_stability,
    'ra', NEW.fast_thinking,
    'ct', NEW.reasoning_accuracy,
    'in', NEW.slow_thinking,
    'recovery', NEW.rec_value,
    'reasoning_quality', NEW.reasoning_quality,
    'cognitive_performance', NEW.cognitive_performance_score
  );

  IF TG_OP = 'UPDATE' THEN
    v_old_values := jsonb_build_object(
      'ae', OLD.focus_stability,
      'ra', OLD.fast_thinking,
      'ct', OLD.reasoning_accuracy,
      'in', OLD.slow_thinking,
      'recovery', OLD.rec_value,
      'reasoning_quality', OLD.reasoning_quality,
      'cognitive_performance', OLD.cognitive_performance_score
    );
  END IF;

  FOR v_item IN SELECT key, value FROM jsonb_each(v_new_values)
  LOOP
    IF v_item.value <> 'null'::jsonb
       AND (TG_OP = 'INSERT' OR v_old_values -> v_item.key IS DISTINCT FROM v_item.value) THEN
      v_formula_version := CASE v_item.key
        WHEN 'recovery' THEN 'recovery-v2'
        WHEN 'reasoning_quality' THEN 'reasoning-quality-v2'
        WHEN 'cognitive_performance' THEN 'cognitive-performance-v1'
        ELSE 'cognitive-state-online-update-v1'
      END;

      INSERT INTO public.metric_estimates (
        calculation_id,
        user_id,
        metric_code,
        value,
        effective_at,
        local_date,
        formula_version,
        source_table,
        source_record_id,
        event_kind,
        lineage
      ) VALUES (
        v_calculation_id,
        NEW.user_id,
        v_item.key,
        (v_item.value #>> '{}')::numeric,
        v_effective_at,
        (NEW.updated_at AT TIME ZONE 'UTC')::date,
        v_formula_version,
        TG_TABLE_NAME,
        NEW.id,
        'state_update',
        jsonb_build_object(
          'source', 'persistent_cognitive_state',
          'projection_updated_at', NEW.updated_at
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_cognitive_state_estimates_trigger
  ON public.user_cognitive_metrics;
CREATE TRIGGER capture_cognitive_state_estimates_trigger
AFTER INSERT OR UPDATE ON public.user_cognitive_metrics
FOR EACH ROW EXECUTE FUNCTION public.capture_cognitive_state_estimates();

-- Existing daily summaries become the first auditable historical revision.
INSERT INTO public.metric_estimates (
  calculation_id,
  user_id,
  metric_code,
  value,
  confidence,
  coverage,
  effective_at,
  local_date,
  formula_version,
  source_table,
  source_record_id,
  event_kind,
  lineage
)
SELECT
  snapshot.id,
  snapshot.user_id,
  metric.metric_code,
  metric.value,
  snapshot.confidence,
  snapshot.signal_coverage,
  snapshot.updated_at,
  snapshot.snapshot_date,
  CASE metric.metric_code
    WHEN 'recovery' THEN 'recovery-v2'
    WHEN 'reasoning_quality' THEN 'reasoning-quality-v2'
    ELSE snapshot.formula_version
  END,
  'daily_metric_snapshots',
  snapshot.id,
  'backfill',
  jsonb_build_object('backfilled_from', 'daily_metric_snapshots')
FROM public.daily_metric_snapshots snapshot
CROSS JOIN LATERAL (
  VALUES
    ('sharpness', snapshot.sharpness),
    ('readiness', snapshot.readiness),
    ('recovery', snapshot.recovery),
    ('reasoning_quality', snapshot.reasoning_quality),
    ('s1', snapshot.s1),
    ('s2', snapshot.s2),
    ('ae', snapshot.ae),
    ('ra', snapshot.ra),
    ('ct', snapshot.ct),
    ('in', snapshot.in_score)
) AS metric(metric_code, value)
WHERE metric.value IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW public.user_metric_latest
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (user_id, metric_code)
  id,
  calculation_id,
  user_id,
  metric_code,
  value,
  confidence,
  coverage,
  effective_at,
  local_date,
  formula_version,
  source_table,
  source_record_id,
  lineage
FROM public.metric_estimates
ORDER BY user_id, metric_code, effective_at DESC, created_at DESC;

GRANT SELECT ON public.user_metric_latest TO authenticated;

-- Direct provider metadata is already service-only. Mirror connection status
-- into the append-only consent timeline without exposing OAuth credentials.
CREATE OR REPLACE FUNCTION public.capture_wearable_connection_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.scopes IS NOT DISTINCT FROM OLD.scopes THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'connected' THEN
    v_action := 'granted';
  ELSIF NEW.status = 'revoked' THEN
    v_action := 'revoked';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.data_consent_events (
    user_id,
    source,
    purpose,
    action,
    scopes,
    policy_version,
    actor,
    metadata,
    occurred_at
  ) VALUES (
    NEW.user_id,
    NEW.provider,
    'personalized_cognitive_metrics',
    v_action,
    NEW.scopes,
    'wearable-oauth-v1',
    'provider',
    jsonb_build_object('is_primary', NEW.is_primary),
    COALESCE(NEW.updated_at, now())
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_wearable_connection_consent_trigger
  ON public.wearable_provider_connections;
CREATE TRIGGER capture_wearable_connection_consent_trigger
AFTER INSERT OR UPDATE OF status, scopes ON public.wearable_provider_connections
FOR EACH ROW EXECUTE FUNCTION public.capture_wearable_connection_consent();

INSERT INTO public.data_consent_events (
  user_id,
  source,
  purpose,
  action,
  scopes,
  policy_version,
  actor,
  metadata,
  occurred_at
)
SELECT
  connection.user_id,
  connection.provider,
  'personalized_cognitive_metrics',
  CASE connection.status
    WHEN 'connected' THEN 'granted'
    WHEN 'revoked' THEN 'revoked'
  END,
  connection.scopes,
  'wearable-oauth-v1',
  'provider',
  jsonb_build_object('is_primary', connection.is_primary, 'backfilled', true),
  COALESCE(connection.updated_at, connection.created_at)
FROM public.wearable_provider_connections connection
WHERE connection.status IN ('connected', 'revoked')
  AND NOT EXISTS (
    SELECT 1
    FROM public.data_consent_events existing
    WHERE existing.user_id = connection.user_id
      AND existing.source = connection.provider
      AND existing.purpose = 'personalized_cognitive_metrics'
      AND existing.occurred_at = COALESCE(connection.updated_at, connection.created_at)
  );

-- Deprecated field: keep the column for rollout compatibility, but strip all
-- future raw provider payloads. Canonical daily values are preserved above.
CREATE OR REPLACE FUNCTION public.discard_wearable_raw_payload()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.raw_json := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discard_wearable_raw_payload_trigger ON public.wearable_snapshots;
CREATE TRIGGER discard_wearable_raw_payload_trigger
BEFORE INSERT OR UPDATE OF raw_json ON public.wearable_snapshots
FOR EACH ROW EXECUTE FUNCTION public.discard_wearable_raw_payload();

COMMENT ON COLUMN public.wearable_snapshots.raw_json IS
  'Deprecated compatibility field. New raw provider payloads are discarded; use normalized canonical observations.';

COMMENT ON TABLE public.canonical_observation_revisions IS
  'Immutable revisions of privacy-safe daily source aggregates, keyed by user and time.';
COMMENT ON TABLE public.metric_estimates IS
  'Immutable, versioned metric history. Mutable product tables remain projections, not the historical source of truth.';
COMMENT ON TABLE public.data_consent_events IS
  'Append-only permission and consent history. Current state is exposed through current_data_consents.';
