-- Add new profile fields for birth date, education, and degree discipline
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS degree_discipline text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.birth_date IS 'User birth date for precise age calculation';
COMMENT ON COLUMN public.profiles.education_level IS 'Highest education level achieved';
COMMENT ON COLUMN public.profiles.degree_discipline IS 'Field of study/discipline for degree';