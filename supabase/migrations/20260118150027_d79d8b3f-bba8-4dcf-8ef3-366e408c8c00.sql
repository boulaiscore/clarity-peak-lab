-- Add baseline engine columns to user_cognitive_metrics
-- This supports the demographic + calibration baseline system

-- Demographic baselines (computed from age, education, work)
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS baseline_demo_focus numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_demo_fast_thinking numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_demo_reasoning numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_demo_slow_thinking numeric DEFAULT NULL;

-- Calibration baselines (from drill scores, nullable if skipped)
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS baseline_cal_focus numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_cal_fast_thinking numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_cal_reasoning numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_cal_slow_thinking numeric DEFAULT NULL;

-- Effective baselines (used as decay floor and skill initialization)
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS baseline_eff_focus numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_eff_fast_thinking numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_eff_reasoning numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_eff_slow_thinking numeric DEFAULT NULL;

-- Calibration status tracking
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS calibration_status text DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS baseline_is_estimated boolean DEFAULT true;

-- Add check constraint for calibration_status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'calibration_status_check'
  ) THEN
    ALTER TABLE public.user_cognitive_metrics 
    ADD CONSTRAINT calibration_status_check 
    CHECK (calibration_status IN ('not_started', 'skipped', 'completed'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_demo_focus IS 'Demographic-derived baseline for AE (Attentional Efficiency)';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_demo_fast_thinking IS 'Demographic-derived baseline for RA (Rapid Association)';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_demo_reasoning IS 'Demographic-derived baseline for CT (Critical Thinking)';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_demo_slow_thinking IS 'Demographic-derived baseline for IN (Insight)';

COMMENT ON COLUMN public.user_cognitive_metrics.baseline_cal_focus IS 'Calibration drill-derived baseline for AE';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_cal_fast_thinking IS 'Calibration drill-derived baseline for RA';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_cal_reasoning IS 'Calibration drill-derived baseline for CT';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_cal_slow_thinking IS 'Calibration drill-derived baseline for IN';

COMMENT ON COLUMN public.user_cognitive_metrics.baseline_eff_focus IS 'Effective baseline for AE (floor for decay, skill initialization)';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_eff_fast_thinking IS 'Effective baseline for RA';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_eff_reasoning IS 'Effective baseline for CT';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_eff_slow_thinking IS 'Effective baseline for IN';

COMMENT ON COLUMN public.user_cognitive_metrics.calibration_status IS 'Status: not_started, skipped, or completed';
COMMENT ON COLUMN public.user_cognitive_metrics.baseline_is_estimated IS 'True if baseline is demographic-only (estimated), false if includes calibration';