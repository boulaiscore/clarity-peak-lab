-- Add training_plan column to profiles
ALTER TABLE public.profiles 
ADD COLUMN training_plan text DEFAULT 'light';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.training_plan IS 'Training plan: light, expert, or superhuman';