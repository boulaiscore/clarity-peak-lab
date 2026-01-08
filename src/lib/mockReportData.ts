// Realistic mock data for sample report preview

export const MOCK_PROFILE = {
  name: "Alex M. Thompson",
  birth_date: "1988-03-15",
  gender: "male",
  work_type: "Knowledge Worker",
  education_level: "Graduate",
  degree_discipline: "Computer Science",
  training_goals: ["Focus", "Reasoning", "Decision Making"],
  daily_time_commitment: "15-30min",
  session_duration: "5min",
};

export const MOCK_METRICS = {
  cognitive_performance_score: 76,
  fast_thinking: 72,
  slow_thinking: 79,
  focus_stability: 78,
  reasoning_accuracy: 74,
  creativity: 81,
  reaction_speed: 85,
  visual_processing: 77,
  spatial_reasoning: 73,
  decision_quality: 75,
  bias_resistance: 71,
  clarity_score: 80,
  critical_thinking_score: 76,
  philosophical_reasoning: 68,
  cognitive_level: 12,
  experience_points: 4850,
  total_sessions: 47,
  baseline_focus: 65,
  baseline_reasoning: 62,
  baseline_creativity: 70,
  baseline_fast_thinking: 60,
  baseline_slow_thinking: 68,
  baseline_cognitive_age: 38,
  cognitive_readiness_score: 82,
  physio_component_score: 78,
};

export const MOCK_SESSIONS = [
  { area: "focus", score: 85, duration_option: "5min", completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "reasoning", score: 78, duration_option: "5min", completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 92, duration_option: "3min", completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 9, total_questions: 10 },
  { area: "focus", score: 80, duration_option: "5min", completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "reasoning", score: 72, duration_option: "7min", completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 88, duration_option: "5min", completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 9, total_questions: 10 },
  { area: "focus", score: 75, duration_option: "3min", completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "reasoning", score: 82, duration_option: "5min", completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "creativity", score: 85, duration_option: "5min", completed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "focus", score: 90, duration_option: "7min", completed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 9, total_questions: 10 },
  { area: "reasoning", score: 76, duration_option: "5min", completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 80, duration_option: "3min", completed_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "focus", score: 78, duration_option: "5min", completed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "reasoning", score: 85, duration_option: "5min", completed_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "creativity", score: 75, duration_option: "5min", completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "focus", score: 82, duration_option: "5min", completed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "reasoning", score: 70, duration_option: "3min", completed_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 88, duration_option: "5min", completed_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 9, total_questions: 10 },
  { area: "focus", score: 72, duration_option: "5min", completed_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "reasoning", score: 80, duration_option: "7min", completed_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "creativity", score: 82, duration_option: "5min", completed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "focus", score: 85, duration_option: "5min", completed_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "reasoning", score: 74, duration_option: "5min", completed_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 90, duration_option: "3min", completed_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 9, total_questions: 10 },
  { area: "focus", score: 68, duration_option: "5min", completed_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 6, total_questions: 10 },
  { area: "reasoning", score: 78, duration_option: "5min", completed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "creativity", score: 84, duration_option: "5min", completed_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "focus", score: 77, duration_option: "7min", completed_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
  { area: "reasoning", score: 82, duration_option: "5min", completed_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 8, total_questions: 10 },
  { area: "creativity", score: 79, duration_option: "5min", completed_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), correct_answers: 7, total_questions: 10 },
];

export const MOCK_BADGES = [
  { badge_id: "first_session", badge_name: "First Steps", badge_category: "milestone", badge_description: "Completed your first training session", earned_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { badge_id: "focus_master", badge_name: "Focus Master", badge_category: "skill", badge_description: "Achieved 90%+ accuracy in Focus training", earned_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { badge_id: "weekly_streak", badge_name: "Consistency Champion", badge_category: "streak", badge_description: "Trained for 7 consecutive days", earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { badge_id: "level_10", badge_name: "Cognitive Athlete", badge_category: "level", badge_description: "Reached cognitive level 10", earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { badge_id: "creativity_spark", badge_name: "Creative Spark", badge_category: "skill", badge_description: "Completed 10 creativity sessions", earned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

export const MOCK_WEARABLE = {
  hrv_ms: 52,
  resting_hr: 62,
  sleep_duration_min: 420,
  sleep_efficiency: 87,
  activity_score: 75,
};

export const MOCK_AGGREGATES = {
  sessionsByArea: { focus: 12, reasoning: 11, creativity: 14 } as Record<"focus" | "reasoning" | "creativity", number>,
  avgScoreByArea: { focus: 79, reasoning: 77, creativity: 84 } as Record<"focus" | "reasoning" | "creativity", number>,
  accuracyRatePct: 78,
  preferredDuration: "5min",
  mostUsedExercises: [
    { exerciseId: "pattern_recognition", count: 15 },
    { exerciseId: "stroop_challenge", count: 12 },
    { exerciseId: "nback_memory", count: 10 },
    { exerciseId: "logical_sequences", count: 8 },
    { exerciseId: "creative_association", count: 7 },
  ],
  last30DaysHeatmap: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 3),
  })),
};
