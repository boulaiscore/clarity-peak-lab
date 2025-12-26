-- Table for tracking weekly training progress
CREATE TABLE public.weekly_training_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL, -- Monday of the week
  plan_id text NOT NULL DEFAULT 'light',
  sessions_completed jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of {session_type, completed_at, games_count}
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Table for monthly content assignments
CREATE TABLE public.monthly_content_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_start date NOT NULL, -- First day of month
  content_type text NOT NULL, -- 'podcast', 'reading', 'book'
  content_id text NOT NULL, -- Reference to content
  title text NOT NULL,
  description text,
  duration_minutes integer, -- Expected duration
  is_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  time_spent_minutes integer NOT NULL DEFAULT 0, -- For reading timer
  completed_at timestamp with time zone,
  session_type text, -- Which session type this is for (e.g., 'slow-reasoning')
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_start, content_id)
);

-- Enable RLS
ALTER TABLE public.weekly_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_content_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_training_progress
CREATE POLICY "Users can view their own weekly progress"
  ON public.weekly_training_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly progress"
  ON public.weekly_training_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly progress"
  ON public.weekly_training_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for monthly_content_assignments
CREATE POLICY "Users can view their own content assignments"
  ON public.monthly_content_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content assignments"
  ON public.monthly_content_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content assignments"
  ON public.monthly_content_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_weekly_training_progress_updated_at
  BEFORE UPDATE ON public.weekly_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_content_assignments_updated_at
  BEFORE UPDATE ON public.monthly_content_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();