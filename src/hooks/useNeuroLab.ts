import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NeuroLabArea, NeuroLabDuration, NeuroLabSession } from "@/lib/neuroLab";

// Save Neuro Lab session
export function useSaveNeuroLabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: Omit<NeuroLabSession, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("neuro_gym_sessions") // Database table name unchanged
        .insert({
          user_id: session.user_id,
          area: session.area,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neuro-lab-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
    },
  });
}

// Get user's Neuro Lab sessions
export function useNeuroLabSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ["neuro-lab-sessions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("neuro_gym_sessions") // Database table name unchanged
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data as NeuroLabSession[];
    },
    enabled: !!userId,
  });
}

// Get session counts by area for last 7 days
export function useNeuroLabWeeklyStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["neuro-lab-weekly-stats", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("neuro_gym_sessions") // Database table name unchanged
        .select("area")
        .eq("user_id", userId)
        .gte("completed_at", sevenDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Count sessions per area
      const stats: Record<NeuroLabArea, number> = {
        focus: 0,
        memory: 0,
        control: 0,
        reasoning: 0,
        creativity: 0,
        "neuro-activation": 0,
      };
      
      data?.forEach((session) => {
        const area = session.area as NeuroLabArea;
        if (area in stats) {
          stats[area]++;
        }
      });
      
      return stats;
    },
    enabled: !!userId,
  });
}

// Fetch exercises by multiple categories
export function useExercisesByCategories(categories: string[]) {
  return useQuery({
    queryKey: ["cognitive-exercises", "categories", categories],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_exercises")
        .select("*")
        .in("category", categories as any[]);
      
      if (error) throw error;
      return data;
    },
    enabled: categories.length > 0,
  });
}
