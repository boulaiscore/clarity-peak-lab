import { useEffect, useRef } from "react";
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
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Keep a stable userId across route changes to prevent "reset to zero" UI.
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;
  const userId = computedUserId ?? lastUserIdRef.current;

  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  // Lightweight instrumentation (preview runs as production, so keep it minimal)
  useEffect(() => {
    console.log("[useWeeklyProgress]", { userId, weekStart, planId });
  }, [userId, weekStart, planId]);

  // Fetch weekly progress record
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["weekly-progress", userId, weekStart],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("weekly_training_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (error) throw error;

      // If no record exists, return default
      if (!data) {
        return {
          id: "",
          user_id: userId,
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
    enabled: !!userId,
    // Prevent "flash to zero" when navigating away/back: keep cache "fresh" briefly.
    staleTime: 60_000,
    placeholderData: (prev) =>
      prev ??
      (userId
        ? {
            id: "",
            user_id: userId,
            week_start: weekStart,
            plan_id: planId,
            sessions_completed: [] as SessionCompleted[],
          }
        : null),
  });

  // Fetch weekly XP from exercise_completions table (real XP)
  const {
    data: weeklyXPData,
    isLoading: weeklyXPLoading,
    isFetching: weeklyXPFetching,
    isFetched: weeklyXPFetched,
  } = useQuery({
    queryKey: ["weekly-exercise-xp", userId, weekStart],
    queryFn: async () => {
      if (!userId) return { totalXP: 0, gamesXP: 0, contentXP: 0, completions: [] };

      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", weekStart);

      if (error) throw error;

      const completions = data || [];
      const totalXP = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);

      // Separate XP by source (content starts with "content-" prefix)
      const contentXP = completions
        .filter((c) => c.exercise_id?.startsWith("content-"))
        .reduce((sum, c) => sum + (c.xp_earned || 0), 0);
      const gamesXP = totalXP - contentXP;

      return { totalXP, gamesXP, contentXP, completions };
    },
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000, // 10 min – reduce aggressive eviction
    // Keep previous data during refetch/mount to prevent flash to zero
    placeholderData: (prev) => prev ?? { totalXP: 0, gamesXP: 0, contentXP: 0, completions: [] },
  });

  const recordSession = useMutation({
    mutationFn: async ({ sessionType, gamesCount }: { sessionType: SessionType; gamesCount: number }) => {
      if (!userId) throw new Error("Not authenticated");

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
        .eq("user_id", userId)
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
          .eq("user_id", userId)
          .eq("week_start", weekStart)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Insert new record
      const { error } = await supabase.from("weekly_training_progress").insert([
        {
          user_id: userId,
          week_start: weekStart,
          plan_id: planId,
          sessions_completed: updatedSessions as unknown as Json,
        },
      ]);

      if (error) throw error;

      // Fetch the inserted record
      const { data: inserted } = await supabase
        .from("weekly_training_progress")
        .select()
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .single();

      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
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

  // Weekly XP from real exercise completions
  const weeklyXPEarned = weeklyXPData?.totalXP || 0;
  const weeklyGamesXP = weeklyXPData?.gamesXP || 0;
  const weeklyContentXP = weeklyXPData?.contentXP || 0;
  const weeklyXPTarget = plan.weeklyXPTarget;

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
    isLoading: progressLoading || weeklyXPLoading,
    // "Syncing" includes background refetches (route changes, focus, invalidations)
    isSyncing: weeklyXPFetching,
    // isFetched = query has successfully fetched at least once
    isFetched: weeklyXPFetched,
    recordSession,
    sessionsCompleted,
    sessionsRequired,
    weeklyProgress,
    gamesCompletedThisWeek,
    weeklyXPEarned,
    weeklyGamesXP,
    weeklyContentXP,
    weeklyXPTarget,
    completedSessionTypes,
    getNextSession,
    plan,
  };
}
