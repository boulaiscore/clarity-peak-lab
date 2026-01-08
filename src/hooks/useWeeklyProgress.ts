import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, addDays, format } from "date-fns";
import { TrainingPlanId, TRAINING_PLANS, SessionType, XP_VALUES } from "@/lib/trainingPlans";
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

type WeeklyXPRow = {
  exercise_id: string;
  xp_earned: number;
  week_start: string;
};

type WeeklyXPResult = {
  totalXP: number;
  gamesXP: number;
  contentXP: number;
  completions: WeeklyXPRow[];
};

// Helper to read persisted userId (safe, runs outside render)
function getPersistedUserId(): string | undefined {
  try {
    return localStorage.getItem("nl:lastUserId") || undefined;
  } catch {
    return undefined;
  }
}

export function useWeeklyProgress() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Keep a stable userId across route changes to prevent "reset to zero" UI.
  // We use a module-level variable as ultimate fallback to survive React Fast Refresh.
  const lastUserIdRef = useRef<string | undefined>(getPersistedUserId());

  const computedUserId = user?.id ?? session?.user?.id;

  // Update ref when we have a fresh userId
  if (computedUserId && lastUserIdRef.current !== computedUserId) {
    lastUserIdRef.current = computedUserId;
  }

  const userId = computedUserId ?? lastUserIdRef.current;

  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  // Persist last known userId for stability across remounts (tab switches)
  useEffect(() => {
    if (!computedUserId) return;
    try {
      localStorage.setItem("nl:lastUserId", computedUserId);
    } catch {
      // ignore
    }
  }, [computedUserId]);

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
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Re-entering tabs/routes must refresh if server data changed
    refetchOnMount: "always",
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
    error: weeklyXPError,
  } = useQuery<WeeklyXPResult>({
    queryKey: ["weekly-exercise-xp", userId, weekStart],
    queryFn: async (): Promise<WeeklyXPResult> => {
      if (!userId) return { totalXP: 0, gamesXP: 0, contentXP: 0, completions: [] };

      console.log("[useWeeklyProgress][weekly-exercise-xp][start]", { userId, weekStart });

      try {
        const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEndDate = addDays(weekStartDate, 7);

        const [exerciseRes, contentRes] = await Promise.all([
          supabase
            .from("exercise_completions")
            .select("exercise_id, xp_earned, week_start")
            .eq("user_id", userId)
            .eq("week_start", weekStart),

          supabase
            .from("monthly_content_assignments")
            .select("content_type, content_id, completed_at, status")
            .eq("user_id", userId)
            .eq("status", "completed")
            .gte("completed_at", weekStartDate.toISOString())
            .lt("completed_at", weekEndDate.toISOString()),
        ]);

        if (exerciseRes.error) throw exerciseRes.error;
        if (contentRes.error) throw contentRes.error;

        const completions = ((exerciseRes.data || []) as WeeklyXPRow[]).filter(Boolean);
        const totalXP = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);

        // Content XP from exercise_completions (newer path)
        const contentRows = completions.filter((c) => c.exercise_id?.startsWith("content-"));

        const contentXPFromCompletions = contentRows.reduce(
          (sum, c) => sum + (c.xp_earned || 0),
          0
        );

        // Track which content IDs are already represented in exercise_completions
        const contentIdsFromCompletions = new Set<string>();
        for (const c of contentRows) {
          const exerciseId = String(c.exercise_id || "");
          // Expected: content-{type}-{contentId}
          const parts = exerciseId.split("-");
          const contentId = parts.slice(2).join("-");
          if (contentId) contentIdsFromCompletions.add(contentId);
        }

        // Content XP from monthly_content_assignments (fallback/backfill)
        // IMPORTANT: only add assignments that are NOT already present in exercise_completions,
        // otherwise we under/over-count when both systems are active.
        const contentXPFromAssignmentsMissing = (contentRes.data || []).reduce((sum, row) => {
          const contentId = String((row as any).content_id || "");
          if (!contentId) return sum;
          if (contentIdsFromCompletions.has(contentId)) return sum;

          const t = (row as any).content_type as string | null;
          const normalized: "podcast" | "book" | "article" =
            t === "reading" ? "article" : t === "book" ? "book" : "podcast";

          const xp =
            normalized === "podcast"
              ? XP_VALUES.podcastComplete
              : normalized === "book"
                ? XP_VALUES.bookChapterComplete
                : XP_VALUES.readingComplete;

          return sum + xp;
        }, 0);

        const contentXP = contentXPFromCompletions + contentXPFromAssignmentsMissing;

        // Games XP is derived ONLY from exercise_completions (assignments are separate backfill)
        const gamesXP = Math.max(0, totalXP - contentXPFromCompletions);

        // Total XP should include backfilled assignment XP so the weekly load is consistent
        const totalXPAdjusted = totalXP + contentXPFromAssignmentsMissing;

        console.log("[useWeeklyProgress][weekly-exercise-xp][ok]", {
          userId,
          weekStart,
          n: completions.length,
          totalXP: totalXPAdjusted,
          gamesXP,
          contentXP,
          contentXPFromCompletions,
          contentXPFromAssignments: contentXPFromAssignmentsMissing,
        });

        return { totalXP: totalXPAdjusted, gamesXP, contentXP, completions };
      } catch (err) {
        console.error("[useWeeklyProgress][weekly-exercise-xp][error]", { userId, weekStart, err });
        throw err;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Re-entering tabs/routes must refresh if server data changed
    refetchOnMount: "always",
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
  const gamesCompletedThisWeek =
    progress?.sessions_completed?.reduce((sum, s) => sum + s.games_count, 0) || 0;

  // Weekly XP from real exercise completions
  const weeklyXPEarned = weeklyXPData?.totalXP || 0;
  const weeklyGamesXP = weeklyXPData?.gamesXP || 0;
  const weeklyContentXP = weeklyXPData?.contentXP || 0;
  const weeklyXPTarget = plan.weeklyXPTarget;

  useEffect(() => {
    console.log("[useWeeklyProgress][derived]", {
      userId,
      weekStart,
      weeklyXPEarned,
      weeklyGamesXP,
      weeklyContentXP,
      hasData: !!weeklyXPData,
      hasError: !!weeklyXPError,
    });
  }, [
    userId,
    weekStart,
    weeklyXPEarned,
    weeklyGamesXP,
    weeklyContentXP,
    weeklyXPData,
    weeklyXPError,
  ]);

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
    // isFetched = data is available (not placeholder-only) and no error
    isFetched: weeklyXPFetched && !weeklyXPError,
    isError: !!weeklyXPError,
    weeklyXPError,
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
