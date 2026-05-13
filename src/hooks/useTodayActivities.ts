import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

const DURATION_MINUTES: Record<string, number> = {
  "30s": 0.5, "1min": 1, "90s": 1.5, "2min": 2, "3min": 3, "5min": 5, "7min": 7,
};

// Daily game targets by plan (from dailyEstimate)
const DAILY_GAME_TARGET: Record<TrainingPlanId, number> = {
  light: 1,
  expert: 2,
  superhuman: 3,
};

// Daily Quality Time minutes target by plan
const DAILY_QUALITY_TARGET: Record<TrainingPlanId, number> = {
  light: 8,
  expert: 15,
  superhuman: 20,
};

export type ActivityKey = "games" | "quality" | "detox" | "walk";

export interface TodayActivity {
  key: ActivityKey;
  label: string;
  /** Primary metric value rendered in the left tile (number or duration string). */
  tileValue: string;
  /** Tile sub-label (e.g., "min", "games"). */
  tileUnit: string;
  /** Right-side progress text (e.g., "0 / 2 today"). */
  progress: string;
  /** Done >= target. */
  complete: boolean;
  /** Has any activity recorded today. */
  hasActivity: boolean;
}

export function useTodayActivities() {
  const { user } = useAuth();
  const planId: TrainingPlanId = (user?.trainingPlan || "expert") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  return useQuery({
    queryKey: ["today-activities", user?.id, planId],
    queryFn: async (): Promise<TodayActivity[]> => {
      const gamesTarget = DAILY_GAME_TARGET[planId] ?? 2;
      const qualityTarget = DAILY_QUALITY_TARGET[planId] ?? 15;
      const detoxTarget = plan?.detox.dailyMinimumMinutes ?? 30;
      const walkTarget = plan?.detox.walkingMinMinutes ?? 30;

      if (!user?.id) {
        return buildDefaults(gamesTarget, qualityTarget, detoxTarget, walkTarget);
      }

      const todayStart = startOfDay(new Date()).toISOString();

      const [gamesRes, qualityRes, detoxRes, walkRes] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("id")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("reason_sessions")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .gte("started_at", todayStart)
          .not("ended_at", "is", null),
        supabase
          .from("detox_completions")
          .select("duration_minutes")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("walking_sessions")
          .select("duration_minutes")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
      ]);

      const gamesDone = gamesRes.data?.length ?? 0;
      const qualityMin = Math.round(
        (qualityRes.data || []).reduce(
          (s, r: any) => s + (Number(r.duration_seconds) || 0) / 60,
          0,
        ),
      );
      const detoxMin = Math.round(
        (detoxRes.data || []).reduce(
          (s, r: any) => s + (Number(r.duration_minutes) || 0),
          0,
        ),
      );
      const walkMin = Math.round(
        (walkRes.data || []).reduce(
          (s, r: any) => s + (Number(r.duration_minutes) || 0),
          0,
        ),
      );

      return [
        {
          key: "games",
          label: "Cognitive Games",
          tileValue: String(gamesDone),
          tileUnit: gamesDone === 1 ? "game" : "games",
          progress: `${gamesDone} / ${gamesTarget} today`,
          complete: gamesDone >= gamesTarget,
          hasActivity: gamesDone > 0,
        },
        {
          key: "quality",
          label: "Quality Time",
          tileValue: String(qualityMin),
          tileUnit: "min",
          progress: `${qualityMin} / ${qualityTarget} min`,
          complete: qualityMin >= qualityTarget,
          hasActivity: qualityMin > 0,
        },
        {
          key: "detox",
          label: "Detox",
          tileValue: String(detoxMin),
          tileUnit: "min",
          progress: `${detoxMin} / ${detoxTarget} min`,
          complete: detoxMin >= detoxTarget,
          hasActivity: detoxMin > 0,
        },
        {
          key: "walk",
          label: "Walking",
          tileValue: String(walkMin),
          tileUnit: "min",
          progress: `${walkMin} / ${walkTarget} min`,
          complete: walkMin >= walkTarget,
          hasActivity: walkMin > 0,
        },
      ];
    },
    staleTime: 60_000,
  });
}

function buildDefaults(
  gamesTarget: number,
  qualityTarget: number,
  detoxTarget: number,
  walkTarget: number,
): TodayActivity[] {
  return [
    { key: "games", label: "Cognitive Games", tileValue: "0", tileUnit: "games", progress: `0 / ${gamesTarget} today`, complete: false, hasActivity: false },
    { key: "quality", label: "Quality Time", tileValue: "0", tileUnit: "min", progress: `0 / ${qualityTarget} min`, complete: false, hasActivity: false },
    { key: "detox", label: "Detox", tileValue: "0", tileUnit: "min", progress: `0 / ${detoxTarget} min`, complete: false, hasActivity: false },
    { key: "walk", label: "Walking", tileValue: "0", tileUnit: "min", progress: `0 / ${walkTarget} min`, complete: false, hasActivity: false },
  ];
}
