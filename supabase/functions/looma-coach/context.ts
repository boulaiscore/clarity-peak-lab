// Builds a compact, privacy-safe 30-day snapshot of the user's LOOMA data.
// Only aggregate metrics and health numbers are included — never raw content,
// calendar titles, book titles or app names.

interface SupabaseLike {
  from(table: string): {
    select(columns: string): any;
  };
}

/** Mirrors src/config/objectives.ts; edge functions cannot import app source. */
const OBJECTIVE_PRESETS: Record<string, { label: string; focus: string; demand: string }> = {
  interview: { label: "Job interview", focus: "Sharpness", demand: "thinking fast under pressure" },
  case_interview: { label: "Case or technical round", focus: "Reasoning", demand: "structured reasoning out loud" },
  exam: { label: "Exam or test", focus: "Sharpness", demand: "hours of sustained attention" },
  presentation: { label: "Presentation or pitch", focus: "Readiness", demand: "being clear and composed on stage" },
  negotiation: { label: "Negotiation or big decision", focus: "Reasoning", demand: "clear judgement under pressure" },
  deadline: { label: "Deadline or heavy week", focus: "Readiness", demand: "holding output for several days" },
  competition: { label: "Competition or event", focus: "Recovery", demand: "arriving physically fresh" },
  other: { label: "Personal objective", focus: "Readiness", demand: "performing at your best" },
};

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
        .select("name, age, work_type, primary_outcome, training_goals, daily_time_commitment, timezone, objective_label, objective_date")
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

  // ---- Derived analysis: pre-computed so the coach interprets instead of listing ----
  const num = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const avg = (values: (number | null)[]): number | null => {
    const clean = values.filter((value): value is number => value !== null);
    if (clean.length === 0) return null;
    return round(clean.reduce((total, value) => total + value, 0) / clean.length, 1);
  };
  const series = (key: string) => days.map((day) => num(day[key]));
  const lastN = (key: string, count: number) => series(key).slice(-count);

  const metricKeys = ["sharpness", "readiness", "recovery", "reasoningQuality", "sleepMin", "hrvMs", "restingHr", "screenMin", "phonePickups", "steps"];
  const summary: Record<string, unknown> = {};
  for (const key of metricKeys) {
    const all = series(key);
    const recent = avg(lastN(key, 7));
    const baseline = avg(all.slice(0, Math.max(all.length - 7, 0)));
    const clean = all.filter((value): value is number => value !== null);
    summary[key] = {
      avg30d: avg(all),
      avg7d: recent,
      baselineBefore7d: baseline,
      change7dVsBaseline: recent !== null && baseline !== null ? round(recent - baseline, 1) : null,
      min: clean.length ? round(Math.min(...clean), 1) : null,
      max: clean.length ? round(Math.max(...clean), 1) : null,
      daysWithData: clean.length,
    };
  }

  // Split-mean association: outcome on days following high vs low values of a driver.
  const association = (driverKey: string, outcomeKey: string) => {
    const pairs: { driver: number; outcome: number }[] = [];
    for (let index = 0; index < days.length; index += 1) {
      const driver = num(days[index][driverKey]);
      const outcome = num(days[index][outcomeKey]);
      if (driver === null || outcome === null) continue;
      pairs.push({ driver, outcome });
    }
    if (pairs.length < 8) return { samples: pairs.length, enoughData: false };
    const sorted = [...pairs].sort((a, b) => a.driver - b.driver);
    const half = Math.floor(sorted.length / 2);
    const low = sorted.slice(0, half);
    const high = sorted.slice(sorted.length - half);
    const lowAvg = avg(low.map((pair) => pair.outcome));
    const highAvg = avg(high.map((pair) => pair.outcome));
    return {
      samples: pairs.length,
      enoughData: true,
      lowDriverAvgOutcome: lowAvg,
      highDriverAvgOutcome: highAvg,
      difference: lowAvg !== null && highAvg !== null ? round(highAvg - lowAvg, 1) : null,
      lowDriverAvg: avg(low.map((pair) => pair.driver)),
      highDriverAvg: avg(high.map((pair) => pair.driver)),
    };
  };

  const coverage = (key: string) =>
    days.length ? round((series(key).filter((value) => value !== null).length / days.length) * 100) : 0;

  const profileRow = (profile.data ?? null) as Record<string, unknown> | null;
  const objectiveKind = typeof profileRow?.objective_kind === "string" ? profileRow.objective_kind : "";
  const preset = OBJECTIVE_PRESETS[objectiveKind] ?? null;
  const customLabel = typeof profileRow?.objective_label === "string" ? profileRow.objective_label.trim() : "";
  const objectiveLabel = customLabel || preset?.label || "";
  const objectiveDate = typeof profileRow?.objective_date === "string" ? profileRow.objective_date : null;
  const objectiveDaysUntil = objectiveDate
    ? Math.round((Date.parse(`${objectiveDate}T00:00:00Z`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) / 86_400_000)
    : null;

  return {
    generatedAt: new Date().toISOString(),
    profile: profileRow,
    objective: objectiveLabel
      ? {
          label: objectiveLabel,
          kind: objectiveKind || null,
          focusMetric: preset?.focus ?? null,
          demand: preset?.demand ?? null,
          date: objectiveDate,
          daysUntil: objectiveDaysUntil,
        }
      : null,
    currentMetrics: metrics.data ?? null,
    last30Days: days,
    derived: {
      daysTracked: days.length,
      coveragePct: {
        sleep: coverage("sleepMin"),
        hrv: coverage("hrvMs"),
        screen: coverage("screenMin"),
        scores: coverage("sharpness"),
      },
      summary,
      associations: {
        sleepVsSharpness: association("sleepMin", "sharpness"),
        sleepVsRecovery: association("sleepMin", "recovery"),
        hrvVsReadiness: association("hrvMs", "readiness"),
        screenVsSharpness: association("screenMin", "sharpness"),
        pickupsVsSharpness: association("phonePickups", "sharpness"),
        stepsVsRecovery: association("steps", "recovery"),
      },
    },
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
