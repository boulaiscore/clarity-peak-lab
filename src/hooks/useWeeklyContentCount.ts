/**
 * Hook to fetch weekly content completions count (podcasts, books, articles).
 * This is separate from games completions count.
 * 
 * v2.0: Uses rolling 7-day window instead of calendar week.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";
import { getMediumPeriodStart, getMediumPeriodStartDate } from "@/lib/temporalWindows";

export function useWeeklyContentCount() {
  const { user, session } = useAuth();
  // v2.0: Use rolling 7-day window
  const rollingStartStr = getMediumPeriodStartDate();

  // Keep a stable userId across route changes
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;
  const userId = computedUserId ?? lastUserIdRef.current;

  return useQuery({
    queryKey: ["weekly-content-count", userId, rollingStartStr],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      // v2.0: Use rolling 7-day window instead of calendar week
      const rollingStartDate = getMediumPeriodStart();

      // Query both sources and dedupe by content_id
      const [assignmentsRes, completionsRes] = await Promise.all([
        supabase
          .from("monthly_content_assignments")
          .select("content_id")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", rollingStartDate.toISOString()),

        // v2.0: Query by completed_at instead of week_start
        supabase
          .from("exercise_completions")
          .select("exercise_id")
          .eq("user_id", userId)
          .gte("completed_at", rollingStartDate.toISOString())
          .like("exercise_id", "content-%"),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (completionsRes.error) throw completionsRes.error;

      // Collect unique content IDs
      const contentIds = new Set<string>();

      for (const row of assignmentsRes.data || []) {
        if (row.content_id) contentIds.add(row.content_id);
      }

      for (const row of completionsRes.data || []) {
        const exerciseId = String(row.exercise_id || "");
        // Expected: content-{type}-{contentId}
        const parts = exerciseId.split("-");
        const contentId = parts.slice(2).join("-");
        if (contentId) contentIds.add(contentId);
      }

      return contentIds.size;
    },
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev ?? 0,
  });
}
