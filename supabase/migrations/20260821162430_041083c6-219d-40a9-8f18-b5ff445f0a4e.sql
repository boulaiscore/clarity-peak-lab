REVOKE EXECUTE ON FUNCTION public.capture_canonical_observation_revision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_daily_metric_estimates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_cognitive_state_estimates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_wearable_connection_consent() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.discard_wearable_raw_payload() FROM PUBLIC, anon, authenticated;