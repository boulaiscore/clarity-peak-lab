-- Daily professional outcome loop.
--
-- This table keeps the active recommendation, the cognitive context present
-- when it was shown, the user's decision, and a compact real-world outcome.
-- It is intentionally separate from drill performance and skill/XP tables so
-- future personalization can optimize useful work rather than in-app scores.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_outcome text
  CHECK (primary_outcome IS NULL OR primary_outcome IN ('decide', 'focus', 'reason'));

CREATE TABLE IF NOT EXISTS public.daily_work_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_date date NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  shown_at timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL CHECK (char_length(policy_version) BETWEEN 1 AND 80),
  primary_outcome text NOT NULL CHECK (primary_outcome IN ('decide', 'focus', 'reason')),
  action_key text NOT NULL
    CHECK (action_key IN ('focus_block', 'decision_block', 'analysis_block')),
  intensity text NOT NULL CHECK (intensity IN ('protective', 'steady', 'strong')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  rationale text NOT NULL CHECK (char_length(rationale) BETWEEN 1 AND 500),
  planned_duration_minutes smallint NOT NULL
    CHECK (planned_duration_minutes BETWEEN 10 AND 120),
  state_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(state_snapshot) = 'object'),
  status text NOT NULL DEFAULT 'recommended'
    CHECK (status IN ('recommended', 'started', 'completed', 'dismissed', 'abandoned')),
  started_at timestamptz,
  ended_at timestamptz,
  outcome_achieved text CHECK (outcome_achieved IN ('yes', 'partly', 'no')),
  quality_rating smallint CHECK (quality_rating BETWEEN 1 AND 5),
  effort_rating smallint CHECK (effort_rating BETWEEN 1 AND 5),
  outcome_submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recommendation_date, policy_version),
  CONSTRAINT completed_work_recommendation_has_outcome CHECK (
    status <> 'completed' OR (
      started_at IS NOT NULL
      AND ended_at IS NOT NULL
      AND outcome_achieved IS NOT NULL
      AND quality_rating IS NOT NULL
      AND effort_rating IS NOT NULL
      AND outcome_submitted_at IS NOT NULL
    )
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_work_recommendations TO authenticated;
GRANT ALL ON public.daily_work_recommendations TO service_role;

CREATE INDEX IF NOT EXISTS daily_work_recommendations_user_time_idx
  ON public.daily_work_recommendations (user_id, recommendation_date DESC, generated_at DESC);

CREATE INDEX IF NOT EXISTS daily_work_recommendations_completed_idx
  ON public.daily_work_recommendations (user_id, ended_at DESC)
  WHERE status = 'completed';

ALTER TABLE public.daily_work_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own work recommendations" ON public.daily_work_recommendations;
CREATE POLICY "Users can insert own work recommendations"
ON public.daily_work_recommendations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own work recommendations" ON public.daily_work_recommendations;
CREATE POLICY "Users can view own work recommendations"
ON public.daily_work_recommendations
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own work recommendations" ON public.daily_work_recommendations;
CREATE POLICY "Users can update own work recommendations"
ON public.daily_work_recommendations
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_daily_work_recommendations_updated_at
  ON public.daily_work_recommendations;
CREATE TRIGGER update_daily_work_recommendations_updated_at
BEFORE UPDATE ON public.daily_work_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.daily_work_recommendations IS
  'One daily explainable work recommendation plus its real-world outcome. This is the outcome source for future coach personalization.';

COMMENT ON COLUMN public.daily_work_recommendations.state_snapshot IS
  'Point-in-time product signals used to produce the recommendation. Kept separate from privacy-safe product analytics.';