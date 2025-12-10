-- Add baseline metrics columns (captured during initial assessment)
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS baseline_fast_thinking numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_slow_thinking numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_focus numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_reasoning numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_creativity numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_cognitive_age integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS baseline_captured_at timestamp with time zone DEFAULT NULL;

-- Add current level/tier column
ALTER TABLE public.user_cognitive_metrics
ADD COLUMN IF NOT EXISTS cognitive_level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS experience_points integer DEFAULT 0;

-- Create badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  badge_category text NOT NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on badges table
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);