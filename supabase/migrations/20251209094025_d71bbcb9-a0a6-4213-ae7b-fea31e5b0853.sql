-- Add new exercise categories for visual/game drills
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'visual';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'spatial';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'game';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'visual_memory';

-- Add new exercise type for interactive visual drills
ALTER TYPE exercise_type ADD VALUE IF NOT EXISTS 'visual_drill';

-- Add new duration options
ALTER TYPE exercise_duration ADD VALUE IF NOT EXISTS '90s';

-- Add new metrics columns to user_cognitive_metrics
ALTER TABLE public.user_cognitive_metrics 
  ADD COLUMN IF NOT EXISTS visual_processing numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS spatial_reasoning numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS focus_stability numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS reaction_speed numeric NOT NULL DEFAULT 50;