// src/components/report/ClinicalReport.tsx
// Cognitive performance intelligence report for A4/PDF output.
import React, { useMemo } from "react";
import { Brain } from "lucide-react";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";
import { calculateSharpness } from "@/lib/cognitiveEngine";
import { calculateCognitiveAgeFromPerformance } from "@/lib/cognitiveAge";

type Area = "focus" | "reasoning" | "creativity";
type ConfidenceLevel = "Low" | "Developing" | "Moderate" | "High";
type ScoreTone = "excellent" | "strong" | "stable" | "watch" | "risk";
type MetricKey = "sharpness" | "readiness" | "recovery" | "reasoningQuality" | "coherence";

export type ReportMetricSnapshot = {
  snapshot_date: string;
  sharpness: number | null;
  readiness: number | null;
  recovery: number | null;
  reasoning_quality: number | null;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  in_score: number | null;
  s1: number | null;
  s2: number | null;
  did_training: boolean | null;
};

interface ClinicalReportProps {
  profile: {
    name?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    work_type?: string | null;
    education_level?: string | null;
    degree_discipline?: string | null;
    training_goals?: string[] | null;
    daily_time_commitment?: string | null;
    session_duration?: string | null;
  };
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_readiness_score?: number | null;
    reasoning_quality?: number | null;
    fast_thinking?: number | null;
    slow_thinking?: number | null;
    focus_stability?: number | null;
    reasoning_accuracy?: number | null;
    creativity?: number | null;
    clarity_score?: number | null;
    decision_quality?: number | null;
    bias_resistance?: number | null;
    philosophical_reasoning?: number | null;
    cognitive_level?: number | null;
    experience_points?: number | null;
    total_sessions?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
    baseline_cognitive_age?: number | null;
    spatial_reasoning?: number | null;
    visual_processing?: number | null;
    reaction_speed?: number | null;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
    accuracyRatePct: number;
    preferredDuration?: string;
    mostUsedExercises: { exerciseId: string; count: number }[];
    last30DaysHeatmap?: { date: string; count: number }[];
    sessionsLast7d?: number;
  };
  badges: Array<{
    badge_name: string;
    badge_category: string;
    earned_at?: string;
  }>;
  generatedAt: Date;
  isPreview?: boolean;
  liveSci?: SCIBreakdown | null;
  metricSnapshots?: ReportMetricSnapshot[];
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function avg(values: Array<number | null | undefined>, fallback = 50): number {
  const valid = values.filter((value): value is number => value !== null && value !== undefined);
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getPercentile(score: number): number {
  if (score >= 90) return 98;
  if (score >= 85) return 95;
  if (score >= 80) return 90;
  if (score >= 75) return 85;
  if (score >= 70) return 80;
  if (score >= 65) return 70;
  if (score >= 60) return 60;
  if (score >= 55) return 55;
  if (score >= 50) return 50;
  if (score >= 45) return 40;
  if (score >= 40) return 30;
  if (score >= 35) return 20;
  return 15;
}

function classifyScore(score: number): { label: string; tone: ScoreTone } {
  if (score >= 85) return { label: "Elite", tone: "excellent" };
  if (score >= 72) return { label: "Strong", tone: "strong" };
  if (score >= 58) return { label: "Stable", tone: "stable" };
  if (score >= 45) return { label: "Watch", tone: "watch" };
  return { label: "Priority", tone: "risk" };
}

function formatWorkType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    knowledge: "Knowledge work",
    creative: "Creative professional",
    technical: "Technical / engineering",
    management: "Executive / management",
    student: "Student / academic",
    other: "Other",
  };
  return map[type || ""] || type || "Not specified";
}

function formatEducation(level: string | null | undefined, discipline: string | null | undefined): string {
  const levelMap: Record<string, string> = {
    high_school: "High school",
    bachelor: "Bachelor degree",
    master: "Master degree",
    phd: "Doctoral degree",
    other: "Other",
  };
  const disciplineMap: Record<string, string> = {
    stem: "STEM",
    humanities: "Humanities",
    business: "Business",
    health: "Health sciences",
    arts: "Arts",
    social_sciences: "Social sciences",
    law: "Law",
    other: "Other",
  };
  const formattedLevel = levelMap[level || ""] || level || "Not specified";
  const formattedDiscipline = disciplineMap[discipline || ""] || discipline;
  return formattedDiscipline ? `${formattedLevel}, ${formattedDiscipline}` : formattedLevel;
}

function formatGameType(gameType: string): string {
  const map: Record<string, string> = {
    "S1-AE": "Attention efficiency",
    "S1-RA": "Rapid association",
    "S2-CT": "Critical reasoning",
    "S2-IN": "Insight formation",
  };
  return map[gameType] || gameType.replace(/[-_]/g, " ");
}

