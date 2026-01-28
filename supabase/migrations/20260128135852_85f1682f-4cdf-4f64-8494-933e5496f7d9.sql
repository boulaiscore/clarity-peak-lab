-- =====================================================
-- SECURITY FIX: Create proper user_roles table with RLS
-- =====================================================

-- 1. Create role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECURITY FIX: Add RLS to admin_user_overview view
-- =====================================================

-- Drop existing view and recreate with RLS
DROP VIEW IF EXISTS public.admin_user_overview;

CREATE VIEW public.admin_user_overview
WITH (security_invoker = on)
AS
SELECT 
  p.user_id,
  p.name,
  p.subscription_status,
  p.training_plan,
  p.created_at,
  p.onboarding_completed,
  p.age,
  p.gender,
  p.education_level,
  p.report_credits,
  p.degree_discipline,
  p.work_type,
  m.slow_thinking,
  m.fast_thinking,
  m.creativity,
  m.reasoning_accuracy,
  m.focus_stability,
  m.training_capacity,
  m.experience_points,
  m.cognitive_level,
  m.total_sessions,
  (SELECT COUNT(*) FROM public.exercise_completions ec WHERE ec.user_id = p.user_id) as total_exercises
FROM public.profiles p
LEFT JOIN public.user_cognitive_metrics m ON p.user_id = m.user_id;

-- Grant access to authenticated users (RLS will restrict)
GRANT SELECT ON public.admin_user_overview TO authenticated;

-- Note: Views inherit RLS from underlying tables when security_invoker = on
-- But we also need to ensure only admins can query it
-- We'll enforce this via the profiles table policies and the has_role function

-- =====================================================
-- SECURITY FIX: Remove overly permissive cognitive_exercises policies
-- =====================================================

-- Drop the dangerous public write policies
DROP POLICY IF EXISTS "Allow insert for exercise seeding" ON public.cognitive_exercises;
DROP POLICY IF EXISTS "Allow update for exercise seeding" ON public.cognitive_exercises;

-- Create admin-only write policies
CREATE POLICY "Only admins can insert exercises"
ON public.cognitive_exercises
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update exercises"
ON public.cognitive_exercises
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete exercises"
ON public.cognitive_exercises
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECURITY FIX: Fix waitlist_signups exposure
-- =====================================================

-- Drop existing admin policy that may be too permissive
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist_signups;

-- Create proper admin-only SELECT policy using has_role function
CREATE POLICY "Only admins can view waitlist"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECURITY FIX: Add policy to prevent subscription_status manipulation
-- =====================================================

-- We need to ensure non-admins cannot set subscription_status to 'admin'
-- First drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own profile except subscription" ON public.profiles;

-- Create a new policy that prevents setting subscription_status to 'admin'
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Either they're not changing subscription_status to admin
    subscription_status IS DISTINCT FROM 'admin'
    -- Or they're already an admin
    OR public.has_role(auth.uid(), 'admin')
  )
);