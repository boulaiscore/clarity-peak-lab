import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  acknowledgeDesktopSensorBlocks,
  getDesktopSensorStatus,
  pairDesktopSensor,
  pullDesktopSensorBlocks,
  type DesktopSensorBlockAggregate,
  type DesktopSensorStatus,
} from "@/lib/desktopSensorBridge";
import {
  calculateDesktopBlockIntegrity,
  deriveFocusPatterns,
  type FocusPatternBlock,
  type FocusPatternDailyContext,
} from "@/lib/workFocusPatterns";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const DESKTOP_BLOCKS_QUERY_KEY = "desktop-work-blocks";
const DESKTOP_STATUS_QUERY_KEY = "desktop-sensor-status";

interface LooseResult {
  data?: unknown;
  error: { code?: string; message?: string } | null;
}

interface LooseQuery extends PromiseLike<LooseResult> {
  select(columns: string): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  gte(column: string, value: string): LooseQuery;
  order(column: string, options: { ascending: boolean }): LooseQuery;
  limit(count: number): LooseQuery;
  upsert(
    values: Record<string, unknown>[],
    options: { onConflict: string },
  ): LooseQuery;
}

const looseSupabase = supabase as unknown as {
  from(table: string): LooseQuery;
};

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> =>
        row !== null && typeof row === "object" && !Array.isArray(row),
      )
    : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseDesktopBlock(value: unknown): DesktopSensorBlockAggregate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const clientBlockId = stringValue(row.clientBlockId);
  const source = stringValue(row.source);
  const sensorVersion = stringValue(row.sensorVersion);
  const startedAt = stringValue(row.startedAt);
  const endedAt = stringValue(row.endedAt);
  const localDate = stringValue(row.localDate);
  const terminationReason = stringValue(row.terminationReason);
  const endedAbruptly = booleanValue(row.endedAbruptly);
  const localStartHour = numberValue(row.localStartHour);
  const localWeekday = numberValue(row.localWeekday);
  const timezoneOffsetMinutes = numberValue(row.timezoneOffsetMinutes);
  const durationMinutes = numberValue(row.durationMinutes);
  const activeMinutes = numberValue(row.activeMinutes);
  const focusedMinutes = numberValue(row.focusedMinutes);
  const attentionMinutes = numberValue(row.attentionMinutes);
  const idleMinutes = numberValue(row.idleMinutes);
  const interruptionCount = numberValue(row.interruptionCount);
  const contextSwitchCount = numberValue(row.contextSwitchCount);
  const longestContinuousMinutes = numberValue(row.longestContinuousMinutes);
  const confidence = numberValue(row.confidence);
  const allowedTermination = terminationReason === "idle" ||
    terminationReason === "locked" ||
    terminationReason === "attention_gap" ||
    terminationReason === "unsupported_gap" ||
    terminationReason === "manual_flush";

  if (
    !clientBlockId || !isUuid(clientBlockId) ||
    source !== "chrome_extension" ||
    !sensorVersion || sensorVersion.length > 80 ||
    !startedAt || !Number.isFinite(new Date(startedAt).getTime()) ||
    !endedAt || !Number.isFinite(new Date(endedAt).getTime()) ||
    new Date(endedAt).getTime() < new Date(startedAt).getTime() ||
    !localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate) ||
    !allowedTermination || endedAbruptly === null ||
    localStartHour === null || localStartHour < 0 || localStartHour > 23 ||
    localWeekday === null || localWeekday < 0 || localWeekday > 6 ||
    timezoneOffsetMinutes === null || Math.abs(timezoneOffsetMinutes) > 840 ||
    durationMinutes === null || durationMinutes < 0 || durationMinutes > 1440 ||
    activeMinutes === null || activeMinutes < 0 || activeMinutes > 1440 ||
    focusedMinutes === null || focusedMinutes < 10 || focusedMinutes > 1440 ||
    attentionMinutes === null || attentionMinutes < 0 || attentionMinutes > 1440 ||
    idleMinutes === null || idleMinutes < 0 || idleMinutes > 1440 ||
    interruptionCount === null || interruptionCount < 0 || interruptionCount > 10000 ||
    contextSwitchCount === null || contextSwitchCount < 0 || contextSwitchCount > 10000 ||
    longestContinuousMinutes === null || longestContinuousMinutes < 0 || longestContinuousMinutes > 1440 ||
    confidence === null || confidence < 0 || confidence > 1
  ) {
    return null;
  }

  return {
    clientBlockId,
    source,
    sensorVersion,
    startedAt,
    endedAt,
    localDate,
    localStartHour,
    localWeekday,
    timezoneOffsetMinutes,
    durationMinutes,
    activeMinutes,
    focusedMinutes,
    attentionMinutes,
    idleMinutes,
    interruptionCount,
    contextSwitchCount,
    longestContinuousMinutes,
    endedAbruptly,
    terminationReason,
    confidence,
  };
}

