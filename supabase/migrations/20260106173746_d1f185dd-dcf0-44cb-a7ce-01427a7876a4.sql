-- Add INSERT policy for cognitive_exercises to allow seeding
-- This allows any authenticated or anonymous user to insert exercises
-- Since exercises are shared content (not user-specific), this is safe

CREATE POLICY "Allow insert for exercise seeding" 
ON public.cognitive_exercises 
FOR INSERT 
WITH CHECK (true);

-- Also allow upsert operations
CREATE POLICY "Allow update for exercise seeding" 
ON public.cognitive_exercises 
FOR UPDATE 
USING (true)
WITH CHECK (true);