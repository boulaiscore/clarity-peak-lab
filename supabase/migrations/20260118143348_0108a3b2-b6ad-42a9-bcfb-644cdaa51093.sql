-- Add Focus Switch metrics columns to game_sessions
-- These store per-session performance data for AE guidance (NOT for cognitive metrics)

ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS difficulty text,
ADD COLUMN IF NOT EXISTS switch_latency_avg numeric,
ADD COLUMN IF NOT EXISTS perseveration_rate numeric,
ADD COLUMN IF NOT EXISTS post_switch_error_rate numeric,
ADD COLUMN IF NOT EXISTS recovery_speed_index numeric;

-- Add comments for clarity
COMMENT ON COLUMN public.game_sessions.difficulty IS 'Game difficulty: easy, medium, hard';
COMMENT ON COLUMN public.game_sessions.switch_latency_avg IS 'Focus Switch: avg time to respond after focus change (ms)';
COMMENT ON COLUMN public.game_sessions.perseveration_rate IS 'Focus Switch: rate of responses to previous focus after switch (0-1)';
COMMENT ON COLUMN public.game_sessions.post_switch_error_rate IS 'Focus Switch: error rate in first 2 actions after switch (0-1)';
COMMENT ON COLUMN public.game_sessions.recovery_speed_index IS 'Focus Switch: speed of stabilization after switch (0-1, 1=fast)';