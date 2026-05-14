
-- 1. Attach guard trigger to profiles to prevent self-escalation of sensitive fields
DROP TRIGGER IF EXISTS guard_profile_sensitive_fields_trigger ON public.profiles;
CREATE TRIGGER guard_profile_sensitive_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_sensitive_fields();

-- 2. Remove user INSERT policies on payment/credit tables — only service role should write
DROP POLICY IF EXISTS "Users can insert own credit purchases" ON public.report_credit_purchases;
DROP POLICY IF EXISTS "Users can insert own report purchases" ON public.report_purchases;

-- Ensure service role can manage these tables (for webhooks/backend)
DROP POLICY IF EXISTS "Service role can manage credit purchases" ON public.report_credit_purchases;
CREATE POLICY "Service role can manage credit purchases"
ON public.report_credit_purchases
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage report purchases" ON public.report_purchases;
CREATE POLICY "Service role can manage report purchases"
ON public.report_purchases
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