/** Pulls completed aggregates from the extension; raw browser data never enters the app. */
export function useDesktopWorkSync(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [syncTick, setSyncTick] = useState(0);
  const activeSyncRef = useRef<string | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") setSyncTick((value) => value + 1);
    };
    const onOnline = () => setSyncTick((value) => value + 1);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const attemptKey = `${userId}:${syncTick}`;
    if (activeSyncRef.current === attemptKey) return;
    activeSyncRef.current = attemptKey;

    void (async () => {
      const pairedStatus = await pairDesktopSensor(userId);
      queryClient.setQueryData<DesktopSensorStatus>([DESKTOP_STATUS_QUERY_KEY], pairedStatus);
      if (!pairedStatus.installed) return;

      const pulled = await pullDesktopSensorBlocks(userId);
      queryClient.setQueryData<DesktopSensorStatus>([DESKTOP_STATUS_QUERY_KEY], pulled.status);
      if (!pulled.status.installed || pulled.blocks.length === 0) return;

      const blocks = pulled.blocks.flatMap((value) => {
        const parsed = parseDesktopBlock(value);
        return parsed ? [parsed] : [];
      });
      if (blocks.length === 0) return;

      const payload = blocks.map((block) => {
        const integrity = calculateDesktopBlockIntegrity(block);
        return {
          user_id: userId,
          client_block_id: block.clientBlockId,
          source: block.source,
          sensor_version: block.sensorVersion,
          started_at: block.startedAt,
          ended_at: block.endedAt,
          local_date: block.localDate,
          local_start_hour: block.localStartHour,
          local_weekday: block.localWeekday,
          timezone_offset_minutes: block.timezoneOffsetMinutes,
          duration_minutes: block.durationMinutes,
          active_minutes: block.activeMinutes,
          focused_minutes: block.focusedMinutes,
          attention_minutes: block.attentionMinutes,
          idle_minutes: block.idleMinutes,
          interruption_count: block.interruptionCount,
          context_switch_count: block.contextSwitchCount,
          longest_continuous_minutes: block.longestContinuousMinutes,
          ended_abruptly: block.endedAbruptly,
          termination_reason: block.terminationReason,
          integrity_score: integrity.score,
          confidence: integrity.confidence,
          components: integrity.components as unknown as Json,
        };
      });
      const { error } = await looseSupabase
        .from("desktop_work_blocks")
        .upsert(payload, { onConflict: "user_id,client_block_id" });

      if (error) {
        console.warn("[DesktopFocus] Aggregate sync unavailable:", error);
        return;
      }

      await acknowledgeDesktopSensorBlocks(userId, blocks.map((block) => block.clientBlockId));
      await queryClient.invalidateQueries({ queryKey: [DESKTOP_BLOCKS_QUERY_KEY, userId] });
      await queryClient.invalidateQueries({ queryKey: ["adaptive-passive-sources", userId] });
    })().finally(() => {
      activeSyncRef.current = null;
    });
  }, [queryClient, syncTick, userId]);
}

export function useDesktopSensorStatus() {
  return useQuery({
    queryKey: [DESKTOP_STATUS_QUERY_KEY],
    queryFn: getDesktopSensorStatus,
    staleTime: 60_000,
    retry: false,
  });
}

export function useFocusPatterns() {
  const { user } = useAuth();
  const userId = user?.id;
  const since = subDays(new Date(), 90).toISOString();
  const sinceDate = since.slice(0, 10);
  const sensorStatus = useDesktopSensorStatus();

  const query = useQuery({
    queryKey: [DESKTOP_BLOCKS_QUERY_KEY, userId, sinceDate],
    queryFn: async () => {
      if (!userId) return { blocks: [], contexts: [] };
      const [blockResult, metricResult, phoneResult] = await Promise.all([
        looseSupabase
          .from("desktop_work_blocks")
          .select("local_date, local_start_hour, focused_minutes, attention_minutes, interruption_count, context_switch_count, ended_abruptly, integrity_score, confidence")
          .eq("user_id", userId)
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(500),
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
      ]);
      if (blockResult.error) throw blockResult.error;

      const healthByDate = new Map(
        records(phoneResult.data).flatMap((row) => {
          const date = stringValue(row.date);
          const phi = numberValue(row.phi);
          return date ? [[date, phi] as const] : [];
        }),
      );
      const contexts: FocusPatternDailyContext[] = records(metricResult.data).flatMap((row) => {
        const date = stringValue(row.snapshot_date);
        return date ? [{
          date,
          sharpness: numberValue(row.sharpness),
          readiness: numberValue(row.readiness),
          recovery: numberValue(row.recovery),
          healthScore: healthByDate.get(date) ?? null,
        }] : [];
      });
      const blocks: FocusPatternBlock[] = records(blockResult.data).flatMap((row) => {
        const localDate = stringValue(row.local_date);
        const localStartHour = numberValue(row.local_start_hour);
        const focusedMinutes = numberValue(row.focused_minutes);
        const attentionMinutes = numberValue(row.attention_minutes);
        const interruptionCount = numberValue(row.interruption_count);
        const contextSwitchCount = numberValue(row.context_switch_count);
        const endedAbruptly = booleanValue(row.ended_abruptly);
        const integrityScore = numberValue(row.integrity_score);
        const confidence = numberValue(row.confidence);
        return localDate &&
          localStartHour !== null &&
          focusedMinutes !== null &&
          attentionMinutes !== null &&
          interruptionCount !== null &&
          contextSwitchCount !== null &&
          endedAbruptly !== null &&
          integrityScore !== null &&
          confidence !== null
          ? [{
              localDate,
              localStartHour,
              focusedMinutes,
              attentionMinutes,
              interruptionCount,
              contextSwitchCount,
              endedAbruptly,
              integrityScore,
              confidence,
            }]
          : [];
      });
      return { blocks, contexts };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const patterns = useMemo(
    () => deriveFocusPatterns(query.data?.blocks ?? [], query.data?.contexts ?? []),
    [query.data],
  );

  return {
    patterns,
    sensor: sensorStatus.data ?? { installed: false, sensorVersion: null, tracking: false },
    isLoading: query.isLoading || sensorStatus.isLoading,
    error: query.error,
  };
}

export function isDesktopFocusStorageError(error: unknown): boolean {
  const serialized = error instanceof Error
    ? error.message
    : typeof error === "string" ? error : JSON.stringify(error ?? "");
  return /desktop_work_blocks|PGRST205|42P01|schema cache/i.test(serialized);
}