function getDataConfidence(snapshotCount: number, sessionsLast7d: number, totalSessions: number): {
  level: ConfidenceLevel;
  score: number;
  description: string;
} {
  const historyScore = Math.min(1, snapshotCount / 30);
  const recencyScore = Math.min(1, sessionsLast7d / 5);
  const volumeScore = Math.min(1, totalSessions / 30);
  const score = round((historyScore * 0.45 + recencyScore * 0.3 + volumeScore * 0.25) * 100);

  if (score >= 80) {
    return {
      level: "High",
      score,
      description: "Longitudinal signal is sufficient for trend interpretation.",
    };
  }
  if (score >= 55) {
    return {
      level: "Moderate",
      score,
      description: "Directional interpretation is useful, with moderate sensitivity to recent behavior.",
    };
  }
  if (score >= 30) {
    return {
      level: "Developing",
      score,
      description: "Patterns are emerging; more daily snapshots will stabilize the report.",
    };
  }
  return {
    level: "Low",
    score,
    description: "Use as an orientation snapshot until more history is available.",
  };
}

function getBalanceStatus(s1Score: number, s2Score: number): {
  label: string;
  interpretation: string;
  recommendation: string;
} {
  const diff = s1Score - s2Score;
  if (Math.abs(diff) <= 5) {
    return {
      label: "Integrated",
      interpretation: "Fast intuition and deliberate reasoning are currently well balanced.",
      recommendation: "Use mixed training: speed work to keep access high, reasoning work to preserve structure.",
    };
  }
  if (diff > 12) {
    return {
      label: "System 1 dominant",
      interpretation: "The profile favors rapid pattern recognition over slower verification.",
      recommendation: "Before interviews, exams, investor decisions, or strategic calls, add an explicit evidence check.",
    };
  }
  if (diff > 5) {
    return {
      label: "System 1 leaning",
      interpretation: "The profile is quick and intuitive, with mild overconfidence risk under ambiguity.",
      recommendation: "Use a short assumption log to convert speed into reliable judgment.",
    };
  }
  if (diff < -12) {
    return {
      label: "System 2 dominant",
      interpretation: "The profile favors deliberate processing over rapid commitment.",
      recommendation: "Use timed synthesis drills to avoid analysis drag when speed matters.",
    };
  }
  return {
    label: "System 2 leaning",
    interpretation: "The profile is careful and reflective, with mild decision-velocity drag.",
    recommendation: "Use time-boxed first answers, then verify them with slower reasoning.",
  };
}

function getReadinessText(readiness: number): string {
  if (readiness >= 75) return "Ready for high-stakes cognitive load";
  if (readiness >= 60) return "Good for demanding work with normal pacing";
  if (readiness >= 45) return "Use for routine work; watch recovery";
  return "Reduce load before strategic decisions";
}

function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getSnapshotValue(snapshot: ReportMetricSnapshot, key: MetricKey): number | null {
  if (key === "reasoningQuality") return snapshot.reasoning_quality;
  if (key === "coherence") {
    const s1 = snapshot.s1 ?? avg([snapshot.ae, snapshot.ra], NaN);
    const s2 = snapshot.s2 ?? avg([snapshot.ct, snapshot.in_score], NaN);
    const balance = Number.isFinite(s1) && Number.isFinite(s2)
      ? 100 - Math.min(45, Math.abs(s1 - s2) * 2.2)
      : null;
    return round(avg([snapshot.reasoning_quality, balance], 50));
  }
  return snapshot[key];
}

function getSystemScore(snapshot: ReportMetricSnapshot, system: "s1" | "s2"): number | null {
  if (system === "s1") return snapshot.s1 ?? (snapshot.ae !== null || snapshot.ra !== null ? round(avg([snapshot.ae, snapshot.ra])) : null);
  return snapshot.s2 ?? (snapshot.ct !== null || snapshot.in_score !== null ? round(avg([snapshot.ct, snapshot.in_score])) : null);
}

function getTrendStats(values: Array<number | null>, fallback: number) {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (!valid.length) {
    return {
      current: fallback,
      average: fallback,
      delta: 0,
      min: fallback,
      max: fallback,
      volatility: 0,
    };
  }
  const current = valid[valid.length - 1];
  const first = valid[0];
  const average = avg(valid);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return {
    current: round(current),
    average: round(average),
    delta: round(current - first),
    min: round(min),
    max: round(max),
    volatility: round(max - min),
  };
}

function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.5) return "flat";
  return `${delta > 0 ? "+" : ""}${round(delta)}`;
}

function getDeltaTone(delta: number): "positive" | "negative" | "flat" {
  if (delta > 1) return "positive";
  if (delta < -1) return "negative";
  return "flat";
}

function interpretMetric(metric: string, current: number, delta: number, volatility: number): string {
  if (metric === "Recovery" && current < 50) return "Primary constraint: recovery is limiting conversion of effort into output.";
  if (metric === "Reasoning Quality" && current < 55) return "Needs structure: use deliberate frameworks before high-stakes judgment.";
  if (metric === "Sharpness" && current >= 72 && delta >= 0) return "Accessible capacity is strong and trending in the right direction.";
  if (metric === "Readiness" && current >= 72) return "Suitable for cognitively expensive work blocks.";
  if (volatility >= 22) return "Volatile signal: performance timing matters more than average score.";
  if (delta > 3) return "Improving trend across the observation window.";
  if (delta < -3) return "Declining trend; investigate load, recovery, or adherence.";
  return "Stable signal; use with current operating-state context.";
}

