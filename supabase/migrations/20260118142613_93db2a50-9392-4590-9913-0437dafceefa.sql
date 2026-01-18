-- Add performance metrics columns to game_sessions for AE Guidance Engine
-- These store per-session performance data for guidance (NOT for cognitive metrics)

ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS false_alarm_rate numeric,
ADD COLUMN IF NOT EXISTS hit_rate numeric,
ADD COLUMN IF NOT EXISTS rt_variability numeric,
ADD COLUMN IF NOT EXISTS degradation_slope numeric,
ADD COLUMN IF NOT EXISTS time_in_band_pct numeric,
ADD COLUMN IF NOT EXISTS game_name text;

-- Add index for efficient 7-day window queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_type_date 
ON public.game_sessions(user_id, game_type, completed_at DESC);

-- Add comments for clarity
COMMENT ON COLUMN public.game_sessions.false_alarm_rate IS 'Triage Sprint: ratio of incorrect approvals (0-1)';
COMMENT ON COLUMN public.game_sessions.hit_rate IS 'Triage Sprint: ratio of correct approvals (0-1)';
COMMENT ON COLUMN public.game_sessions.rt_variability IS 'Both games: reaction time variability in ms';
COMMENT ON COLUMN public.game_sessions.degradation_slope IS 'Both games: performance slope over time (-1 to 1)';
COMMENT ON COLUMN public.game_sessions.time_in_band_pct IS 'Orbit Lock: % time signal stayed in target band (0-100)';
COMMENT ON COLUMN public.game_sessions.game_name IS 'Human-readable game name (orbit_lock or triage_sprint)';