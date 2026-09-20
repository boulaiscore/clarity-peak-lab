CREATE TABLE public.coach_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coach_memory_user_idx ON public.coach_memory (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_memory TO authenticated;
GRANT ALL ON public.coach_memory TO service_role;

ALTER TABLE public.coach_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own coach memory"
  ON public.coach_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own coach memory"
  ON public.coach_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own coach memory"
  ON public.coach_memory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own coach memory"
  ON public.coach_memory FOR DELETE TO authenticated
  USING (auth.uid() = user_id);