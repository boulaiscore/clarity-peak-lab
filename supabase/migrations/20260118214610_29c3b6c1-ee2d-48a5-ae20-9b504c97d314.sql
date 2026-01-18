-- Add reasoning_quality (RQ) column to user_cognitive_metrics
-- RQ is a derived metric measuring reasoning quality (not a trainable skill)
-- Range: 0-100, updated once daily

ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS reasoning_quality numeric DEFAULT 50;

ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS rq_last_updated_at timestamp with time zone;

-- Track last S2 game and task dates for decay calculation
ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS last_s2_game_at timestamp with time zone;

ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS last_task_at timestamp with time zone;

COMMENT ON COLUMN public.user_cognitive_metrics.reasoning_quality IS 'Reasoning Quality (RQ) metric. Range 0-100. Measures quality/efficiency of System 2 reasoning.';
COMMENT ON COLUMN public.user_cognitive_metrics.rq_last_updated_at IS 'When RQ was last recalculated';
COMMENT ON COLUMN public.user_cognitive_metrics.last_s2_game_at IS 'Last S2 game completion for RQ decay';
COMMENT ON COLUMN public.user_cognitive_metrics.last_task_at IS 'Last task completion for RQ decay';