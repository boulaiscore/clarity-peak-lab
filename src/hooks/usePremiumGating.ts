import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NeuroLabArea, NeuroLabDuration } from "@/lib/neuroLab";

// Free tier constants
export const FREE_AREAS: NeuroLabArea[] = ["focus"];
export const FREE_DURATIONS: NeuroLabDuration[] = ["30s", "2min"];
export const MAX_DAILY_SESSIONS_FREE = 3;

interface DailySessionInfo {
  daily_sessions_count: number;
  last_session_date: string | null;
}

export function usePremiumGating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPremium = user?.subscriptionStatus === "premium";

  // Fetch daily sessions info
  const { data: sessionInfo } = useQuery({
    queryKey: ["daily-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("daily_sessions_count, last_session_date")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailySessionInfo | null;
    },
    enabled: !!user?.id,
  });

  // Check if we need to reset daily counter (new day)
  const today = new Date().toISOString().split("T")[0];
  const isNewDay = sessionInfo?.last_session_date !== today;
  const dailySessionsUsed = isNewDay ? 0 : (sessionInfo?.daily_sessions_count || 0);
  const remainingSessions = MAX_DAILY_SESSIONS_FREE - dailySessionsUsed;

  // Mutation to increment daily session count
  const incrementSession = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const newCount = isNewDay ? 1 : dailySessionsUsed + 1;
      
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_sessions_count: newCount,
          last_session_date: today,
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-sessions", user?.id] });
    },
  });

  // Access checks
  const canAccessArea = (areaId: NeuroLabArea | string): boolean => {
    if (isPremium) return true;
    return FREE_AREAS.includes(areaId as NeuroLabArea);
  };

  const canUseDuration = (duration: NeuroLabDuration | string): boolean => {
    if (isPremium) return true;
    return FREE_DURATIONS.includes(duration as NeuroLabDuration);
  };

  const canAccessNeuroActivation = (): boolean => {
    return isPremium;
  };

  const canStartSession = (): boolean => {
    if (isPremium) return true;
    return remainingSessions > 0;
  };

  const isAreaLocked = (areaId: NeuroLabArea | string): boolean => {
    return !canAccessArea(areaId);
  };

  const isDurationLocked = (duration: NeuroLabDuration | string): boolean => {
    return !canUseDuration(duration);
  };

  return {
    isPremium,
    canAccessArea,
    canUseDuration,
    canAccessNeuroActivation,
    canStartSession,
    isAreaLocked,
    isDurationLocked,
    dailySessionsUsed,
    remainingSessions,
    maxDailySessions: MAX_DAILY_SESSIONS_FREE,
    incrementSession,
  };
}
