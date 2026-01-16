import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCognitiveNetworkScore } from "@/hooks/useCognitiveNetworkScore";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format } from "date-fns";
import { 
  evaluateNeuralResetTrigger, 
  NeuralResetTrigger, 
  NEURAL_RESET_CONFIG 
} from "@/lib/neuralReset";

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

/**
 * Hook to evaluate Neural Reset trigger conditions
 */
export function useNeuralResetTrigger(isPostSession: boolean = false): NeuralResetTrigger & { isLoading: boolean } {
  const { sci, isLoading: sciLoading } = useCognitiveNetworkScore();
  const { states, isLoading: statesLoading } = useCognitiveStates();
  
  const isLoading = sciLoading || statesLoading;
  
  if (isLoading || !sci || !states) {
    return {
      shouldShow: false,
      reason: null,
      copy: "",
      cta: "",
      isLoading,
    };
  }
  
  const activityScore = sci.behavioralEngagement?.score ?? 0;
  const stabilityScore = states.AE ?? 50;
  
  const trigger = evaluateNeuralResetTrigger(
    activityScore,
    stabilityScore,
    0, // recentSessionsCount - could be enhanced
    isPostSession
  );
  
  return { ...trigger, isLoading };
}

/**
 * Hook to complete a Neural Reset session
 * Records completion and contributes to Recovery (via detox_completions)
 */
export function useCompleteNeuralReset() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (durationSeconds: number) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const weekStart = getCurrentWeekStart();
      
      // Record as detox completion with 0 XP (Neural Reset doesn't award XP)
      // This contributes to Recovery without affecting skills/XP
      const { error } = await supabase
        .from("detox_completions")
        .insert({
          user_id: user.id,
          duration_minutes: Math.round(durationSeconds / 60),
          completed_at: new Date().toISOString(),
          week_start: weekStart,
          xp_earned: 0, // Neural Reset contributes to recovery but earns no XP
        });
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["detox-completions"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-detox-xp"] });
      queryClient.invalidateQueries({ queryKey: ["today-metrics"] });
    },
  });
}

/**
 * Hook for Neural Reset functionality
 */
export function useNeuralReset() {
  const trigger = useNeuralResetTrigger();
  const completeSession = useCompleteNeuralReset();
  
  return {
    trigger,
    completeSession,
    config: NEURAL_RESET_CONFIG,
  };
}
