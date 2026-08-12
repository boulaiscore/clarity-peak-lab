import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  deriveMobileCognitiveRhythm,
  type MobileRhythmDay,
} from "@/lib/mobileCognitiveRhythm";

interface LooseResult {
  data?: unknown;
  error: { message?: string; code?: string } | null;
}

interface LooseQuery extends PromiseLike<LooseResult> {
  select(columns: string): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  gte(column: string, value: string): LooseQuery;
  order(column: string, options: { ascending: boolean }): LooseQuery;
  limit(count: number): LooseQuery;
}

const looseSupabase = supabase as unknown as { from(table: string): LooseQuery };

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> =>
        row !== null && typeof row === "object" && !Array.isArray(row),
      )
    : [];
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function useMobileCognitiveRhythm() {
  const { user } = useAuth();
  const userId = user?.id;
  const sinceDate = format(subDays(new Date(), 89), "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["mobile-cognitive-rhythm", userId, sinceDate],
    queryFn: async () => {
      if (!userId) return [] as MobileRhythmDay[];
      const [metricResult, healthResult, deviceResult, calendarResult] = await Promise.all([
        looseSupabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, sharpness, readiness, recovery")
          .eq("user_id", userId)
          .gte("snapshot_date", sinceDate)
          .order("snapshot_date", { ascending: true })
          .limit(120),
        looseSupabase
          .from("phone_health_snapshots")
          .select("date, phi")
          .eq("user_id", userId)
          .gte("date", sinceDate)
          .order("date", { ascending: true })
          .limit(120),
        looseSupabase
          .from("device_usage_snapshots")
          .select("snapshot_date, attention_usage_min, attention_session_count, attention_switch_count, brief_session_count")
          .eq("user_id", userId)
          .gte("snapshot_date", sinceDate)
          .order("snapshot_date", { ascending: true })
          .limit(120),
        looseSupabase
          .from("calendar_context_snapshots")
          .select("snapshot_date, busy_minutes, meeting_count, longest_open_start_minute, longest_open_minutes")
          .eq("user_id", userId)
          .gte("snapshot_date", sinceDate)
          .order("snapshot_date", { ascending: true })
          .limit(120),
      ]);
      if (metricResult.error) throw metricResult.error;
      if (calendarResult.error && !/PGRST205|42P01|schema cache/i.test(calendarResult.error.message ?? "")) {
        throw calendarResult.error;
      }

      const byDate = new Map<string, MobileRhythmDay>();
      const ensure = (date: string) => {
        const existing = byDate.get(date);
        if (existing) return existing;
        const day: MobileRhythmDay = {
          date,
          sharpness: null,
          readiness: null,
          recovery: null,
          healthScore: null,
          attentionUsageMinutes: null,
          attentionSessionCount: null,
          attentionSwitchCount: null,
          briefSessionCount: null,
          busyMinutes: null,
          meetingCount: null,
          longestOpenStartMinute: null,
          longestOpenMinutes: null,
        };
        byDate.set(date, day);
        return day;
      };

      records(metricResult.data).forEach((row) => {
        const date = stringValue(row.snapshot_date);
        if (!date) return;
        Object.assign(ensure(date), {
          sharpness: numberValue(row.sharpness),
          readiness: numberValue(row.readiness),
          recovery: numberValue(row.recovery),
        });
      });
      records(healthResult.data).forEach((row) => {
        const date = stringValue(row.date);
        if (date) ensure(date).healthScore = numberValue(row.phi);
      });
      records(deviceResult.data).forEach((row) => {
        const date = stringValue(row.snapshot_date);
        if (!date) return;
        Object.assign(ensure(date), {
          attentionUsageMinutes: numberValue(row.attention_usage_min),
          attentionSessionCount: numberValue(row.attention_session_count),
          attentionSwitchCount: numberValue(row.attention_switch_count),
          briefSessionCount: numberValue(row.brief_session_count),
        });
      });
      records(calendarResult.data).forEach((row) => {
        const date = stringValue(row.snapshot_date);
        if (!date) return;
        Object.assign(ensure(date), {
          busyMinutes: numberValue(row.busy_minutes),
          meetingCount: numberValue(row.meeting_count),
          longestOpenStartMinute: numberValue(row.longest_open_start_minute),
          longestOpenMinutes: numberValue(row.longest_open_minutes),
        });
      });
      return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });

  const rhythm = useMemo(
    () => deriveMobileCognitiveRhythm(query.data ?? []),
    [query.data],
  );

  return { rhythm, isLoading: query.isLoading, error: query.error };
}

export function isCalendarContextStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : JSON.stringify(error ?? "");
  return /calendar_context_snapshots|PGRST205|42P01|schema cache/i.test(message);
}
