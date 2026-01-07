import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getExerciseXP } from "@/lib/trainingPlans";
import { getSingleExerciseMetricUpdate } from "@/lib/exercises";
import { startOfWeek, format } from "date-fns";

export interface ExerciseCompletion {
  id: string;
  user_id: string;
  exercise_id: string;
  gym_area: string;
  thinking_mode: string | null;
  difficulty: string;
  xp_earned: number;
  score: number;
  completed_at: string;
  week_start: string;
}

// Get current week start (Monday)
function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

// Fetch weekly XP earned from exercise completions
export function useWeeklyExerciseXP() {
  const { user } = useAuth();
  const weekStart = getCurrentWeekStart();

  return useQuery({
    queryKey: ["weekly-exercise-xp", user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return { totalXP: 0, completions: [] };

      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const completions = (data || []) as ExerciseCompletion[];
      const totalXP = completions.reduce((sum, c) => sum + c.xp_earned, 0);

      return { totalXP, completions };
    },
    enabled: !!user?.id,
  });
}

// Record a completed exercise AND update cognitive metrics in real-time
export function useRecordExerciseCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      gymArea,
      thinkingMode,
      difficulty,
      score,
      exercise, // Pass the full exercise for metric calculation
    }: {
      exerciseId: string;
      gymArea: string;
      thinkingMode: string | null;
      difficulty: "easy" | "medium" | "hard";
      score: number;
      exercise?: {
        metrics_affected: string[];
        weight?: number;
        difficulty: string;
      };
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const xpEarned = getExerciseXP(difficulty);
      const weekStart = getCurrentWeekStart();

      // 1. Record the exercise completion
      const { data, error } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          gym_area: gymArea,
          thinking_mode: thinkingMode,
          difficulty,
          xp_earned: xpEarned,
          score,
          week_start: weekStart,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Update cognitive metrics in real-time if exercise data provided
      if (exercise && exercise.metrics_affected.length > 0) {
        const isCorrect = score >= 50;
        const metricUpdates = getSingleExerciseMetricUpdate(
          {
            id: exerciseId,
            metrics_affected: exercise.metrics_affected,
            weight: exercise.weight || 1,
            difficulty: exercise.difficulty as "easy" | "medium" | "hard",
          } as any,
          score,
          isCorrect
        );

        // Get current metrics
        const { data: currentMetrics } = await supabase
          .from("user_cognitive_metrics")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (currentMetrics) {
          const updates: Record<string, number> = {};
          
          // Map metric names and apply gradual improvement
          const metricMapping: Record<string, string> = {
            reasoning: "reasoning_accuracy",
            focus: "focus_stability",
            memory: "visual_processing",
            creativity: "creativity",
            fast_thinking: "fast_thinking",
            slow_thinking: "slow_thinking",
            reasoning_accuracy: "reasoning_accuracy",
            focus_stability: "focus_stability",
            decision_quality: "decision_quality",
            bias_resistance: "bias_resistance",
            critical_thinking: "critical_thinking_score",
          };

          Object.entries(metricUpdates).forEach(([metric, points]) => {
            const dbKey = metricMapping[metric] || metric.replace(/-/g, "_");
            const currentValue = (currentMetrics as any)[dbKey] || 50;
            
            // Apply the gradual improvement formula: newValue = min(100, max(0, current + points × 0.5))
            // This ensures scores update immediately but don't inflate too quickly
            const newValue = Math.min(100, Math.max(0, currentValue + points * 0.5));
            updates[dbKey] = Math.round(newValue * 10) / 10;
          });

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("user_cognitive_metrics")
              .update(updates)
              .eq("user_id", user.id);
          }
        }
      }

      return { ...data, xpEarned } as ExerciseCompletion & { xpEarned: number };
    },
    onSuccess: () => {
      // Invalidate all relevant queries for real-time UI updates
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    },
  });
}

// Record a completed content item (podcast, book, article)
export function useRecordContentCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      contentType,
      xpEarned,
    }: {
      contentId: string;
      contentType: "podcast" | "book" | "article";
      xpEarned: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const weekStart = getCurrentWeekStart();

      const { data, error } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: `content-${contentType}-${contentId}`,
          gym_area: "content",
          thinking_mode: null,
          difficulty: "medium",
          xp_earned: xpEarned,
          score: 100,
          week_start: weekStart,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExerciseCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
    },
  });
}

// Remove a content completion record (when user uncompletes)
export function useRemoveContentCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      contentType,
    }: {
      contentId: string;
      contentType: "podcast" | "book" | "article";
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const weekStart = getCurrentWeekStart();
      const exerciseId = `content-${contentType}-${contentId}`;

      const { error } = await supabase
        .from("exercise_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("exercise_id", exerciseId)
        .eq("week_start", weekStart);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
    },
  });
}

// Get completed exercise IDs for this week
export function useCompletedExerciseIds() {
  const { data } = useWeeklyExerciseXP();
  return new Set(data?.completions.map(c => c.exercise_id) || []);
}

// Get XP breakdown by area
export function useXPByArea() {
  const { data } = useWeeklyExerciseXP();
  
  const byArea: Record<string, number> = {};
  (data?.completions || []).forEach(c => {
    byArea[c.gym_area] = (byArea[c.gym_area] || 0) + c.xp_earned;
  });
  
  return byArea;
}