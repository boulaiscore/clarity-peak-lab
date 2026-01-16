-- Add columns for tracking skill XP dates and decay state
ALTER TABLE public.user_cognitive_metrics 
ADD COLUMN IF NOT EXISTS last_ae_xp_date DATE,
ADD COLUMN IF NOT EXISTS last_ra_xp_date DATE,
ADD COLUMN IF NOT EXISTS last_ct_xp_date DATE,
ADD COLUMN IF NOT EXISTS last_in_xp_date DATE,
ADD COLUMN IF NOT EXISTS consecutive_low_rec_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_low_rec_check_date DATE,
ADD COLUMN IF NOT EXISTS readiness_decay_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS readiness_decay_week_start DATE,
ADD COLUMN IF NOT EXISTS sci_decay_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sci_decay_week_start DATE,
ADD COLUMN IF NOT EXISTS dual_process_decay_applied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dual_process_decay_week_start DATE,
ADD COLUMN IF NOT EXISTS performance_avg_window_start_value NUMERIC,
ADD COLUMN IF NOT EXISTS performance_avg_window_start_date DATE,
ADD COLUMN IF NOT EXISTS consecutive_performance_drop_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_decay_calculation_date DATE;