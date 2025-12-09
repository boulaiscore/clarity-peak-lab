-- Add new columns to cognitive_exercises if not present
ALTER TABLE public.cognitive_exercises 
ADD COLUMN IF NOT EXISTS gym_area text,
ADD COLUMN IF NOT EXISTS thinking_mode text;

-- Add 'visual_task' to the exercise_type enum if not present
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'visual_task' AND enumtypid = 'public.exercise_type'::regtype) THEN
    ALTER TYPE public.exercise_type ADD VALUE 'visual_task';
  END IF;
END $$;

-- Add '1min' to the exercise_duration enum if not present  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '1min' AND enumtypid = 'public.exercise_duration'::regtype) THEN
    ALTER TYPE public.exercise_duration ADD VALUE '1min';
  END IF;
END $$;