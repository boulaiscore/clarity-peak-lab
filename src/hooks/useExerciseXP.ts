import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getExerciseXP } from "@/lib/trainingPlans";
import { startOfWeek, format } from "date-fns";
import { 
  getXPRouting, 
  calculateStateUpdate, 
  SkillTarget,
} from "@/lib/cognitiveEngine";

// Map skill target to timestamp column for decay tracking
const SKILL_TO_TIMESTAMP_COLUMN: Record<SkillTarget, string> = {
  AE: "last_ae_xp_at",
  RA: "last_ra_xp_at",
  CT: "last_ct_xp_at",
  IN: "last_in_xp_at",
};

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

// Map skill target to database column
const SKILL_TO_COLUMN: Record<SkillTarget, string> = {
  AE: "focus_stability",
  RA: "fast_thinking",
  CT: "reasoning_accuracy",
  IN: "slow_thinking",
};

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

/**
 * Record a completed exercise AND update cognitive metrics.
 * 
 * ⚠️ CRITICAL (Section B - Games Training):
 * - Each game session awards XP according to difficulty
 * - XP routes to ONE AND ONLY ONE skill
 * - Skill update rule: Δskill = XP × 0.5
 * - Raw game performance (accuracy, reaction time, score) is for feedback ONLY
 * - Performance MUST NOT directly affect Sharpness/Readiness/SCI/CognitiveAge
 */
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
      exercise?: any; // Legacy, not used
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

      // 2. Update cognitive metrics using NEW cognitive engine
      // Route XP to ONE AND ONLY ONE skill based on gym_area + thinking_mode
      const routing = getXPRouting(gymArea, thinkingMode || "slow");
      const targetColumn = SKILL_TO_COLUMN[routing.skill];

      // Get current metrics
      const { data: currentMetrics } = await supabase
        .from("user_cognitive_metrics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentMetrics) {
        const currentValue = (currentMetrics as any)[targetColumn] || 50;
        
        // Apply score scaling: XP = baseXP × (score / 100)
        const scaledXP = xpEarned * (score / 100);
        
        // Apply state update formula: Δstate = XP × 0.5
        const newValue = calculateStateUpdate(currentValue, scaledXP);
        
        // Update skill value AND timestamp for decay tracking
        const timestampColumn = SKILL_TO_TIMESTAMP_COLUMN[routing.skill];
        const updates: Record<string, number | string> = {
          [targetColumn]: Math.round(newValue * 10) / 10,
          [timestampColumn]: new Date().toISOString(),
          last_xp_at: new Date().toISOString(), // Also update global last XP timestamp
        };

        console.log("[XP Routing]", {
          exerciseId,
          gymArea,
          thinkingMode,
          routing,
          targetColumn,
          currentValue,
          scaledXP,
          newValue,
        });

        await supabase
          .from("user_cognitive_metrics")
          .update(updates)
          .eq("user_id", user.id);
      } else {
        // Create new metrics record if none exists - initialize ALL skills to 50
        const initialValue = calculateStateUpdate(50, xpEarned * (score / 100));
        const timestampColumn = SKILL_TO_TIMESTAMP_COLUMN[routing.skill];
        const now = new Date().toISOString();
        
        await supabase
          .from("user_cognitive_metrics")
          .insert({
            user_id: user.id,
            focus_stability: routing.skill === "AE" ? Math.round(initialValue * 10) / 10 : 50,
            fast_thinking: routing.skill === "RA" ? Math.round(initialValue * 10) / 10 : 50,
            reasoning_accuracy: routing.skill === "CT" ? Math.round(initialValue * 10) / 10 : 50,
            slow_thinking: routing.skill === "IN" ? Math.round(initialValue * 10) / 10 : 50,
            [timestampColumn]: now,
            last_xp_at: now,
          });
      }

      return { ...data, xpEarned } as ExerciseCompletion & { xpEarned: number };
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries for real-time UI updates
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics", data?.user_id] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["games-xp-breakdown"] });
      // Dashboard Training Details queries
      queryClient.invalidateQueries({ queryKey: ["weekly-game-completions-v3"] });
      queryClient.invalidateQueries({ queryKey: ["games-history-system-breakdown"] });
    },
  });
}

/**
 * Record a completed content item (podcast, book, article)
 * v1.3: Tasks do NOT give XP - they are tracked for protocol adherence only
 * This function records completions but xpEarned is 0
 */
export function useRecordContentCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentId,
      contentType,
    }: {
      contentId: string;
      contentType: "podcast" | "book" | "article";
      xpEarned?: number; // Deprecated in v1.3, kept for API compatibility
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const weekStart = getCurrentWeekStart();

      // v1.3: Tasks do NOT give XP - record with 0 XP
      const { data, error } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: `content-${contentType}-${contentId}`,
          gym_area: "content",
          thinking_mode: null,
          difficulty: "medium",
          xp_earned: 0, // v1.3: Tasks don't give XP
          score: 100,
          week_start: weekStart,
        })
        .select()
        .single();

      if (error) throw error;

      // v1.3: Tasks do NOT affect cognitive metrics
      // Removed: getTaskXPAllocation and metric updates

      return data as ExerciseCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      // Dashboard Training Details queries
      queryClient.invalidateQueries({ queryKey: ["weekly-content-completions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-history-14d"] });
      // Task Priming for RQ - ensures RQ recalculates after complete
      queryClient.invalidateQueries({ queryKey: ["task-completions-7d"] });
      // Library refresh
      queryClient.invalidateQueries({ queryKey: ["logged-exposures"] });
    },
  });
}

// Remove a content completion record (when user uncompletes)
// Deletes ALL records for this content (across all weeks) so it fully reverts.
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

      const exerciseId = `content-${contentType}-${contentId}`;

      // Delete ALL records for this exercise_id (any week) so it fully reverts
      const { error } = await supabase
        .from("exercise_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("exercise_id", exerciseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      // Dashboard Training Details queries
      queryClient.invalidateQueries({ queryKey: ["weekly-content-completions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-history-14d"] });
      // Library query
      queryClient.invalidateQueries({ queryKey: ["logged-exposures"] });
      // Task Priming for RQ - ensures RQ recalculates after remove
      queryClient.invalidateQueries({ queryKey: ["task-completions-7d"] });
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
