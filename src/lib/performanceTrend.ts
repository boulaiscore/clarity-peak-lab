import { format, parseISO, subDays } from "date-fns";

export type PerformanceWindow = 30 | 90;

export interface PerformanceSession {
  completedAt: string;
  score: number;
  qualityScore: number | null;
  difficulty: string | null;
}

export interface PerformanceHealthDay {
  date: string;
  sleepMin: number | null;
}

export interface PerformanceTrendPoint {
  date: string;
  label: string;
  value: number | null;
  sessions: number;
  lowSleep: boolean;
  streak: boolean;
}

export interface PerformanceTrendSummary {
  points: PerformanceTrendPoint[];
  sessionCount: number;
  activeDays: number;
  changePercent: number | null;
  significant: boolean;
  status: "insufficient" | "stable" | "improving" | "declining";
}

const DIFFICULTY_ADJUSTMENT: Record<string, number> = {
  easy: -4,
  medium: 0,
  standard: 0,
  hard: 4,
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function normalizePerformanceSession(session: PerformanceSession): number {
  const source = session.qualityScore ?? session.score;
  const adjustment = DIFFICULTY_ADJUSTMENT[session.difficulty?.toLowerCase() ?? "medium"] ?? 0;
  return clamp(Number(source) + adjustment);
}

export function buildPerformanceTrend(
  sessions: PerformanceSession[],
  healthDays: PerformanceHealthDay[],
  windowDays: PerformanceWindow,
  today = new Date(),
): PerformanceTrendSummary {
  const startDate = format(subDays(today, windowDays - 1), "yyyy-MM-dd");
  const sessionsByDate = new Map<string, number[]>();

  sessions.forEach((session) => {
    if (!session.completedAt) return;
    const date = format(parseISO(session.completedAt), "yyyy-MM-dd");
    if (date < startDate) return;
    const values = sessionsByDate.get(date) ?? [];
    values.push(normalizePerformanceSession(session));
    sessionsByDate.set(date, values);
  });

  const sleepValues = healthDays
    .map((day) => day.sleepMin)
    .filter((value): value is number => value !== null && value > 0);
  const sleepMedian = median(sleepValues);
  const sleepByDate = new Map(healthDays.map((day) => [day.date, day.sleepMin]));

  const activeDates = new Set(sessionsByDate.keys());
  const points: PerformanceTrendPoint[] = [];
  let consecutiveActiveDays = 0;

  for (let offset = windowDays - 1; offset >= 0; offset--) {
    const dateValue = subDays(today, offset);
    const date = format(dateValue, "yyyy-MM-dd");
    const daySessions = sessionsByDate.get(date) ?? [];
    consecutiveActiveDays = activeDates.has(date) ? consecutiveActiveDays + 1 : 0;
    const sleep = sleepByDate.get(date);

    points.push({
      date,
      label: format(dateValue, windowDays === 30 ? "d MMM" : "MMM d"),
      value: average(daySessions),
      sessions: daySessions.length,
      lowSleep: sleepMedian !== null && sleep != null && sleep <= sleepMedian - 60,
      streak: consecutiveActiveDays >= 3,
    });
  }

  const observed = points.filter((point) => point.value !== null);
  const sessionCount = observed.reduce((sum, point) => sum + point.sessions, 0);
  const enoughData = sessionCount >= 6 && observed.length >= 4;
  const comparisonSize = Math.min(3, Math.floor(observed.length / 2));
  const early = comparisonSize > 0
    ? average(observed.slice(0, comparisonSize).map((point) => Number(point.value)))
    : null;
  const recent = comparisonSize > 0
    ? average(observed.slice(-comparisonSize).map((point) => Number(point.value)))
    : null;
  const changePercent = enoughData && early !== null && recent !== null && early > 0
    ? ((recent - early) / early) * 100
    : null;
  const significant = changePercent !== null && Math.abs(changePercent) >= 3;

  return {
    points,
    sessionCount,
    activeDays: observed.length,
    changePercent,
    significant,
    status: !enoughData
      ? "insufficient"
      : !significant
        ? "stable"
        : changePercent > 0
          ? "improving"
          : "declining",
  };
}