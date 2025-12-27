import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";

function getCurrentWeekStart(): string {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  return format(weekStart, "yyyy-MM-dd");
}

export interface DetoxCompletion {
  id: string;
  user_id: string;
  duration_minutes: number;
  xp_earned: number;
  completed_at: string;
  week_start: string;
}

export function useWeeklyDetoxXP() {
  const { user } = useAuth();
  const weekStart = getCurrentWeekStart();

  return useQuery({
    queryKey: ["weekly-detox-xp", user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return { totalXP: 0, totalMinutes: 0, completions: [] };

      const { data, error } = await supabase
        .from("detox_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart);

      if (error) throw error;

      const completions = data as DetoxCompletion[];
      const totalXP = completions.reduce((sum, c) => sum + c.xp_earned, 0);
      const totalMinutes = completions.reduce((sum, c) => sum + c.duration_minutes, 0);

      return { totalXP, totalMinutes, completions };
    },
    enabled: !!user?.id,
  });
}

export function useTodayDetoxMinutes() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["today-detox-minutes", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from("detox_completions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("completed_at", `${today}T00:00:00`)
        .lte("completed_at", `${today}T23:59:59`);

      if (error) throw error;

      return (data || []).reduce((sum, c) => sum + c.duration_minutes, 0);
    },
    enabled: !!user?.id,
  });
}

export function useRecordDetoxCompletion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekStart = getCurrentWeekStart();

  return useMutation({
    mutationFn: async ({ durationMinutes, xpEarned }: { durationMinutes: number; xpEarned: number }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("detox_completions")
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          xp_earned: xpEarned,
          week_start: weekStart,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-detox-xp"] });
      queryClient.invalidateQueries({ queryKey: ["today-detox-minutes"] });
    },
  });
}
