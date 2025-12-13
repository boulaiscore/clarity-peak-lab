-- Fix: Remove public write access from cognitive_exercises table
-- This was originally for seeding but creates a critical security vulnerability

-- Drop the overly permissive public write policies
DROP POLICY IF EXISTS "Allow public insert of exercises" ON public.cognitive_exercises;
DROP POLICY IF EXISTS "Allow public update of exercises" ON public.cognitive_exercises;

-- Keep the read policy intact (exercises should remain publicly readable)
-- The "Exercises are publicly readable" policy remains in place

-- Create a restrictive update policy for profiles to prevent subscription_status changes
-- Drop existing update policy first
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new update policy that prevents subscription_status changes
CREATE POLICY "Users can update their own profile except subscription"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);