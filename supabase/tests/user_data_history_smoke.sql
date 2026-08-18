BEGIN;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'history-smoke@example.com',
  '',
  now(),
  now()
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'history-foreign@example.com',
  '',
  now(),
  now()
);

INSERT INTO public.wearable_snapshots (
  user_id, date, source, hrv_ms, resting_hr, raw_json
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  CURRENT_DATE,
  'health_connect',
  62,
  55,
  '{"provider_secret":"must_not_persist"}'::jsonb
);

-- A polling-only update must not create a duplicate historical revision.
UPDATE public.wearable_snapshots
SET updated_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000101';

-- A real normalized value change must create a new revision.
UPDATE public.wearable_snapshots
SET hrv_ms = 66
WHERE user_id = '00000000-0000-0000-0000-000000000101';

INSERT INTO public.daily_metric_snapshots (
  user_id,
  snapshot_date,
  readiness,
  sharpness,
  recovery,
  reasoning_quality,
  s1,
  s2,
  ae,
  ra,
  ct,
  in_score,
  confidence,
  signal_coverage,
  timezone
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  CURRENT_DATE,
  61,
  58,
  50,
  57,
  56,
  59,
  58,
  55,
  60,
  58,
  0.72,
  0.65,
  'Europe/Rome'
);

UPDATE public.daily_metric_snapshots
SET recovery = 51
WHERE user_id = '00000000-0000-0000-0000-000000000101';

INSERT INTO public.user_cognitive_metrics (user_id)
VALUES ('00000000-0000-0000-0000-000000000101');

UPDATE public.user_cognitive_metrics
SET focus_stability = 58
WHERE user_id = '00000000-0000-0000-0000-000000000101';

INSERT INTO public.wearable_provider_connections (
  user_id, provider, status, scopes, is_primary
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  'whoop',
  'connected',
  ARRAY['read:recovery'],
  true
);

-- Foreign-user rows make the RLS check meaningful.
INSERT INTO public.wearable_snapshots (
  user_id, date, source, hrv_ms
) VALUES (
  '00000000-0000-0000-0000-000000000202',
  CURRENT_DATE,
  'health_connect',
  70
);

INSERT INTO public.daily_metric_snapshots (
  user_id, snapshot_date, sharpness
) VALUES (
  '00000000-0000-0000-0000-000000000202',
  CURRENT_DATE,
  77
);

INSERT INTO public.wearable_provider_connections (
  user_id, provider, status, scopes, is_primary
) VALUES (
  '00000000-0000-0000-0000-000000000202',
  'whoop',
  'connected',
  ARRAY['read:recovery'],
  true
);

DO $$
DECLARE
  observation_count integer;
  metric_count integer;
  consent_count integer;
  raw_payload jsonb;
BEGIN
  SELECT count(*) INTO observation_count
  FROM public.canonical_observation_revisions
  WHERE user_id = '00000000-0000-0000-0000-000000000101';

  IF observation_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 observation revisions, found %', observation_count;
  END IF;

  SELECT count(*) INTO metric_count
  FROM public.metric_estimates
  WHERE user_id = '00000000-0000-0000-0000-000000000101';

  IF metric_count <> 17 THEN
    RAISE EXCEPTION 'Expected 17 metric estimates, found %', metric_count;
  END IF;

  SELECT count(*) INTO consent_count
  FROM public.data_consent_events
  WHERE user_id = '00000000-0000-0000-0000-000000000101';

  IF consent_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 consent event, found %', consent_count;
  END IF;

  SELECT raw_json INTO raw_payload
  FROM public.wearable_snapshots
  WHERE user_id = '00000000-0000-0000-0000-000000000101';

  IF raw_payload IS NOT NULL THEN
    RAISE EXCEPTION 'Raw wearable payload was persisted';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);

INSERT INTO public.data_consent_events (
  user_id, source, purpose, action, scopes, policy_version, actor
) VALUES (
  '00000000-0000-0000-0000-000000000101',
  'health_connect',
  'personalized_cognitive_metrics',
  'granted',
  ARRAY['sleep', 'activity'],
  'health-permission-v1',
  'user'
);

DO $$
DECLARE
  visible_observations integer;
  visible_metrics integer;
  visible_consents integer;
  foreign_rows integer;
BEGIN
  SELECT count(*) INTO visible_observations
  FROM public.canonical_observation_revisions;

  IF visible_observations <> 2 THEN
    RAISE EXCEPTION 'RLS exposed the wrong observation count: %', visible_observations;
  END IF;

  SELECT count(*) INTO visible_metrics
  FROM public.metric_estimates;

  IF visible_metrics <> 17 THEN
    RAISE EXCEPTION 'RLS exposed the wrong metric count: %', visible_metrics;
  END IF;

  SELECT count(*) INTO visible_consents
  FROM public.data_consent_events;

  IF visible_consents <> 2 THEN
    RAISE EXCEPTION 'RLS exposed the wrong consent count: %', visible_consents;
  END IF;

  SELECT
    (SELECT count(*) FROM public.canonical_observation_revisions
      WHERE user_id = '00000000-0000-0000-0000-000000000202')
    + (SELECT count(*) FROM public.metric_estimates
      WHERE user_id = '00000000-0000-0000-0000-000000000202')
    + (SELECT count(*) FROM public.data_consent_events
      WHERE user_id = '00000000-0000-0000-0000-000000000202')
  INTO foreign_rows;

  IF foreign_rows <> 0 THEN
    RAISE EXCEPTION 'RLS exposed % foreign-user rows', foreign_rows;
  END IF;
END;
$$;

RESET ROLE;

ROLLBACK;
