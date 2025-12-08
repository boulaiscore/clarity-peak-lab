-- Drop the authenticated-only insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert exercises" ON public.cognitive_exercises;
DROP POLICY IF EXISTS "Allow authenticated users to update exercises" ON public.cognitive_exercises;

-- Allow anyone to insert exercises (for initial seeding)
CREATE POLICY "Allow public insert of exercises" 
ON public.cognitive_exercises 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update exercises (for upsert)
CREATE POLICY "Allow public update of exercises" 
ON public.cognitive_exercises 
FOR UPDATE 
TO anon, authenticated
USING (true);