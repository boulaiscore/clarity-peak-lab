-- Mobile-first, privacy-safe daily schedule context.
-- Event titles, notes, attendees, locations, URLs and calendar names are
-- deliberately absent and must be reduced on-device before upload.

CREATE TABLE IF NOT EXISTS public.calendar_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('ios_eventkit', 'android_calendar')),
  busy_minutes integer NOT NULL DEFAULT 0 CHECK (busy_minutes BETWEEN 0 AND 1440),
  meeting_count integer NOT NULL DEFAULT 0 CHECK (meeting_count BETWEEN 0 AND 500),
  longest_meeting_minutes integer NOT NULL DEFAULT 0
    CHECK (longest_meeting_minutes BETWEEN 0 AND 1440),
  first_event_minute integer CHECK (first_event_minute IS NULL OR first_event_minute BETWEEN 0 AND 1439),
  last_event_minute integer CHECK (last_event_minute IS NULL OR last_event_minute BETWEEN 0 AND 1440),
  longest_open_start_minute integer
    CHECK (longest_open_start_minute IS NULL OR longest_open_start_minute BETWEEN 0 AND 1439),
  longest_open_minutes integer NOT NULL DEFAULT 0
    CHECK (longest_open_minutes BETWEEN 0 AND 720),
  permission_state text NOT NULL DEFAULT 'granted'
    CHECK (permission_state IN ('granted', 'limited', 'denied', 'unavailable')),
  confidence numeric(5,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date, source)
);

CREATE INDEX IF NOT EXISTS calendar_context_snapshots_user_date_idx
  ON public.calendar_context_snapshots (user_id, snapshot_date DESC);

ALTER TABLE public.calendar_context_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar context" ON public.calendar_context_snapshots;
CREATE POLICY "Users can view own calendar context"
ON public.calendar_context_snapshots FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calendar context" ON public.calendar_context_snapshots;
CREATE POLICY "Users can insert own calendar context"
ON public.calendar_context_snapshots FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar context" ON public.calendar_context_snapshots;
CREATE POLICY "Users can update own calendar context"
ON public.calendar_context_snapshots FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calendar context" ON public.calendar_context_snapshots;
CREATE POLICY "Users can delete own calendar context"
ON public.calendar_context_snapshots FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_calendar_context_snapshots_updated_at
  ON public.calendar_context_snapshots;
CREATE TRIGGER update_calendar_context_snapshots_updated_at
BEFORE UPDATE ON public.calendar_context_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.calendar_context_snapshots IS
  'User-owned daily schedule density aggregates. Never stores event content, participants, locations or calendar identities.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_context_snapshots TO authenticated;
GRANT ALL ON public.calendar_context_snapshots TO service_role;