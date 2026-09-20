// Builds a compact, privacy-safe 30-day snapshot of the user's LOOMA data.
// Only aggregate metrics and health numbers are included — never raw content,
// calendar titles, book titles or app names.

interface SupabaseLike {
  from(table: string): {
    select(columns: string): any;
  };
}

function round(value: unknown, digits = 0): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const factor = 10 ** digits;
  return Math.round(parsed * factor) / factor;
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function buildCoachContext(client: SupabaseLike, userId: string) {
  const since = isoDaysAgo(30);
  const sinceTs = `${since}T00:00:00.000Z`;

  const [snapshots, phone, wearable, metrics, profile, games, reading, detox, device] =
    await Promise.all([
      client.from("daily_metric_snapshots")
        .select("snapshot_date, sharpness, readiness, recovery, reasoning_quality, signal_coverage, did_training")
        .eq("user_id", userId).gte("snapshot_date", since).order("snapshot_date", { ascending: true }),
      client.from("phone_health_snapshots")
        .select("date, sleep_min, bedtime_dev_min, steps, active_min, pickups")
        .eq("user_id", userId).gte("date", since).order("date", { ascending: true }),
      client.from("wearable_daily_canonical")
        .select("date, hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, activity_score, source")
        .eq("user_id", userId).gte("date", since).order("date", { ascending: true }),
      client.from("user_cognitive_metrics")
        .select("cognitive_performance_score, cognitive_readiness_score, reasoning_quality, rec_value, training_capacity, experience_points, total_sessions")
        .eq("user_id", userId).maybeSingle(),
      client.from("profiles")
        .select("name, age, work_type, primary_outcome, training_goals, daily_time_commitment, timezone")
        .eq("user_id", userId).maybeSingle(),
      client.from("game_sessions")
        .select("completed_at, system_type, skill_routed, game_name, score, duration_seconds")
        .eq("user_id", userId).gte("completed_at", sinceTs).order("completed_at", { ascending: false }).limit(60),
      client.from("reason_sessions")
        .select("started_at, session_type, duration_seconds, is_valid_for_rq")
        .eq("user_id", userId).gte("started_at", sinceTs).order("started_at", { ascending: false }).limit(60),
      client.from("detox_completions")
        .select("completed_at, duration_minutes")
        .eq("user_id", userId).gte("completed_at", sinceTs).order("completed_at", { ascending: false }).limit(60),
      client.from("device_usage_snapshots")
        .select("snapshot_date, attention_usage_min, attention_switch_count, brief_session_count")
        .eq("user_id", userId).gte("snapshot_date", since).order("snapshot_date", { ascending: true }),
    ]);

  const dailyRows = (snapshots.data ?? []) as Record<string, unknown>[];
  const phoneRows = (phone.data ?? []) as Record<string, unknown>[];
  const wearableRows = (wearable.data ?? []) as Record<string, unknown>[];
  const deviceRows = (device.data ?? []) as Record<string, unknown>[];

  const byDate = new Map<string, Record<string, unknown>>();
  const touch = (date: unknown) => {
    const key = typeof date === "string" ? date.slice(0, 10) : null;
    if (!key) return null;
    if (!byDate.has(key)) byDate.set(key, { date: key });
    return byDate.get(key)!;
  };

  for (const row of dailyRows) {
    const entry = touch(row.snapshot_date);
    if (!entry) continue;
    entry.sharpness = round(row.sharpness);
    entry.readiness = round(row.readiness);
    entry.recovery = round(row.recovery);
    entry.reasoningQuality = round(row.reasoning_quality);
    entry.trained = Boolean(row.did_training);
  }
  for (const row of phoneRows) {
    const entry = touch(row.date);
    if (!entry) continue;
    entry.sleepMin = round(row.sleep_min);
    entry.bedtimeDeviationMin = round(row.bedtime_dev_min);
    entry.steps = round(row.steps);
    entry.activeMin = round(row.active_min);
    entry.phonePickups = round(row.pickups);
  }
  for (const row of wearableRows) {
    const entry = touch(row.date);
    if (!entry) continue;
    entry.hrvMs = round(row.hrv_ms);
    entry.restingHr = round(row.resting_hr);
    entry.sleepMin = entry.sleepMin ?? round(row.sleep_duration_min);
    entry.sleepEfficiency = round(row.sleep_efficiency);
    entry.wearableSource = row.source ?? null;
  }
  for (const row of deviceRows) {
    const entry = touch(row.snapshot_date);
    if (!entry) continue;
    entry.screenMin = round(row.attention_usage_min);
    entry.appSwitches = round(row.attention_switch_count);
  }

  const days = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const gameRows = (games.data ?? []) as Record<string, unknown>[];
  const readingRows = (reading.data ?? []) as Record<string, unknown>[];
  const detoxRows = (detox.data ?? []) as Record<string, unknown>[];

  const sumMinutes = (rows: Record<string, unknown>[], key: string, divisor: number) =>
    round(rows.reduce((total, row) => total + (Number(row[key]) || 0), 0) / divisor);

  return {
    generatedAt: new Date().toISOString(),
    profile: profile.data ?? null,
    currentMetrics: metrics.data ?? null,
    last30Days: days,
    activity30d: {
      drillSessions: gameRows.length,
      drillsBySystem: {
        system1: gameRows.filter((row) => String(row.system_type).toUpperCase().includes("1")).length,
        system2: gameRows.filter((row) => String(row.system_type).toUpperCase().includes("2")).length,
      },
      recentDrills: gameRows.slice(0, 10).map((row) => ({
        date: String(row.completed_at ?? "").slice(0, 10),
        drill: row.game_name ?? null,
        skill: row.skill_routed ?? null,
        score: round(row.score),
      })),
      qualityTimeSessions: readingRows.length,
      qualityTimeMinutes: sumMinutes(readingRows, "duration_seconds", 60),
      recoverySessions: detoxRows.length,
      recoveryMinutes: sumMinutes(detoxRows, "duration_minutes", 1),
    },
  };
}