function getChartPoints(values: number[], width = 260, height = 72, min = 0, max = 100): string {
  const safeValues = values.length === 1 ? [values[0], values[0]] : values;
  if (!safeValues.length) return "";
  const padX = 8;
  const padY = 8;
  const range = Math.max(1, max - min);
  return safeValues
    .map((value, index) => {
      const x = padX + (index / Math.max(1, safeValues.length - 1)) * (width - padX * 2);
      const y = padY + (1 - (clamp(value, min, max) - min) / range) * (height - padY * 2);
      return `${round(x, 1)},${round(y, 1)}`;
    })
    .join(" ");
}

function getLatest<T>(items: T[]): T | null {
  return items.length ? items[items.length - 1] : null;
}

function PageFooter({ reportId, page }: { reportId: string; page: number }) {
  return (
    <footer className="clinical-page-footer">
      <span>NeuroLoop Labs</span>
      <span>{reportId}</span>
      <span>Page {page}</span>
    </footer>
  );
}

function ScorePill({ value, label }: { value: number; label?: string }) {
  const classification = classifyScore(value);
  return (
    <span className={`clinical-score-pill ${classification.tone}`}>
      {label ?? classification.label}
    </span>
  );
}

function MetricTile({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sublabel: string;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  return (
    <div className={`clinical-metric-tile ${tone}`}>
      <span className="clinical-metric-label">{label}</span>
      <span className="clinical-metric-value">{value}</span>
      <span className="clinical-metric-sub">{sublabel}</span>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const safeValue = clamp(value);
  return (
    <div className="clinical-score-bar" aria-hidden="true">
      <div style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.max(0, Math.min(...values, 40) - 8);
  const max = Math.min(100, Math.max(...values, 75) + 8);
  const points = getChartPoints(values, 220, 58, min, max);

  return (
    <svg className="clinical-sparkline" viewBox="0 0 220 58" role="img" aria-label="Metric trend">
      <line x1="8" y1="50" x2="212" y2="50" />
      <polyline points={points} style={{ stroke: color }} />
      {points && (
        <circle
          cx={Number(points.split(" ").slice(-1)[0].split(",")[0])}
          cy={Number(points.split(" ").slice(-1)[0].split(",")[1])}
          r="3.6"
          style={{ fill: color }}
        />
      )}
    </svg>
  );
}

function MetricTrendCard({
  label,
  value,
  average,
  delta,
  values,
  color,
  description,
}: {
  label: string;
  value: number;
  average: number;
  delta: number;
  values: number[];
  color: string;
  description: string;
}) {
  return (
    <div className="clinical-trend-card">
      <div className="clinical-trend-card-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Sparkline values={values.length ? values : [value]} color={color} />
      <div className="clinical-trend-meta">
        <span>Avg {average}</span>
        <span className={getDeltaTone(delta)}>Trend {formatDelta(delta)}</span>
      </div>
      <p>{description}</p>
    </div>
  );
}

function MetricLedger({
  rows,
}: {
  rows: Array<{
    label: string;
    current: number;
    average: number;
    delta: number;
    volatility: number;
  }>;
}) {
  return (
    <div className="clinical-ledger">
      <div className="clinical-ledger-head">
        <span>Measure</span>
        <span>Now</span>
        <span>Avg</span>
        <span>Delta</span>
        <span>Interpretation</span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="clinical-ledger-row">
          <strong>{row.label}</strong>
          <span>{row.current}</span>
          <span>{row.average}</span>
          <span className={getDeltaTone(row.delta)}>{formatDelta(row.delta)}</span>
          <p>{interpretMetric(row.label, row.current, row.delta, row.volatility)}</p>
        </div>
      ))}
    </div>
  );
}

function MultiMetricChart({
  series,
}: {
  series: Array<{ label: string; color: string; values: number[] }>;
}) {
  const allValues = series.flatMap((item) => item.values);
  const min = Math.max(0, Math.min(...allValues, 40) - 8);
  const max = Math.min(100, Math.max(...allValues, 75) + 8);

  return (
    <div className="clinical-panel clinical-chart-panel">
      <div className="clinical-chart-title">
        <div>
          <span>90-day operating pattern</span>
          <strong>Cognitive state trends</strong>
        </div>
        <em>0-100 scale</em>
      </div>
      <svg className="clinical-large-chart" viewBox="0 0 560 180" role="img" aria-label="Historical cognitive metrics">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="28" x2="540" y1={32 + line * 38} y2={32 + line * 38} />
        ))}
        {series.map((item) => (
          <polyline
            key={item.label}
            points={getChartPoints(item.values, 560, 180, min, max)}
            style={{ stroke: item.color }}
          />
        ))}
      </svg>
      <div className="clinical-chart-legend">
        {series.map((item) => (
          <span key={item.label}>
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DualProcessChart({
  s1Values,
  s2Values,
}: {
  s1Values: number[];
  s2Values: number[];
}) {
  const allValues = [...s1Values, ...s2Values];
  const min = Math.max(0, Math.min(...allValues, 40) - 8);
  const max = Math.min(100, Math.max(...allValues, 75) + 8);

  return (
    <div className="clinical-system-chart">
      <svg viewBox="0 0 560 172" role="img" aria-label="System 1 and System 2 trend">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="24" x2="540" y1={28 + line * 38} y2={28 + line * 38} />
        ))}
        <polyline points={getChartPoints(s1Values, 560, 172, min, max)} className="clinical-system-one-line" />
        <polyline points={getChartPoints(s2Values, 560, 172, min, max)} className="clinical-system-two-line" />
      </svg>
      <div className="clinical-chart-legend">
        <span><i className="system-one" />System 1: fast, intuitive, pattern-based</span>
        <span><i className="system-two" />System 2: slow, deliberate, structured</span>
      </div>
    </div>
  );
}

