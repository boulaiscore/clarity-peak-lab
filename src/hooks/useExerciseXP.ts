import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getExerciseXP } from "@/lib/trainingPlans";
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

// Record a completed exercise
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
    }: {
      exerciseId: string;
      gymArea: string;
      thinkingMode: string | null;
      difficulty: "easy" | "medium" | "hard";
      score: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const xpEarned = getExerciseXP(difficulty);
      const weekStart = getCurrentWeekStart();

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
      return data as ExerciseCompletion;
    },
    onSuccess: () => {
      // Invalidate to refresh XP counts
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