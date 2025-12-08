-- Allow authenticated users to seed exercises (for auto-seeding from app)
CREATE POLICY "Allow authenticated users to insert exercises" 
ON public.cognitive_exercises 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also allow upsert (update on conflict)
CREATE POLICY "Allow authenticated users to update exercises" 
ON public.cognitive_exercises 
FOR UPDATE 
TO authenticated
USING (true);