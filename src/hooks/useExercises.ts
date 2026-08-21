import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  CognitiveExercise, 
  ExerciseCategory, 
  ExerciseDuration,
  TrainingSession,
  UserCognitiveMetrics 
} from "@/lib/exercises";
import { getExerciseCountForDuration, shuffleArray } from "@/lib/exercises";
import { calculateSystemScores, type CognitiveStates } from "@/lib/cognitiveEngine";

const USER_METRICS_CACHE_VERSION = "v1";

function userMetricsCacheKey(userId: string): string {
  return `looma:user-metrics:${USER_METRICS_CACHE_VERSION}:${userId}`;
}

function readCachedUserMetrics(userId: string | undefined): UserCognitiveMetrics | undefined {
  if (!userId || typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(userMetricsCacheKey(userId));
    return raw ? JSON.parse(raw) as UserCognitiveMetrics : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedUserMetrics(userId: string, metrics: UserCognitiveMetrics | null): void {
  if (!metrics || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(userMetricsCacheKey(userId), JSON.stringify(metrics));
  } catch {
    // Storage is an acceleration layer only; cloud remains authoritative.
  }
}

// Fetch all exercises
export function useExercises() {
  return useQuery({
    queryKey: ["cognitive-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_exercises")
        .select("*")
        .order("id");
      
      if (error) throw error;
      return data as CognitiveExercise[];
    },
  });
}

// Fetch exercises by category
export function useExercisesByCategory(category: ExerciseCategory) {
  return useQuery({
    queryKey: ["cognitive-exercises", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_exercises")
        .select("*")
        .eq("category", category);
      
      if (error) throw error;
      return data as CognitiveExercise[];
    },
  });
}

// Generate a training session with exercises
export function useGenerateTrainingSession() {
  return useMutation({
    mutationFn: async ({ 
      category, 
      duration 
    }: { 
      category: ExerciseCategory; 
      duration: ExerciseDuration;
    }) => {
      const count = getExerciseCountForDuration(duration);
      
      // Get exercises matching category
      // For some categories, we might want to mix in bias/logic exercises
      let categories: ExerciseCategory[] = [category];
      
      // Mix categories for richer training experience
      if (category === "reasoning") {
        categories = ["reasoning", "logic_puzzle", "bias"];
      } else if (category === "decision") {
        categories = ["decision", "bias", "reasoning"];
      } else if (category === "clarity") {
        categories = ["clarity", "reasoning"];
      }
      
      const { data, error } = await supabase
        .from("cognitive_exercises")
        .select("*")
        .in("category", categories);
      
      if (error) throw error;
      
      // Shuffle and pick required count
      const shuffled = shuffleArray(data || []);
      
      // Prioritize primary category
      const primaryExercises = shuffled.filter(e => e.category === category);
      const secondaryExercises = shuffled.filter(e => e.category !== category);
      
      // Take majority from primary category
      const primaryCount = Math.ceil(count * 0.7);
      const secondaryCount = count - primaryCount;
      
      const selected = [
        ...primaryExercises.slice(0, primaryCount),
        ...secondaryExercises.slice(0, secondaryCount),
      ].slice(0, count);
      
      // If not enough primary, fill with secondary
      if (selected.length < count) {
        const remaining = [...primaryExercises, ...secondaryExercises]
          .filter(e => !selected.includes(e))
          .slice(0, count - selected.length);
        selected.push(...remaining);
      }
      
      return shuffleArray(selected) as CognitiveExercise[];
    },
  });
}

// Save training session result
export function useSaveTrainingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: Omit<TrainingSession, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("training_sessions")
        .insert({
          user_id: session.user_id,
          training_mode: session.training_mode,
          duration_option: session.duration_option,
          exercises_used: session.exercises_used,
          score: session.score,
          correct_answers: session.correct_answers,
          total_questions: session.total_questions,
          completed_at: session.completed_at,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, session) => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics", session.user_id] });
    },
  });
}

// Get user's training sessions
export function useTrainingSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ["training-sessions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data as TrainingSession[];
    },
    enabled: !!userId,
  });
}

// Get user's cognitive metrics
export function useUserMetrics(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-metrics", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      const metrics = data as UserCognitiveMetrics | null;
      writeCachedUserMetrics(userId, metrics);
      return metrics;
    },
    enabled: !!userId,
    // Cold native launches render the last cloud-confirmed row immediately,
    // while React Query refreshes it in the background.
    initialData: () => readCachedUserMetrics(userId),
    initialDataUpdatedAt: 0,
    staleTime: 60_000, // 1 minute - prevent refetch on every mount
    refetchOnWindowFocus: false,
    // A baseline or training write can happen while this query is inactive.
    // Refetch stale data when Home/Monitor mounts again instead of retaining it indefinitely.
    refetchOnMount: true,
    placeholderData: (prev) => prev ?? undefined, // Keep previous data during refetch
  });
}