export function ClinicalReport({
  profile,
  metrics,
  aggregates,
  badges,
  generatedAt,
  isPreview = false,
  liveSci,
  metricSnapshots = [],
}: ClinicalReportProps) {
  const reportId = `NL-${generatedAt.getTime().toString(36).toUpperCase()}`;
  const participantAge = profile.birth_date ? calculateAge(profile.birth_date) : null;

  const AE = metrics.focus_stability ?? 50;
  const RA = metrics.fast_thinking ?? 50;
  const CT = metrics.reasoning_accuracy ?? 50;
  const IN = metrics.slow_thinking ?? 50;
  const creativity = metrics.creativity ?? avg([AE, RA, CT, IN]);
  const s1Score = round((AE + RA) / 2);
  const s2Score = round((CT + IN) / 2);
  const corePerformance = round(avg([AE, RA, CT, IN]), 1);
  const readiness = round(metrics.cognitive_readiness_score ?? corePerformance);
  const totalSessions = metrics.total_sessions ?? 0;
  const sessionsLast7d = aggregates.sessionsLast7d ?? 0;
  const accuracy = round(aggregates.accuracyRatePct ?? 0, 1);
  const xp = metrics.experience_points ?? 0;
  const level = metrics.cognitive_level ?? 1;

  const sciComponents = {
    cognitive: liveSci?.cognitivePerformance.score ?? round(corePerformance),
    engagement: liveSci?.behavioralEngagement.score ?? round(Math.min(100, (sessionsLast7d / 7) * 100)),
    recovery: liveSci?.recoveryFactor.score ?? readiness,
  };
  const sci = liveSci?.total ?? round(metrics.cognitive_performance_score ?? corePerformance);
  const sciClass = classifyScore(sci);
  const sciPercentile = getPercentile(sci);

  const baselineForAge = avg([
    metrics.baseline_focus,
    metrics.baseline_fast_thinking,
    metrics.baseline_reasoning,
    metrics.baseline_slow_thinking,
  ]);
  const baselineCognitiveAge = metrics.baseline_cognitive_age ?? participantAge ?? 35;
  const hasBaselineSignal = [
    metrics.baseline_focus,
    metrics.baseline_fast_thinking,
    metrics.baseline_reasoning,
    metrics.baseline_slow_thinking,
  ].some((value) => value !== null && value !== undefined);
  const performanceForAge = avg([AE, RA, CT, IN]);
  const cognitiveAge = hasBaselineSignal
    ? calculateCognitiveAgeFromPerformance({
        performance: performanceForAge,
        baselinePerformance: baselineForAge,
        chronologicalAge: participantAge ?? baselineCognitiveAge,
        rq: metrics.reasoning_quality,
      })
    : null;
  const cognitiveAgeDelta = participantAge && cognitiveAge !== null ? round(cognitiveAge - participantAge, 1) : null;
  const cognitiveAgeLabel = cognitiveAge === null ? "Calibrating" : `${cognitiveAge.toFixed(1)}y`;

  const fallbackRecovery = sciComponents.recovery;
  const fallbackSharpness = calculateSharpness({ AE, RA, CT, IN }, fallbackRecovery);
  const fallbackReasoningQuality = round(avg([metrics.reasoning_quality, CT, IN, metrics.decision_quality, metrics.bias_resistance]));
  const fallbackCoherence = round(avg([fallbackReasoningQuality, 100 - Math.min(45, Math.abs(s1Score - s2Score) * 2.2)]));
  const fallbackSnapshot = useMemo<ReportMetricSnapshot>(() => ({
    snapshot_date: generatedAt.toISOString().slice(0, 10),
    sharpness: fallbackSharpness,
    readiness,
    recovery: fallbackRecovery,
    reasoning_quality: fallbackReasoningQuality,
    ae: AE,
    ra: RA,
    ct: CT,
    in_score: IN,
    s1: s1Score,
    s2: s2Score,
    did_training: sessionsLast7d > 0,
  }), [AE, CT, IN, RA, fallbackReasoningQuality, fallbackRecovery, fallbackSharpness, generatedAt, readiness, s1Score, s2Score, sessionsLast7d]);

  const history = useMemo(() => {
    const sorted = [...metricSnapshots]
      .filter((snapshot) => Boolean(snapshot.snapshot_date))
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    return sorted.length ? sorted.slice(-90) : [fallbackSnapshot];
  }, [metricSnapshots, fallbackSnapshot]);

  const lastSnapshot = getLatest(history) ?? fallbackSnapshot;
  const historyWindow = history.length > 1
    ? `${formatShortDate(history[0].snapshot_date)} - ${formatShortDate(history[history.length - 1].snapshot_date)}`
    : "Current snapshot";

  const metricDefinitions: Array<{
    key: MetricKey;
    label: string;
    color: string;
    fallback: number;
    description: string;
  }> = [
    {
      key: "sharpness",
      label: "Sharpness",
      color: "#46a6ff",
      fallback: fallbackSharpness,
      description: "How much fast cognitive capacity is accessible today.",
    },
    {
      key: "readiness",
      label: "Readiness",
      color: "#8d7bff",
      fallback: readiness,
      description: "Capacity to sustain demanding work without quality drop.",
    },
    {
      key: "recovery",
      label: "Recovery",
      color: "#38d6ad",
      fallback: fallbackRecovery,
      description: "Available restoration buffer supporting cognition.",
    },
    {
      key: "reasoningQuality",
      label: "Reasoning Quality",
      color: "#d5a245",
      fallback: fallbackReasoningQuality,
      description: "How structured and reliable deliberate thinking is.",
    },
    {
      key: "coherence",
      label: "Coherence",
      color: "#f0f1d8",
      fallback: fallbackCoherence,
      description: "Derived alignment between reasoning quality and S1/S2 balance.",
    },
  ];

  const metricTrends = metricDefinitions.map((definition) => {
    const values = history.map((snapshot) => getSnapshotValue(snapshot, definition.key));
    const stats = getTrendStats(values, definition.fallback);
    return {
      ...definition,
      values: values.filter((value): value is number => value !== null).map((value) => round(value)),
      stats,
    };
  });

  const currentSharpness = metricTrends.find((metric) => metric.key === "sharpness")?.stats.current ?? fallbackSharpness;
  const currentReadiness = metricTrends.find((metric) => metric.key === "readiness")?.stats.current ?? readiness;
  const currentRecovery = metricTrends.find((metric) => metric.key === "recovery")?.stats.current ?? fallbackRecovery;
  const currentRQ = metricTrends.find((metric) => metric.key === "reasoningQuality")?.stats.current ?? fallbackReasoningQuality;
  const currentCoherence = metricTrends.find((metric) => metric.key === "coherence")?.stats.current ?? fallbackCoherence;

  const s1TrendValues = history
    .map((snapshot) => getSystemScore(snapshot, "s1"))
    .filter((value): value is number => value !== null)
    .map((value) => round(value));
  const s2TrendValues = history
    .map((snapshot) => getSystemScore(snapshot, "s2"))
    .filter((value): value is number => value !== null)
    .map((value) => round(value));
  const s1Stats = getTrendStats(s1TrendValues, s1Score);
  const s2Stats = getTrendStats(s2TrendValues, s2Score);
  const balance = getBalanceStatus(s1Stats.current, s2Stats.current);
  const dataConfidence = getDataConfidence(history.length, sessionsLast7d, totalSessions);

  const domainRows = [
    {
      key: "AE",
      name: "Attention",
      score: AE,
      baseline: metrics.baseline_focus,
      evidence: "Sustained focus, switching control, distractor resistance.",
    },
    {
      key: "RA",
      name: "Fast Association",
      score: RA,
      baseline: metrics.baseline_fast_thinking,
      evidence: "Pattern linking, intuitive compression, decision velocity.",
    },
    {
      key: "CT",
      name: "Critical Reasoning",
      score: CT,
      baseline: metrics.baseline_reasoning,
      evidence: "Causal analysis, argument quality, evidence weighting.",
    },
    {
      key: "IN",
      name: "Insight",
      score: IN,
      baseline: metrics.baseline_slow_thinking,
      evidence: "Reframing, abstraction, second-order synthesis.",
    },
  ];
  const sortedDomains = [...domainRows].sort((a, b) => b.score - a.score);
  const strongest = sortedDomains[0];
  const weakest = sortedDomains[sortedDomains.length - 1];

  const trainingDistribution = [
    { label: "Focus", value: aggregates.sessionsByArea.focus ?? 0, avg: aggregates.avgScoreByArea.focus ?? 0 },
    { label: "Reasoning", value: aggregates.sessionsByArea.reasoning ?? 0, avg: aggregates.avgScoreByArea.reasoning ?? 0 },
    { label: "Creativity", value: aggregates.sessionsByArea.creativity ?? 0, avg: aggregates.avgScoreByArea.creativity ?? 0 },
  ];
  const maxTrainingSessions = Math.max(...trainingDistribution.map((item) => item.value), 1);
  const recommendedSessionLength = profile.session_duration || aggregates.preferredDuration || "10-15 minutes";
  const trainingDays = history.filter((snapshot) => snapshot.did_training).length;

  const operatingMode = currentReadiness >= 70 && currentSharpness >= 70 && currentRQ >= 60
    ? "Green zone: suitable for interviews, exams, strategic work, and complex output."
    : currentRecovery < 50
      ? "Recovery-limited: protect decisions and rebuild capacity before increasing load."
      : currentRQ < 50
        ? "Structure-limited: favor deliberate reasoning drills and written decision frameworks."
        : "Manageable: productive for routine output, with selective use of deep work.";

  const protocolCards = [
    {
      title: "For case interviews / exams",
      value: currentRQ >= 60 ? "Push structured reasoning" : "Rebuild reasoning quality",
      body: "Use timed cases, assumption logs, and post-answer error reviews. Do not train only speed.",
    },
    {
      title: "For professional output",
      value: currentSharpness >= 70 ? "Use peak blocks" : "Use lower-friction tasks",
      body: "Schedule strategy, writing, coding, or analysis when sharpness and readiness are both green.",
    },
    {
      title: "For cognitive longevity",
      value: currentRecovery >= 60 ? "Maintain dose" : "Prioritize recovery",
      body: "Recovery is the multiplier: without it, training volume converts poorly into performance.",
    },
  ];
  const ledgerRows = metricTrends.map((metric) => ({
    label: metric.label,
    current: metric.stats.current,
    average: metric.stats.average,
    delta: metric.stats.delta,
    volatility: metric.stats.volatility,
  }));
  const momentumDelta = round(avg(metricTrends.slice(0, 4).map((metric) => metric.stats.delta), 0), 1);
  const stabilityIndex = round(clamp(100 - avg(metricTrends.slice(0, 4).map((metric) => metric.stats.volatility), 0)));
  const structureIndex = round(clamp(avg([
    currentCoherence,
    currentRQ,
    100 - Math.abs(s1Stats.current - s2Stats.current) * 2,
  ], currentCoherence)));
  const trajectoryLabel = momentumDelta > 3
    ? "Advancing"
    : momentumDelta < -3
      ? "Regressing"
      : "Consolidating";
  const structureLabel = structureIndex >= 75
    ? "Structured"
    : structureIndex >= 60
      ? "Functional"
      : "Unstable";
  const recordVerdict = currentRecovery < 50
    ? "Performance is currently recovery-constrained: protect output quality before increasing training load."
    : structureIndex < 60
      ? "Thinking quality is the main constraint: prioritize structured reasoning over more volume."
      : momentumDelta > 3
        ? "The profile is moving in the right direction: maintain cadence and protect recovery."
        : "The profile is stable: improvement now depends on better targeting, not more generic activity.";

  return (
    <div className="clinical-report">
      {isPreview && <div className="clinical-watermark">Preview</div>}

      <section className="clinical-page clinical-record-page">
        <div className="clinical-record-topline">
          <div className="clinical-brand">
            <Brain size={24} />
            <div>
              <strong>NeuroLoop Labs</strong>
              <span>Cognitive Performance Record</span>
            </div>
          </div>
          <div className="clinical-document-class">
            <span>Confidential</span>
            <strong>Performance assessment</strong>
          </div>
        </div>

        <div className="clinical-record-title">
          <span className="clinical-kicker">Longitudinal cognitive performance record</span>
          <h1>Thinking Structure & Progress Report</h1>
          <p>{recordVerdict}</p>
        </div>

        <div className="clinical-record-identity">
          <div>
            <span>Participant</span>
            <strong>{profile.name || "Confidential participant"}</strong>
          </div>
          <div>
            <span>Context</span>
            <strong>{formatWorkType(profile.work_type)}</strong>
          </div>
          <div>
            <span>Education</span>
            <strong>{formatEducation(profile.education_level, profile.degree_discipline)}</strong>
          </div>
          <div>
            <span>Observation window</span>
            <strong>{historyWindow}</strong>
          </div>
          <div>
            <span>Evidence base</span>
            <strong>{trainingDays} active days / {history.length} snapshots</strong>
          </div>
          <div>
            <span>Report ID</span>
            <strong>{reportId}</strong>
          </div>
        </div>

        <div className="clinical-record-summary">
          <div className="clinical-verdict-card">
            <span>Operating verdict</span>
            <strong>{operatingMode}</strong>
            <p>
              The report reads cognitive performance as a system: state access, recovery buffer,
              reasoning structure, and S1/S2 balance. Scores are useful only when interpreted as a trajectory.
            </p>
          </div>
          <div className="clinical-index-strip">
            <div>
              <span>Trajectory</span>
              <strong>{trajectoryLabel}</strong>
              <em>{formatDelta(momentumDelta)} net</em>
            </div>
            <div>
              <span>Thinking structure</span>
              <strong>{structureIndex}</strong>
              <em>{structureLabel}</em>
            </div>
            <div>
              <span>Stability</span>
              <strong>{stabilityIndex}</strong>
              <em>{dataConfidence.level} confidence</em>
            </div>
            <div>
              <span>Cognitive age</span>
              <strong>{cognitiveAgeLabel}</strong>
              <em>{cognitiveAgeDelta === null ? "Calibrating" : `${Math.abs(cognitiveAgeDelta).toFixed(1)}y ${cognitiveAgeDelta <= 0 ? "younger" : "older"}`}</em>
            </div>
          </div>
        </div>

        <MetricLedger rows={ledgerRows} />

        <div className="clinical-record-note">
          <strong>Purpose:</strong> help students, young professionals, and high-demand operators understand
          how their thinking is structured, whether they are advancing, and when they should push or recover.
          This is a performance record, not a medical diagnosis.
        </div>
        <PageFooter reportId={reportId} page={1} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>01</span>
          <div>
            <h2>Longitudinal State</h2>
            <p>How the core app metrics behaved over the reporting window.</p>
          </div>
        </header>

        <div className="clinical-trend-grid">
          {metricTrends.slice(0, 4).map((metric) => (
            <MetricTrendCard
              key={metric.key}
              label={metric.label}
              value={metric.stats.current}
              average={metric.stats.average}
              delta={metric.stats.delta}
              values={metric.values}
              color={metric.color}
              description={metric.description}
            />
          ))}
        </div>

        <MultiMetricChart
          series={metricTrends.slice(0, 4).map((metric) => ({
            label: metric.label,
            color: metric.color,
            values: metric.values.length ? metric.values : [metric.stats.current],
          }))}
        />

        <div className="clinical-two-column">
          <div className="clinical-panel clinical-summary-panel">
            <h3>Performance read</h3>
            <p>
              Current SCI is <strong>{sci}/100</strong> ({sciClass.label.toLowerCase()}, approx.
              {sciPercentile}th percentile in the internal model). The practical question is not only
              score level, but whether sharpness, readiness, recovery, and reasoning quality move together.
            </p>
          </div>
          <div className="clinical-panel">
            <h3>Data confidence</h3>
            <div className="clinical-confidence-ring">
              <span>{dataConfidence.score}%</span>
              <ScoreBar value={dataConfidence.score} />
            </div>
            <p>{dataConfidence.description}</p>
          </div>
        </div>
        <PageFooter reportId={reportId} page={2} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>02</span>
          <div>
            <h2>System 1 / System 2</h2>
            <p>A Kahneman-style map of intuition, speed, control, and deliberate reasoning.</p>
          </div>
        </header>

        <div className="clinical-kahneman-grid">
          <div className="clinical-system-card one">
            <span>System 1</span>
            <strong>{s1Stats.current}</strong>
            <ScorePill value={s1Stats.current} />
            <p>Fast, associative, pattern-driven. Useful for quick synthesis and recognition under time pressure.</p>
            <em>Trend {formatDelta(s1Stats.delta)} | Avg {s1Stats.average}</em>
          </div>
          <div className="clinical-system-card two">
            <span>System 2</span>
            <strong>{s2Stats.current}</strong>
            <ScorePill value={s2Stats.current} />
            <p>Slow, structured, evidence-weighted. Critical for case interviews, strategy, analysis, and judgment.</p>
            <em>Trend {formatDelta(s2Stats.delta)} | Avg {s2Stats.average}</em>
          </div>
        </div>

        <DualProcessChart
          s1Values={s1TrendValues.length ? s1TrendValues : [s1Score]}
          s2Values={s2TrendValues.length ? s2TrendValues : [s2Score]}
        />

        <div className="clinical-architecture-table">
          {[
            {
              label: "Intuition access",
              value: s1Stats.current,
              note: s1Stats.current >= 70
                ? "Fast pattern recognition is accessible."
                : "Speed layer needs more activation or recovery.",
            },
            {
              label: "Verification depth",
              value: s2Stats.current,
              note: s2Stats.current >= 70
                ? "Deliberate reasoning can support complex judgment."
                : "Structured reasoning should be trained deliberately.",
            },
            {
              label: "Coherence",
              value: currentCoherence,
              note: currentCoherence >= 70
                ? "Fast and slow systems are translating into a usable thinking stack."
                : "Thinking may fragment under ambiguity or pressure.",
            },
            {
              label: "Decision risk",
              value: Math.round(Math.abs(s1Stats.current - s2Stats.current)),
              note: Math.abs(s1Stats.current - s2Stats.current) <= 6
                ? "Low imbalance risk."
                : s1Stats.current > s2Stats.current
                  ? "Risk: fast conclusions outrun verification."
                  : "Risk: verification slows commitment.",
            },
          ].map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </div>
          ))}
        </div>

        <div className="clinical-panel">
          <h3>Interpretation</h3>
          <p>
            The current architecture is <strong>{balance.label}</strong>. {balance.interpretation}
            {" "}For ambitious students and high-output professionals, the goal is not to maximize one system:
            it is to know when intuition is reliable and when deliberate verification is required.
          </p>
          <div className="clinical-implication-grid">
            <div>
              <span>When speed matters</span>
              <p>{s1Stats.current >= s2Stats.current ? "Use fast first-pass synthesis, then verify assumptions." : "Use timed drills to prevent slow reasoning from becoming drag."}</p>
            </div>
            <div>
              <span>When stakes rise</span>
              <p>{currentRQ >= 60 ? "Reasoning quality supports structured decisions; document premises." : "Use written frameworks before committing to conclusions."}</p>
            </div>
            <div>
              <span>When recovery drops</span>
              <p>{currentRecovery >= 55 ? "Training can continue, but avoid stacking several high-load days." : "Protect sleep, reduce cognitive input, and delay irreversible decisions."}</p>
            </div>
          </div>
        </div>
        <PageFooter reportId={reportId} page={3} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>03</span>
          <div>
            <h2>Evidence Profile</h2>
            <p>What the app has actually measured: domains, sessions, and behavior.</p>
          </div>
        </header>

        <div className="clinical-metric-row">
          <MetricTile label="SCI" value={sci} sublabel={`${sciPercentile}th percentile`} tone="accent" />
          <MetricTile label="Recovery" value={currentRecovery} sublabel={`Trend ${formatDelta(metricTrends[2].stats.delta)}`} tone={currentRecovery >= 55 ? "success" : "warning"} />
          <MetricTile label="Training" value={sessionsLast7d} sublabel="Sessions last 7d" />
          <MetricTile label="Level" value={`L${level}`} sublabel={`${xp.toLocaleString()} XP`} />
        </div>

        <div className="clinical-domain-table clinical-domain-table-compact">
          {domainRows.map((domain) => {
            const delta = domain.baseline !== null && domain.baseline !== undefined
              ? round(domain.score - domain.baseline, 1)
              : null;
            return (
              <div key={domain.key} className="clinical-domain-row">
                <div>
                  <span>{domain.key}</span>
                  <strong>{domain.name}</strong>
                  <p>{domain.evidence}</p>
                </div>
                <div className="clinical-domain-score">
                  <strong>{round(domain.score)}</strong>
                  <ScorePill value={domain.score} />
                </div>
                <div className="clinical-domain-bar-cell">
                  <ScoreBar value={domain.score} />
                  <small>{delta === null ? "No baseline delta" : `${delta >= 0 ? "+" : ""}${delta} vs baseline`}</small>
                </div>
              </div>
            );
          })}
        </div>

        <div className="clinical-two-column">
          <div className="clinical-panel">
            <h3>Training distribution</h3>
            <div className="clinical-training-distribution">
              {trainingDistribution.map((item) => (
                <div key={item.label}>
                  <div className="clinical-training-row">
                    <span>{item.label}</span>
                    <strong>{item.value} sessions</strong>
                    <em>{round(item.avg)} avg</em>
                  </div>
                  <div className="clinical-distribution-bar">
                    <div style={{ width: `${(item.value / maxTrainingSessions) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="clinical-panel">
            <h3>Repeated drills</h3>
            {aggregates.mostUsedExercises.length > 0 ? (
              <ol className="clinical-ranked-list">
                {aggregates.mostUsedExercises.slice(0, 4).map((exercise) => (
                  <li key={exercise.exerciseId}>
                    <span>{formatGameType(exercise.exerciseId)}</span>
                    <strong>{exercise.count}x</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No repeated drill pattern is available yet.</p>
            )}
          </div>
        </div>
        <PageFooter reportId={reportId} page={4} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>04</span>
          <div>
            <h2>Performance Protocol</h2>
            <p>What to do next if the goal is sharper professional thinking.</p>
          </div>
        </header>

        <div className="clinical-panel clinical-prognosis">
          <h3>Operating prescription</h3>
          <p>
            Primary lever: <strong>{weakest.name}</strong>. Preserve: <strong>{strongest.name}</strong>.
            {" "}Recommended dose: <strong>5 sessions/week</strong> at <strong>{recommendedSessionLength}</strong>,
            with recovery protected before high-stakes work. Mean accuracy is <strong>{accuracy}%</strong>.
          </p>
        </div>

        <div className="clinical-protocol-grid">
          {protocolCards.map((card, index) => (
            <div key={card.title} className="clinical-protocol-card">
              <span>0{index + 1}</span>
              <h3>{card.title}</h3>
              <strong>{card.value}</strong>
              <p>{card.body}</p>
            </div>
          ))}
        </div>

        <div className="clinical-two-column">
          <div className="clinical-panel">
            <h3>Method notes</h3>
            <p>
              Trends use daily snapshots from the app: sharpness, readiness, recovery, reasoning quality,
              and S1/S2 component scores. Coherence is derived from reasoning quality plus S1/S2 balance
              when no direct coherence metric is present.
            </p>
          </div>
          <div className="clinical-panel">
            <h3>Limits</h3>
            <p>
              This is a performance report, not a medical diagnosis or neuropsychological evaluation.
              Use it like a cognitive WHOOP/Oura: to time effort, improve training, and monitor adaptation.
            </p>
          </div>
        </div>

        <div className="clinical-final-statement">
          <div className="clinical-brand small">
            <Brain size={18} />
            <div>
              <strong>NeuroLoop Labs</strong>
              <span>Cognitive performance intelligence</span>
            </div>
          </div>
          <p>
            Built for people whose work depends on clear thinking: students preparing for selective paths,
            young professionals entering competitive roles, and operators who need sustained cognitive output.
          </p>
          <dl className="clinical-compact-list">
            <div><dt>Generated</dt><dd>{generatedAt.toISOString()}</dd></div>
            <div><dt>Classification</dt><dd>Confidential</dd></div>
            <div><dt>Badges</dt><dd>{badges.length}</dd></div>
          </dl>
        </div>
        <PageFooter reportId={reportId} page={5} />
      </section>
    </div>
  );
}
