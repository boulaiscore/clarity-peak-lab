-- Ensure profile sensitive-fields guard trigger is installed
DROP TRIGGER IF EXISTS guard_profile_sensitive_fields_trigger ON public.profiles;
CREATE TRIGGER guard_profile_sensitive_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_fields();

-- Prevent users from ever updating role rows; only admins via SECURITY DEFINER paths.
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Block users from inserting role rows for themselves; only admins may insert
CREATE OR REPLACE FUNCTION public.prevent_self_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_role_assignment_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_assignment();

-- Cap user-supplied XP on detox_completions and exercise_completions to defensible bounds.
CREATE OR REPLACE FUNCTION public.cap_self_reported_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'detox_completions' THEN
    NEW.xp_earned := LEAST(GREATEST(COALESCE(NEW.xp_earned, 0), 0), 50);
  ELSIF TG_TABLE_NAME = 'exercise_completions' THEN
    NEW.xp_earned := LEAST(GREATEST(COALESCE(NEW.xp_earned, 0), 0), 45);
    NEW.score := LEAST(GREATEST(COALESCE(NEW.score, 0), 0), 100);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cap_xp_detox ON public.detox_completions;
CREATE TRIGGER cap_xp_detox
  BEFORE INSERT OR UPDATE ON public.detox_completions
  FOR EACH ROW EXECUTE FUNCTION public.cap_self_reported_xp();

DROP TRIGGER IF EXISTS cap_xp_exercises ON public.exercise_completions;
CREATE TRIGGER cap_xp_exercises
  BEFORE INSERT OR UPDATE ON public.exercise_completions
  FOR EACH ROW EXECUTE FUNCTION public.cap_self_reported_xp();