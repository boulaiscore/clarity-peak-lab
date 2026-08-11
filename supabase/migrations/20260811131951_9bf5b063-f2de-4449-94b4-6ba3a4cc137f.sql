-- Explainable Daily Outlook.
--
-- Stores one privacy-safe recommendation per day, the exact aggregate state
-- used to produce it, and automatic action/outcome lifecycle markers. No free
-- text, event titles, app names, health samples or manual ratings are stored.

CREATE TABLE IF NOT EXISTS public.daily_outlooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outlook_date date NOT NULL,
  policy_version text NOT NULL CHECK (char_length(policy_version) BETWEEN 1 AND 80),
  plan_id text NOT NULL DEFAULT 'free'
    CHECK (plan_id IN ('free', 'core', 'pro', 'founding_pro')),
  headline text NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  intensity text NOT NULL CHECK (intensity IN ('protective', 'steady', 'strong')),
  window_label text CHECK (window_label IS NULL OR char_length(window_label) <= 80),
  primary_action jsonb NOT NULL CHECK (jsonb_typeof(primary_action) = 'object'),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  state_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(state_snapshot) = 'object'),
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  copy_source text NOT NULL DEFAULT 'deterministic'
    CHECK (copy_source IN ('deterministic', 'ai')),
  model_version text,
  status text NOT NULL DEFAULT 'recommended'
    CHECK (status IN ('recommended', 'opened', 'action_started', 'action_elapsed')),
  shown_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  action_started_at timestamptz,
  action_elapsed_at timestamptz,
  outcome_status text NOT NULL DEFAULT 'pending'
    CHECK (outcome_status IN ('pending', 'observed', 'insufficient')),
  outcome_snapshot jsonb,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, outlook_date, policy_version)
);

CREATE INDEX IF NOT EXISTS daily_outlooks_user_date_idx
  ON public.daily_outlooks (user_id, outlook_date DESC);

CREATE INDEX IF NOT EXISTS daily_outlooks_pending_outcome_idx
  ON public.daily_outlooks (user_id, outlook_date DESC)
  WHERE outcome_status = 'pending' AND action_started_at IS NOT NULL;

ALTER TABLE public.daily_outlooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own daily outlooks" ON public.daily_outlooks;
CREATE POLICY "Users can insert own daily outlooks"
ON public.daily_outlooks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own daily outlooks" ON public.daily_outlooks;
CREATE POLICY "Users can view own daily outlooks"
ON public.daily_outlooks
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily outlooks" ON public.daily_outlooks;
CREATE POLICY "Users can update own daily outlooks"
ON public.daily_outlooks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_daily_outlooks_updated_at ON public.daily_outlooks;
CREATE TRIGGER update_daily_outlooks_updated_at
BEFORE UPDATE ON public.daily_outlooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE ON public.daily_outlooks TO authenticated;
GRANT ALL ON public.daily_outlooks TO service_role;

COMMENT ON TABLE public.daily_outlooks IS
  'One explainable daily recommendation with privacy-safe aggregate evidence and automatic outcome lifecycle.';

COMMENT ON COLUMN public.daily_outlooks.state_snapshot IS
  'Aggregate point-in-time inputs only; no app names, event content, health samples or free text.';

-- Once the recommended duration has elapsed, the next evaluable aggregate
-- Focus Integrity observation closes the loop without asking the user for a
-- rating. This remains a within-person attention proxy, not work quality.
CREATE OR REPLACE FUNCTION public.evaluate_daily_outlook_from_passive_focus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_evaluable IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.daily_outlooks
  SET status = 'action_elapsed',
      action_elapsed_at = COALESCE(
        action_elapsed_at,
        action_started_at + make_interval(
          mins => greatest(
            1,
            least(120, COALESCE((primary_action ->> 'durationMinutes')::integer, 15))
          )
        )
      ),
      outcome_status = 'observed',
      outcome_snapshot = jsonb_build_object(
        'focusIntegrity', NEW.score,
        'coverage', NEW.coverage,
        'confidence', NEW.confidence,
        'observationDate', NEW.observation_date,
        'sourceVersion', NEW.source_version,
        'boundary', 'Within-person sustained-attention proxy; not productivity or work quality.'
      ),
      evaluated_at = now()
  WHERE user_id = NEW.user_id
    AND outcome_status = 'pending'
    AND action_started_at IS NOT NULL
    AND outlook_date IN (NEW.observation_date, NEW.observation_date - 1)
    AND NEW.observed_at >= action_started_at + make_interval(
      mins => greatest(
        1,
        least(120, COALESCE((primary_action ->> 'durationMinutes')::integer, 15))
      )
    );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Daily guidance must never interrupt passive signal sync.
  RAISE WARNING 'Daily Outlook evaluation skipped for observation %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluate_daily_outlook_from_passive_focus_trigger
  ON public.passive_focus_observations;
CREATE TRIGGER evaluate_daily_outlook_from_passive_focus_trigger
AFTER INSERT OR UPDATE OF score, coverage, confidence, is_evaluable, observed_at
ON public.passive_focus_observations
FOR EACH ROW EXECUTE FUNCTION public.evaluate_daily_outlook_from_passive_focus();