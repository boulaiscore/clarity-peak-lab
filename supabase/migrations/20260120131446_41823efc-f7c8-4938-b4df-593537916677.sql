-- Add duration, started_at, and status columns to game_sessions
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS difficulty TEXT NULL;

-- Add check constraint for status values
ALTER TABLE public.game_sessions 
DROP CONSTRAINT IF EXISTS game_sessions_status_check;

ALTER TABLE public.game_sessions
ADD CONSTRAINT game_sessions_status_check CHECK (status IN ('completed', 'aborted'));

-- Add last_session_at to user_cognitive_metrics for any session tracking
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ NULL;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);

-- Add index for duration analytics
CREATE INDEX IF NOT EXISTS idx_game_sessions_duration ON public.game_sessions(duration_seconds) WHERE status = 'completed';