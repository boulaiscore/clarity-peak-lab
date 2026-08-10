-- Privacy-safe desktop work-block aggregates.
-- Raw URLs, domains, page titles, content and application names are forbidden
-- by contract and have no columns in this table.

CREATE TABLE IF NOT EXISTS public.desktop_work_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_block_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'chrome_extension'
    CHECK (source = 'chrome_extension'),
  sensor_version text NOT NULL CHECK (char_length(sensor_version) BETWEEN 1 AND 80),
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL CHECK (ended_at >= started_at),
  local_date date NOT NULL,
  local_start_hour smallint NOT NULL CHECK (local_start_hour BETWEEN 0 AND 23),
  local_weekday smallint NOT NULL CHECK (local_weekday BETWEEN 0 AND 6),
  timezone_offset_minutes smallint NOT NULL CHECK (timezone_offset_minutes BETWEEN -840 AND 840),
  duration_minutes numeric(7,1) NOT NULL CHECK (duration_minutes BETWEEN 0 AND 1440),
  active_minutes numeric(7,1) NOT NULL CHECK (active_minutes BETWEEN 0 AND 1440),
  focused_minutes numeric(7,1) NOT NULL CHECK (focused_minutes BETWEEN 0 AND 1440),
  attention_minutes numeric(7,1) NOT NULL CHECK (attention_minutes BETWEEN 0 AND 1440),
  idle_minutes numeric(7,1) NOT NULL CHECK (idle_minutes BETWEEN 0 AND 1440),
  interruption_count integer NOT NULL CHECK (interruption_count BETWEEN 0 AND 10000),
  context_switch_count integer NOT NULL CHECK (context_switch_count BETWEEN 0 AND 10000),
  longest_continuous_minutes numeric(7,1) NOT NULL CHECK (longest_continuous_minutes BETWEEN 0 AND 1440),
  ended_abruptly boolean NOT NULL DEFAULT false,
  termination_reason text NOT NULL
    CHECK (termination_reason IN ('idle', 'locked', 'attention_gap', 'unsupported_gap', 'manual_flush')),
  integrity_score numeric(5,1) NOT NULL CHECK (integrity_score BETWEEN 0 AND 100),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  components jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(components) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_block_id)
);

CREATE INDEX IF NOT EXISTS desktop_work_blocks_user_time_idx
  ON public.desktop_work_blocks (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS desktop_work_blocks_user_local_date_idx
  ON public.desktop_work_blocks (user_id, local_date DESC);

ALTER TABLE public.desktop_work_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own desktop work blocks" ON public.desktop_work_blocks;
CREATE POLICY "Users can view own desktop work blocks"
ON public.desktop_work_blocks
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own desktop work blocks" ON public.desktop_work_blocks;
CREATE POLICY "Users can insert own desktop work blocks"
ON public.desktop_work_blocks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own desktop work blocks" ON public.desktop_work_blocks;
CREATE POLICY "Users can update own desktop work blocks"
ON public.desktop_work_blocks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own desktop work blocks" ON public.desktop_work_blocks;
CREATE POLICY "Users can delete own desktop work blocks"
ON public.desktop_work_blocks
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_desktop_work_blocks_updated_at ON public.desktop_work_blocks;
CREATE TRIGGER update_desktop_work_blocks_updated_at
BEFORE UPDATE ON public.desktop_work_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.desktop_work_blocks IS
  'User-owned privacy-safe desktop focus aggregates. URLs, domains, titles, content and app names are never stored.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.desktop_work_blocks TO authenticated;
GRANT ALL ON public.desktop_work_blocks TO service_role;
