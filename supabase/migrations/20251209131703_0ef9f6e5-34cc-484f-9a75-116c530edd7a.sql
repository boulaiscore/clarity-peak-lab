-- Drop the existing check constraint
ALTER TABLE public.neuro_gym_sessions 
DROP CONSTRAINT neuro_gym_sessions_duration_option_check;

-- Add updated check constraint with all valid duration options
ALTER TABLE public.neuro_gym_sessions 
ADD CONSTRAINT neuro_gym_sessions_duration_option_check 
CHECK (duration_option = ANY (ARRAY['30s'::text, '1min'::text, '2min'::text, '3min'::text, '5min'::text, '7min'::text]));