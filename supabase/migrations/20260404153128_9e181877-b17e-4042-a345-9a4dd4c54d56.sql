
-- 1. Guard sensitive profile fields with a trigger
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin role to change subscription_status, report_credits, monthly_report_credits
  IF (
    NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
    NEW.report_credits IS DISTINCT FROM OLD.report_credits OR
    NEW.monthly_report_credits IS DISTINCT FROM OLD.monthly_report_credits
  ) AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    -- Revert sensitive fields to old values silently
    NEW.subscription_status := OLD.subscription_status;
    NEW.report_credits := OLD.report_credits;
    NEW.monthly_report_credits := OLD.monthly_report_credits;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_guard_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_fields();

-- 2. Restrict user_badges INSERT to admin/service-role only
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

CREATE POLICY "Only admins can insert badges"
  ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Harden handle_new_user function with name length cap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := LEFT(COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''), 'User'), 100);
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, user_name);
  RETURN NEW;
END;
$$;