// Create or update user metrics
export function useUpdateUserMetrics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      metricUpdates,
      isBaseline = false, // When true, save values directly (for initial assessment)
    }: { 
      userId: string; 
      metricUpdates: Record<string, number>;
      isBaseline?: boolean;
    }) => {
      // First, get current metrics
      const { data: existing, error: fetchError } = await supabase
        .from("user_cognitive_metrics")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const mapMetricName = (name: string): string => {
        const mapping: Record<string, string> = {
          reasoningAccuracy: "reasoning_accuracy",
          clarityScore: "clarity_score",
          decisionQuality: "decision_quality",
          fastThinking: "fast_thinking",
          slowThinking: "slow_thinking",
          biasResistance: "bias_resistance",
          criticalThinkingScore: "critical_thinking_score",
          creativity: "creativity",
          philosophicalReasoning: "philosophical_reasoning",
        };
        return mapping[name] || name;
      };
      
      if (existing) {
        // Update existing metrics - build proper update object
        const updates: Record<string, number | string> = {};
        
        Object.entries(metricUpdates).forEach(([key, value]) => {
          const dbKey = mapMetricName(key) as keyof UserCognitiveMetrics;
          
          if (isBaseline) {
            // For initial assessment: save value directly (current = baseline)
            updates[mapMetricName(key)] = Math.round(value * 10) / 10;
          } else {
            // For training sessions: use gradual improvement formula
            const currentValue = (existing[dbKey] as number) || 50;
            
            /**
             * GRADUAL IMPROVEMENT FORMULA
             * ===========================
             * Formula: newValue = min(100, currentValue + earnedPoints × 0.5)
             * 
             * The 0.5 dampening factor ensures:
             * 1. Scores don't inflate too quickly from single sessions
             * 2. Consistent training over time is required for meaningful improvement
             * 3. Maximum possible score is capped at 100
             * 
             * Example: If you score 80% on a medium exercise affecting reasoning_accuracy (currently 55):
             * earnedPoints = 0.8 × 2 × 1 = 1.6
             * newValue = 55 + 1.6 × 0.5 = 55.8
             */
            const newValue = Math.min(100, currentValue + value * 0.5);
            updates[mapMetricName(key)] = Math.round(newValue * 10) / 10;
          }
        });
        
        // Only increment session count for training, not baseline
        if (!isBaseline) {
          updates.total_sessions = (existing.total_sessions || 0) + 1;
        }
        
        // Calculate Cognitive Performance Score using canonical engine
        // (Performance Avg = mean of AE/RA/CT/IN). Readiness is computed live in UI
        // from rolling-window data, so we no longer persist a divergent value here.
        const states: CognitiveStates = {
          AE: (updates.focus_stability as number) ?? existing.focus_stability ?? 50,
          RA: (updates.fast_thinking as number) ?? existing.fast_thinking ?? 50,
          CT: (updates.reasoning_accuracy as number) ?? existing.reasoning_accuracy ?? 50,
          IN: (updates.slow_thinking as number) ?? existing.slow_thinking ?? 50,
        };
        const { S1, S2 } = calculateSystemScores(states);
        const performanceAvg = (S1 + S2) / 2;
        updates.cognitive_performance_score = Math.round(performanceAvg * 10) / 10;
        
        const { data, error } = await supabase
          .from("user_cognitive_metrics")
          .update(updates)
          .eq("user_id", userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new metrics record with proper typing
        const newMetrics: Record<string, number | string> = {
          user_id: userId,
          total_sessions: isBaseline ? 0 : 1, // 0 sessions for baseline, as training hasn't started
          reasoning_accuracy: 50,
          clarity_score: 50,
          decision_quality: 50,
          fast_thinking: 50,
          slow_thinking: 50,
          focus_stability: 50,
          bias_resistance: 50,
          critical_thinking_score: 50,
          creativity: 50,
          philosophical_reasoning: 50,
        };
        
        Object.entries(metricUpdates).forEach(([key, value]) => {
          const dbKey = mapMetricName(key);
          if (dbKey in newMetrics && dbKey !== 'user_id') {
            if (isBaseline) {
              // For initial assessment: save value directly
              newMetrics[dbKey] = Math.round(value * 10) / 10;
            } else {
              // For training: use formula (but this shouldn't happen for new records)
              newMetrics[dbKey] = Math.min(100, 50 + value * 0.5);
            }
          }
        });
        
        // Initial Cognitive Performance Score using canonical engine
        const initStates: CognitiveStates = {
          AE: Number(newMetrics.focus_stability) || 50,
          RA: Number(newMetrics.fast_thinking) || 50,
          CT: Number(newMetrics.reasoning_accuracy) || 50,
          IN: Number(newMetrics.slow_thinking) || 50,
        };
        const { S1: initS1, S2: initS2 } = calculateSystemScores(initStates);
        const initialPerformance = (initS1 + initS2) / 2;

        // Build insert object with proper types
        const insertData = {
          user_id: userId,
          total_sessions: isBaseline ? 0 : 1,
          reasoning_accuracy: Number(newMetrics.reasoning_accuracy) || 50,
          clarity_score: Number(newMetrics.clarity_score) || 50,
          decision_quality: Number(newMetrics.decision_quality) || 50,
          fast_thinking: Number(newMetrics.fast_thinking) || 50,
          slow_thinking: Number(newMetrics.slow_thinking) || 50,
          focus_stability: Number(newMetrics.focus_stability) || 50,
          bias_resistance: Number(newMetrics.bias_resistance) || 50,
          critical_thinking_score: Number(newMetrics.critical_thinking_score) || 50,
          creativity: Number(newMetrics.creativity) || 50,
          philosophical_reasoning: Number(newMetrics.philosophical_reasoning) || 50,
          cognitive_performance_score: Math.round(initialPerformance * 10) / 10,
        };
        
        const { data, error } = await supabase
          .from("user_cognitive_metrics")
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (metrics, { userId }) => {
      writeCachedUserMetrics(userId, metrics as UserCognitiveMetrics);
      queryClient.setQueryData(["user-metrics", userId], metrics);
      queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    },
  });
}

// Get exercise count
export function useExerciseCount() {
  return useQuery({
    queryKey: ["exercise-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("cognitive_exercises")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
}
