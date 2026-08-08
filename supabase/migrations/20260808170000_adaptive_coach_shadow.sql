-- Adaptive Cognitive Coach v1: explainable predictions in shadow mode.
--
-- The model records one candidate per cognitive skill each local day. These
-- rows never alter the user's training plan, game order, gating, or difficulty.
-- A later completed game resolves the most recent matching prediction so the
-- model can be validated against an objective, already-collected outcome.

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

COMMENT ON COLUMN public.adaptive_coach_predictions.observed_delta IS
  'Next completed same-skill game score minus the pre-prediction rolling baseline; validation is predictive, not causal.';

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

  -- A completed row is evaluated once. Later metadata edits must not consume a
  -- second prediction with the same game session.
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

  -- Older overlapping forecasts for the same action would otherwise reuse a
  -- later outcome and inflate the validation sample.
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
  -- Shadow instrumentation must never interrupt or roll back a real game.
  RAISE WARNING 'Adaptive Coach outcome evaluation skipped for game %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evaluate_adaptive_coach_game_outcome_trigger ON public.game_sessions;
CREATE TRIGGER evaluate_adaptive_coach_game_outcome_trigger
AFTER INSERT OR UPDATE OF status, completed_at ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.evaluate_adaptive_coach_game_outcome();
