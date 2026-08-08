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

-- First-party, privacy-safe usage telemetry. Cognitive and health values are
-- deliberately kept in their dedicated per-user tables, not in this table.
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
  'Privacy-safe first-party product usage events; excludes cognitive, health, email, and name data.';
