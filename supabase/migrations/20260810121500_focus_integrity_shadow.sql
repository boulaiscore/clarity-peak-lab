-- Adaptive Cognitive Coach v3: passive sustained-attention outcome.
--
-- Focus Integrity is a within-person proxy built from aggregate attention load
-- and interruption/completion signals. It must never be described as
-- intelligence, productivity or work quality. No content, app name, domain or
-- message is stored in these tables.

CREATE TABLE IF NOT EXISTS public.passive_focus_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observation_date date NOT NULL,
  source_version text NOT NULL CHECK (char_length(source_version) BETWEEN 1 AND 80),
  score numeric(5,1) NOT NULL CHECK (score BETWEEN 0 AND 100),
  coverage numeric(5,4) NOT NULL CHECK (coverage BETWEEN 0 AND 1),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  is_evaluable boolean NOT NULL DEFAULT false,
  components jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(components) = 'object'),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence) = 'object'),
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, observation_date, source_version)
);

CREATE INDEX IF NOT EXISTS passive_focus_observations_user_date_idx
  ON public.passive_focus_observations (user_id, observation_date DESC);

ALTER TABLE public.passive_focus_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own passive focus observations" ON public.passive_focus_observations;
CREATE POLICY "Users can view own passive focus observations"
ON public.passive_focus_observations
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own passive focus observations" ON public.passive_focus_observations;
CREATE POLICY "Users can insert own passive focus observations"
ON public.passive_focus_observations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own passive focus observations" ON public.passive_focus_observations;
CREATE POLICY "Users can update own passive focus observations"
ON public.passive_focus_observations
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own passive focus observations" ON public.passive_focus_observations;
CREATE POLICY "Users can delete own passive focus observations"
ON public.passive_focus_observations
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_passive_focus_observations_updated_at ON public.passive_focus_observations;
CREATE TRIGGER update_passive_focus_observations_updated_at
BEFORE UPDATE ON public.passive_focus_observations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.passive_focus_observations IS
  'Privacy-safe daily sustained-attention proxy. Not intelligence, productivity or work quality.';

CREATE TABLE IF NOT EXISTS public.adaptive_focus_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  target_date date NOT NULL,
  predicted_at timestamptz NOT NULL DEFAULT now(),
  mode text NOT NULL DEFAULT 'shadow' CHECK (mode = 'shadow'),
  model_version text NOT NULL CHECK (char_length(model_version) BETWEEN 1 AND 80),
  is_evaluable boolean NOT NULL DEFAULT false,
  baseline_score numeric(5,1) NOT NULL CHECK (baseline_score BETWEEN 0 AND 100),
  predicted_score numeric(5,1) NOT NULL CHECK (predicted_score BETWEEN 0 AND 100),
  predicted_delta numeric(5,1) NOT NULL CHECK (predicted_delta BETWEEN -100 AND 100),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  features jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(features) = 'object'),
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(explanation) = 'object'),
  outcome_status text NOT NULL DEFAULT 'pending'
    CHECK (outcome_status IN ('pending', 'observed')),
  observed_score numeric(5,1) CHECK (observed_score BETWEEN 0 AND 100),
  observed_delta numeric(5,1) CHECK (observed_delta BETWEEN -100 AND 100),
  outcome_observation_id uuid REFERENCES public.passive_focus_observations(id) ON DELETE SET NULL,
  outcome_at timestamptz,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, forecast_date, model_version)
);

CREATE INDEX IF NOT EXISTS adaptive_focus_forecasts_user_date_idx
  ON public.adaptive_focus_forecasts (user_id, forecast_date DESC);

CREATE INDEX IF NOT EXISTS adaptive_focus_forecasts_validation_idx
  ON public.adaptive_focus_forecasts (model_version, evaluated_at DESC)
  WHERE outcome_status = 'observed' AND is_evaluable IS TRUE;

ALTER TABLE public.adaptive_focus_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own adaptive focus forecasts" ON public.adaptive_focus_forecasts;
CREATE POLICY "Users can view own adaptive focus forecasts"
ON public.adaptive_focus_forecasts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own adaptive focus forecasts" ON public.adaptive_focus_forecasts;
CREATE POLICY "Users can insert own adaptive focus forecasts"
ON public.adaptive_focus_forecasts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND mode = 'shadow');

DROP POLICY IF EXISTS "Users can delete own adaptive focus forecasts" ON public.adaptive_focus_forecasts;
CREATE POLICY "Users can delete own adaptive focus forecasts"
ON public.adaptive_focus_forecasts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.adaptive_focus_forecasts IS
  'Next-observed-day Focus Integrity forecasts. Shadow-only and unable to change active training.';

CREATE OR REPLACE FUNCTION public.evaluate_adaptive_focus_forecast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_evaluable IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.adaptive_focus_forecasts
  SET outcome_status = 'observed',
      observed_score = NEW.score,
      observed_delta = round((NEW.score - baseline_score)::numeric, 1),
      outcome_observation_id = NEW.id,
      outcome_at = NEW.observed_at,
      evaluated_at = now()
  WHERE user_id = NEW.user_id
    AND target_date = NEW.observation_date
    AND predicted_at <= NEW.observed_at;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Shadow instrumentation must never interrupt passive data sync.
  RAISE WARNING 'Adaptive Focus evaluation skipped for observation %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluate_adaptive_focus_forecast_trigger ON public.passive_focus_observations;
CREATE TRIGGER evaluate_adaptive_focus_forecast_trigger
AFTER INSERT OR UPDATE OF score, confidence, coverage, is_evaluable, observed_at
ON public.passive_focus_observations
FOR EACH ROW EXECUTE FUNCTION public.evaluate_adaptive_focus_forecast();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.passive_focus_observations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.adaptive_focus_forecasts TO authenticated;
GRANT ALL ON public.passive_focus_observations TO service_role;
GRANT ALL ON public.adaptive_focus_forecasts TO service_role;
