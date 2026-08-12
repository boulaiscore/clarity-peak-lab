-- Trigger-only functions: never called directly by clients
REVOKE ALL ON FUNCTION public.cap_self_reported_xp() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.evaluate_adaptive_coach_game_outcome() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.evaluate_adaptive_focus_forecast() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.evaluate_daily_outlook_from_passive_focus() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_sensitive_fields() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_role_assignment() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_content_activity() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_reason_session_activity() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_s2_game_activity() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Helper functions used inside RLS policies: signed-in users still need EXECUTE, anonymous does not
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;