-- Repair/bootstrap for cloud tables that predate the Lovable migration ledger.
-- Safe to apply after the original local migrations: every object is created or
-- replaced idempotently.

-- Canonical activity timestamps used by Reasoning Quality decay.
CREATE OR REPLACE FUNCTION public.touch_s2_game_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.system_type = 'S2' THEN
    UPDATE public.user_cognitive_metrics
    SET last_s2_game_at = GREATEST(
      COALESCE(last_s2_game_at, '-infinity'::timestamptz),
      COALESCE(NEW.completed_at, now())
    )
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_s2_game_activity_trigger ON public.game_sessions;
CREATE TRIGGER touch_s2_game_activity_trigger
AFTER INSERT OR UPDATE OF status, completed_at ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_s2_game_activity();

CREATE OR REPLACE FUNCTION public.touch_content_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.exercise_id LIKE 'content-%' THEN
    UPDATE public.user_cognitive_metrics
    SET last_task_at = GREATEST(
      COALESCE(last_task_at, '-infinity'::timestamptz),
      COALESCE(NEW.completed_at, now())
    )
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_content_activity_trigger ON public.exercise_completions;
CREATE TRIGGER touch_content_activity_trigger
AFTER INSERT OR UPDATE OF completed_at ON public.exercise_completions
FOR EACH ROW EXECUTE FUNCTION public.touch_content_activity();

CREATE OR REPLACE FUNCTION public.touch_reason_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.is_valid_for_rq IS TRUE THEN
    UPDATE public.user_cognitive_metrics
    SET last_task_at = GREATEST(
      COALESCE(last_task_at, '-infinity'::timestamptz),
      NEW.ended_at
    )
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_reason_session_activity_trigger ON public.reason_sessions;
CREATE TRIGGER touch_reason_session_activity_trigger
AFTER INSERT OR UPDATE OF ended_at, is_valid_for_rq ON public.reason_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_reason_session_activity();

-- Privacy-safe first-party behavior telemetry. Health and cognitive values stay
-- in their dedicated user-owned tables.
CREATE TABLE IF NOT EXISTS public.product_usage_events (
  client_event_id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_name text NOT NULL CHECK (char_length(event_name) BETWEEN 1 AND 80),
  path text NOT NULL CHECK (char_length(path) <= 500),
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_usage_properties_object CHECK (jsonb_typeof(properties) = 'object')
);

CREATE INDEX IF NOT EXISTS product_usage_events_user_time_idx
  ON public.product_usage_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_usage_events_name_time_idx
  ON public.product_usage_events (event_name, occurred_at DESC);

ALTER TABLE public.product_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own usage events" ON public.product_usage_events;
CREATE POLICY "Users can insert their own usage events"
ON public.product_usage_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anonymous clients can insert anonymous usage events" ON public.product_usage_events;
CREATE POLICY "Anonymous clients can insert anonymous usage events"
ON public.product_usage_events
FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their own usage events" ON public.product_usage_events;
CREATE POLICY "Users can view their own usage events"
ON public.product_usage_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.product_usage_events IS
  'Privacy-safe first-party product usage events; excludes cognitive, health, email, name and social content.';

GRANT INSERT ON public.product_usage_events TO anon;
GRANT SELECT, INSERT ON public.product_usage_events TO authenticated;
GRANT ALL ON public.product_usage_events TO service_role;

-- Explainable daily predictions. There is intentionally no client UPDATE
-- policy: only the outcome trigger can resolve a forecast.
CREATE TABLE IF NOT EXISTS public.adaptive_coach_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_date date NOT NULL,
  predicted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  mode text NOT NULL DEFAULT 'shadow' CHECK (mode = 'shadow'),
  model_version text NOT NULL CHECK (char_length(model_version) BETWEEN 1 AND 80),
  action_key text NOT NULL CHECK (action_key IN ('train_ae', 'train_ra', 'train_ct', 'train_in')),
  target_skill text NOT NULL CHECK (target_skill IN ('AE', 'RA', 'CT', 'IN')),
  candidate_rank smallint NOT NULL CHECK (candidate_rank BETWEEN 1 AND 4),
  is_top_candidate boolean NOT NULL DEFAULT false,
  is_evaluable boolean NOT NULL DEFAULT false,
  baseline_score numeric(6,2) NOT NULL CHECK (baseline_score BETWEEN 0 AND 100),
  predicted_score numeric(6,2) NOT NULL CHECK (predicted_score BETWEEN 0 AND 100),
  predicted_delta numeric(6,2) NOT NULL CHECK (predicted_delta BETWEEN -100 AND 100),
  priority_score numeric(6,2) NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  features jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(features) = 'object'),
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(explanation) = 'object'),
  outcome_status text NOT NULL DEFAULT 'pending'
    CHECK (outcome_status IN ('pending', 'observed', 'superseded')),
  outcome_score numeric(6,2) CHECK (outcome_score BETWEEN 0 AND 100),
  observed_delta numeric(6,2) CHECK (observed_delta BETWEEN -100 AND 100),
  outcome_source_id uuid REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  outcome_context jsonb CHECK (outcome_context IS NULL OR jsonb_typeof(outcome_context) = 'object'),
  outcome_at timestamptz,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prediction_date, action_key, model_version)
);

