GRANT ALL ON public.device_ingest_tokens TO service_role;
REVOKE ALL ON public.device_ingest_tokens FROM anon, authenticated;
ALTER TABLE public.device_ingest_tokens ENABLE ROW LEVEL SECURITY;