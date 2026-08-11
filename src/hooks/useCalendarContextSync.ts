import { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { format, subDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import CalendarContext, {
  calendarSource,
  isNativeMobile,
  type CalendarDayAggregate,
} from "@/lib/capacitor/calendarContext";
import { supabase } from "@/integrations/supabase/client";

interface LooseResult {
  error: { message?: string; code?: string } | null;
}

type LooseMutation = PromiseLike<LooseResult>;

const looseSupabase = supabase as unknown as {
  from(table: string): {
    upsert(
      values: Record<string, unknown>[],
      options: { onConflict: string },
    ): LooseMutation;
  };
};

function validDay(day: CalendarDayAggregate): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    Number.isFinite(day.busyMinutes) && day.busyMinutes >= 0 && day.busyMinutes <= 1440 &&
    Number.isFinite(day.meetingCount) && day.meetingCount >= 0 && day.meetingCount <= 500 &&
    Number.isFinite(day.longestMeetingMinutes) && day.longestMeetingMinutes >= 0 && day.longestMeetingMinutes <= 1440 &&
    (day.firstEventMinute === null || Number.isFinite(day.firstEventMinute)) &&
    (day.lastEventMinute === null || Number.isFinite(day.lastEventMinute)) &&
    (day.longestOpenStartMinute === null || Number.isFinite(day.longestOpenStartMinute)) &&
    Number.isFinite(day.longestOpenMinutes) && day.longestOpenMinutes >= 0 && day.longestOpenMinutes <= 720;
}

/** Syncs schedule density only. Event titles, attendees and calendar names never enter JS or cloud. */
export function useCalendarContextSync(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [resumeTick, setResumeTick] = useState(0);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativeMobile()) return;
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive && !disposed) setResumeTick((value) => value + 1);
    }).then((handle) => {
      removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, []);

  useEffect(() => {
    const source = calendarSource();
    if (!userId || !source || !isNativeMobile()) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const attemptKey = `${userId}:${today}:${resumeTick}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;

    void (async () => {
      try {
        const permission = await CalendarContext.getPermissionStatus();
        if (permission.state !== "granted") {
          attemptedRef.current = null;
          return;
        }
        const result = await CalendarContext.getDailyAggregates({
          startDate: format(subDays(new Date(), 13), "yyyy-MM-dd"),
          endDate: today,
        });
        const days = result.days.filter(validDay);
        if (days.length === 0) return;

        const { error } = await looseSupabase
          .from("calendar_context_snapshots")
          .upsert(days.map((day) => ({
            user_id: userId,
            snapshot_date: day.date,
            source,
            busy_minutes: Math.round(day.busyMinutes),
            meeting_count: Math.round(day.meetingCount),
            longest_meeting_minutes: Math.round(day.longestMeetingMinutes),
            first_event_minute: day.firstEventMinute === null ? null : Math.round(day.firstEventMinute),
            last_event_minute: day.lastEventMinute === null ? null : Math.round(day.lastEventMinute),
            longest_open_start_minute: day.longestOpenStartMinute === null
              ? null
              : Math.round(day.longestOpenStartMinute),
            longest_open_minutes: Math.round(day.longestOpenMinutes),
            permission_state: "granted",
            confidence: 0.9,
          })), { onConflict: "user_id,snapshot_date,source" });

        if (error) {
          attemptedRef.current = null;
          console.warn("[CalendarContext] Aggregate sync unavailable:", error);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ["mobile-cognitive-rhythm", userId] });
        await queryClient.invalidateQueries({ queryKey: ["today-passive-context", userId] });
        await queryClient.invalidateQueries({ queryKey: ["today-metrics", userId] });
        await queryClient.invalidateQueries({ queryKey: ["adaptive-passive-sources", userId] });
      } catch (error) {
        attemptedRef.current = null;
        console.warn("[CalendarContext] Native aggregate read unavailable:", error);
      }
    })();
  }, [queryClient, resumeTick, userId]);
}
