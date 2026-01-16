/**
 * Hook to fetch weekly content completions count (podcasts, books, articles).
 * This is separate from games completions count.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, addDays, format } from "date-fns";
import { useRef } from "react";

export function useWeeklyContentCount() {
  const { user, session } = useAuth();
  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Keep a stable userId across route changes
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const computedUserId = user?.id ?? session?.user?.id;
  if (computedUserId) lastUserIdRef.current = computedUserId;
  const userId = computedUserId ?? lastUserIdRef.current;

  return useQuery({
    queryKey: ["weekly-content-count", userId, weekStartStr],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEndDate = addDays(weekStartDate, 7);

      // Query both sources and dedupe by content_id
      const [assignmentsRes, completionsRes] = await Promise.all([
        supabase
          .from("monthly_content_assignments")
          .select("content_id")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", weekStartDate.toISOString())
          .lt("completed_at", weekEndDate.toISOString()),

        supabase
          .from("exercise_completions")
          .select("exercise_id")
          .eq("user_id", userId)
          .eq("week_start", weekStartStr)
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
