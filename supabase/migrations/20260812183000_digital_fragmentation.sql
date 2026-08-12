-- Privacy-safe Digital Fragmentation v1.
-- Counts are calculated on-device from Android UsageEvents. No package names,
-- event sequences, content, domains, contacts or social identities are stored.

ALTER TABLE public.device_usage_snapshots
  ADD COLUMN IF NOT EXISTS attention_session_count integer
    CHECK (attention_session_count IS NULL OR attention_session_count >= 0),
  ADD COLUMN IF NOT EXISTS attention_switch_count integer
    CHECK (attention_switch_count IS NULL OR attention_switch_count >= 0),
  ADD COLUMN IF NOT EXISTS brief_session_count integer
    CHECK (brief_session_count IS NULL OR brief_session_count >= 0);

COMMENT ON COLUMN public.device_usage_snapshots.attention_session_count IS
  'Daily count of on-device foreground sessions among selected attention apps; no app identity is stored.';
COMMENT ON COLUMN public.device_usage_snapshots.attention_switch_count IS
  'Daily aggregate transitions back into an attention app after another foreground app; no sequence is stored.';
COMMENT ON COLUMN public.device_usage_snapshots.brief_session_count IS
  'Daily count of completed attention-app sessions lasting at most two minutes.';

