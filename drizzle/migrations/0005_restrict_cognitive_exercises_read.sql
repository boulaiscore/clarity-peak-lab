DROP POLICY IF EXISTS "Exercises are publicly readable" ON public.cognitive_exercises;
CREATE POLICY "Signed-in users can read exercises" ON public.cognitive_exercises FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.cognitive_exercises FROM anon;