CREATE INDEX IF NOT EXISTS adaptive_coach_predictions_user_time_idx
  ON public.adaptive_coach_predictions (user_id, predicted_at DESC);

CREATE INDEX IF NOT EXISTS adaptive_coach_predictions_pending_idx
  ON public.adaptive_coach_predictions (user_id, action_key, predicted_at DESC)
  WHERE outcome_status = 'pending';

CREATE INDEX IF NOT EXISTS adaptive_coach_predictions_validation_idx
  ON public.adaptive_coach_predictions (model_version, target_skill, evaluated_at DESC)
  WHERE outcome_status = 'observed' AND is_evaluable IS TRUE;

ALTER TABLE public.adaptive_coach_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own coach predictions" ON public.adaptive_coach_predictions;
CREATE POLICY "Users can insert own coach predictions"
ON public.adaptive_coach_predictions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND mode = 'shadow');

DROP POLICY IF EXISTS "Users can view own coach predictions" ON public.adaptive_coach_predictions;
CREATE POLICY "Users can view own coach predictions"
ON public.adaptive_coach_predictions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own coach predictions" ON public.adaptive_coach_predictions;
CREATE POLICY "Users can delete own coach predictions"
ON public.adaptive_coach_predictions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.adaptive_coach_predictions IS
  'Explainable Adaptive Cognitive Coach forecasts. Shadow-only: rows cannot change active training behavior.';

GRANT SELECT, INSERT, DELETE ON public.adaptive_coach_predictions TO authenticated;
GRANT ALL ON public.adaptive_coach_predictions TO service_role;

CREATE OR REPLACE FUNCTION public.evaluate_adaptive_coach_game_outcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_action text;
  matched_prediction_id uuid;
BEGIN
  IF NEW.status <> 'completed' OR NEW.skill_routed NOT IN ('AE', 'RA', 'CT', 'IN') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.adaptive_coach_predictions
    WHERE outcome_source_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  matched_action := 'train_' || lower(NEW.skill_routed);

  SELECT id
  INTO matched_prediction_id
  FROM public.adaptive_coach_predictions
  WHERE user_id = NEW.user_id
    AND action_key = matched_action
    AND outcome_status = 'pending'
    AND predicted_at <= COALESCE(NEW.completed_at, now())
    AND expires_at >= COALESCE(NEW.completed_at, now())
  ORDER BY predicted_at DESC
  LIMIT 1
  FOR UPDATE;

  IF matched_prediction_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.adaptive_coach_predictions
  SET outcome_status = 'observed',
      outcome_score = greatest(0, least(100, NEW.score)),
      observed_delta = round((greatest(0, least(100, NEW.score)) - baseline_score)::numeric, 2),
      outcome_source_id = NEW.id,
      outcome_context = jsonb_build_object(
        'difficulty', NEW.difficulty,
        'game_type', NEW.game_type,
        'game_name', NEW.game_name,
        'duration_seconds', NEW.duration_seconds
      ),
      outcome_at = COALESCE(NEW.completed_at, now()),
      evaluated_at = now()
  WHERE id = matched_prediction_id;

  UPDATE public.adaptive_coach_predictions
  SET outcome_status = 'superseded',
      evaluated_at = now()
  WHERE user_id = NEW.user_id
    AND action_key = matched_action
    AND outcome_status = 'pending'
    AND id <> matched_prediction_id
    AND predicted_at < COALESCE(NEW.completed_at, now());

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Shadow instrumentation must never interrupt a real game completion.
  RAISE WARNING 'Adaptive Coach outcome evaluation skipped for game %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluate_adaptive_coach_game_outcome_trigger ON public.game_sessions;
CREATE TRIGGER evaluate_adaptive_coach_game_outcome_trigger
AFTER INSERT OR UPDATE OF status, completed_at ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.evaluate_adaptive_coach_game_outcome();