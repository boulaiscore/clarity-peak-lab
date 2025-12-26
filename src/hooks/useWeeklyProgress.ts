import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";
import { TrainingPlanId, TRAINING_PLANS, SessionType } from "@/lib/trainingPlans";
import type { Json } from "@/integrations/supabase/types";

interface SessionCompleted {
  session_type: SessionType;
  completed_at: string;
  games_count: number;
}

interface WeeklyProgress {
  id: string;
  user_id: string;
  week_start: string;
  plan_id: TrainingPlanId;
  sessions_completed: SessionCompleted[];
}

export function useWeeklyProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  const { data: progress, isLoading } = useQuery({
    queryKey: ["weekly-progress", user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("weekly_training_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no record exists, return default
      if (!data) {
        return {
          id: "",
          user_id: user.id,
          week_start: weekStart,
          plan_id: planId,
          sessions_completed: [] as SessionCompleted[],
        };
      }
      
      return {
        ...data,
        sessions_completed: (data.sessions_completed as unknown as SessionCompleted[]) || [],
      } as WeeklyProgress;
    },
    enabled: !!user?.id,
  });

  const recordSession = useMutation({
    mutationFn: async ({ sessionType, gamesCount }: { sessionType: SessionType; gamesCount: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const newSession: SessionCompleted = {
        session_type: sessionType,
        completed_at: new Date().toISOString(),
        games_count: gamesCount,
      };

      const existingProgress = progress;
      const updatedSessions = [...(existingProgress?.sessions_completed || []), newSession];

      // Check if record exists
      const { data: existing } = await supabase
        .from("weekly_training_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("weekly_training_progress")
          .update({
            plan_id: planId,
            sessions_completed: updatedSessions as unknown as Json,
          })
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("weekly_training_progress")
          .insert([{
            user_id: user.id,
            week_start: weekStart,
            plan_id: planId,
            sessions_completed: updatedSessions as unknown as Json,
          }]);

        if (error) throw error;
        
        // Fetch the inserted record
        const { data: inserted } = await supabase
          .from("weekly_training_progress")
          .select()
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .single();
          
        return inserted;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
    },
  });

  // Calculate progress metrics
  const sessionsCompleted = progress?.sessions_completed?.length || 0;
  const sessionsRequired = plan.sessionsPerWeek;
  const weeklyProgress = Math.min(100, (sessionsCompleted / sessionsRequired) * 100);

  // Get games completed this week
  const gamesCompletedThisWeek = progress?.sessions_completed?.reduce(
    (sum, s) => sum + s.games_count, 0
  ) || 0;

  // Get which session types have been completed
  const completedSessionTypes = progress?.sessions_completed?.map(s => s.session_type) || [];

  // Get next session to do
  const getNextSession = () => {
    const requiredSessions = plan.sessions.map(s => s.id);
    const nextSession = requiredSessions.find(s => !completedSessionTypes.includes(s));
    return nextSession ? plan.sessions.find(s => s.id === nextSession) : null;
  };

  return {
    progress,
    isLoading,
    recordSession,
    sessionsCompleted,
    sessionsRequired,
    weeklyProgress,
    gamesCompletedThisWeek,
    completedSessionTypes,
    getNextSession,
    plan,
  };
}
