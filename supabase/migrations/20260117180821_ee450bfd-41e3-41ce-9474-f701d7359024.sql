-- Recreate view with security_invoker to fix security definer warning
DROP VIEW IF EXISTS public.admin_user_overview;

CREATE VIEW public.admin_user_overview 
WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.name,
  p.subscription_status,
  p.training_plan,
  p.created_at,
  p.onboarding_completed,
  p.age,
  p.gender,
  p.education_level,
  p.report_credits,
  p.degree_discipline,
  p.work_type,
  ucm.slow_thinking,
  ucm.fast_thinking,
  ucm.creativity,
  ucm.reasoning_accuracy,
  ucm.focus_stability,
  ucm.training_capacity,
  ucm.experience_points,
  ucm.cognitive_level,
  (SELECT COUNT(*) FROM neuro_gym_sessions WHERE user_id = p.user_id) as total_sessions,
  (SELECT COUNT(*) FROM exercise_completions WHERE user_id = p.user_id) as total_exercises
FROM profiles p
LEFT JOIN user_cognitive_metrics ucm ON p.user_id = ucm.user_id;