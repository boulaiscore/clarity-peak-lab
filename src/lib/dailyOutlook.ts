import { clamp } from "@/lib/cognitiveEngine";

export const DAILY_OUTLOOK_POLICY_VERSION = "daily-outlook-v2-metric-coach";

export type DailyOutlookActionKey =
  | "recover"
  | "protect_attention"
  | "protect_capacity"
  | "use_capacity"
  | "train_focus"
  | "train_reasoning"
  | "normal_plan";

export type DailyOutlookTone = "support" | "limit" | "neutral";
export type DailyOutlookIntensity = "protective" | "steady" | "strong";

export interface DailyOutlookHealthSignals {
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  steps: number | null;
  activeMinutes: number | null;
  observedDate: string | null;
  sources: string[];
}

export interface DailyOutlookEvidence {
  code: "REC" | "RDY" | "SHP" | "RQ" | "HLT" | "SLP" | "HRV" | "RHR" | "ACT" | "ATT" | "CAL" | "PAT";
  label: string;
  detail: string;
  tone: DailyOutlookTone;
}

export interface DailyOutlookAction {
  key: DailyOutlookActionKey;
  label: string;
  shortLabel: string;
  durationMinutes: number | null;
  kind: "guidance" | "lab";
  route: string | null;
  metricCode: DailyOutlookEvidence["code"];
  metricLabel: string;
  metricDetail: string;
}

export interface DailyOutlook {
  policyVersion: string;
  headline: string;
  summary: string;
  intensity: DailyOutlookIntensity;
  windowLabel: string | null;
  windowSource: "calendar" | "next_available" | null;
  action: DailyOutlookAction;
  evidence: DailyOutlookEvidence[];
  confidence: number;
  confidenceLabel: "Baseline" | "Medium" | "High";
  personalization: "state" | "personal";
  healthSignals: DailyOutlookHealthSignals | null;
}

export interface DailyOutlookInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  healthScore?: number | null;
  healthSignals?: Partial<DailyOutlookHealthSignals> | null;
  attentionLoadRatio?: number | null;
  scheduleLoadRatio?: number | null;
  signalCoverage: number;
  primaryOutcome?: "decide" | "focus" | "reason" | null;
  canPersonalize: boolean;
  rhythm?: {
    status: "learning" | "emerging" | "reliable";
    observedDays: number;
    openWindow: string | null;
    topDriver: {
      label: "Recovery" | "Health" | "Attention" | "Schedule";
      direction: "supports" | "limits";
      strength: number;
    } | null;
  } | null;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundedScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function bounded(value: number | null | undefined, minimum: number, maximum: number): number | null {
  const parsed = finite(value);
  return parsed === null ? null : clamp(parsed, minimum, maximum);
}

function normalizeHealthSignals(
  value: DailyOutlookInput["healthSignals"],
): DailyOutlookHealthSignals | null {
  if (!value) return null;
  const normalized: DailyOutlookHealthSignals = {
    sleepDurationMin: bounded(value.sleepDurationMin, 0, 24 * 60),
    sleepEfficiency: bounded(value.sleepEfficiency, 0, 100),
    hrvMs: bounded(value.hrvMs, 0, 500),
    restingHr: bounded(value.restingHr, 20, 250),
    steps: bounded(value.steps, 0, 100_000),
    activeMinutes: bounded(value.activeMinutes, 0, 24 * 60),
    observedDate: typeof value.observedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.observedDate)
      ? value.observedDate
      : null,
    sources: Array.isArray(value.sources)
      ? value.sources.filter((source): source is string => typeof source === "string").slice(0, 3)
      : [],
  };
  const hasSignal = Object.entries(normalized).some(([key, item]) =>
    key !== "observedDate" && key !== "sources" && typeof item === "number",
  );
  return hasSignal ? normalized : null;
}

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (hours === 0) return `${remainder} min`;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

function healthContextSentence(value: DailyOutlookInput["healthSignals"]): string {
  const signals = normalizeHealthSignals(value);
  if (!signals) return "";
  const observations: string[] = [];
  if (signals.sleepDurationMin !== null) {
    const efficiency = signals.sleepEfficiency === null
      ? ""
      : ` at ${Math.round(signals.sleepEfficiency)}% efficiency`;
    observations.push(`${formatDuration(signals.sleepDurationMin)} of sleep${efficiency}`);
  }
  if (signals.hrvMs !== null) {
    observations.push(`HRV at ${Math.round(signals.hrvMs)} ms`);
  } else if (signals.restingHr !== null) {
    observations.push(`resting heart rate at ${Math.round(signals.restingHr)} bpm`);
  } else if (signals.steps !== null) {
    observations.push(`${Math.round(signals.steps).toLocaleString("en-US")} steps`);
  } else if (signals.activeMinutes !== null) {
    observations.push(`${Math.round(signals.activeMinutes)} active minutes`);
  }
  if (observations.length === 0) return "";
  return ` Your latest Health data also records ${observations.slice(0, 2).join(" and ")}; LOOMA treats these as context and learns their meaning against your baseline over time.`;
}

function withHealthContext(
  summary: string,
  healthSignals: DailyOutlookInput["healthSignals"],
): string {
  return `${summary}${healthContextSentence(healthSignals)}`;
}

function metricTone(value: number, supportiveAt = 60, limitingBelow = 45): DailyOutlookTone {
  if (value >= supportiveAt) return "support";
  if (value < limitingBelow) return "limit";
  return "neutral";
}

function ratioEvidence(
  code: "ATT" | "CAL",
  label: string,
  ratio: number,
): DailyOutlookEvidence {
  const percentage = Math.round(Math.abs(ratio - 1) * 100);
  if (ratio >= 1.1) {
    return {
      code,
      label,
      detail: `${percentage}% above your baseline`,
      tone: "limit",
    };
  }
  if (ratio <= 0.85) {
    return {
      code,
      label,
      detail: `${percentage}% below your baseline`,
      tone: "support",
    };
  }
  return { code, label, detail: "Near your baseline", tone: "neutral" };
}

function calculateConfidence(input: DailyOutlookInput): number {
  const sourceCoverage = clamp(input.signalCoverage, 0, 1);
  if (!input.canPersonalize) return sourceCoverage * 0.65;
  const historyMaturity = input.rhythm
    ? clamp(input.rhythm.observedDays / 21, 0, 1)
    : 0;
  return clamp(0.7 * sourceCoverage + 0.3 * historyMaturity, 0, 1);
}

function confidenceLabel(confidence: number): DailyOutlook["confidenceLabel"] {
  if (confidence >= 0.72) return "High";
  if (confidence >= 0.34) return "Medium";
  return "Baseline";
}

function buildEvidence(input: DailyOutlookInput): DailyOutlookEvidence[] {
  const healthSignals = normalizeHealthSignals(input.healthSignals);
  const evidence: DailyOutlookEvidence[] = [
    {
      code: "REC",
      label: "Recovery",
      detail: `${roundedScore(input.recovery)} today`,
      tone: metricTone(input.recovery, 60, 45),
    },
    {
      code: "RDY",
      label: "Readiness",
      detail: `${roundedScore(input.readiness)} today`,
      tone: metricTone(input.readiness, 65, 45),
    },
    {
      code: "SHP",
      label: "Sharpness",
      detail: `${roundedScore(input.sharpness)} today`,
      tone: metricTone(input.sharpness, 65, 45),
    },
    {
      code: "RQ",
      label: "Reasoning",
      detail: `${roundedScore(input.reasoningQuality)} today`,
      tone: metricTone(input.reasoningQuality, 65, 45),
    },
  ];

  const healthScore = finite(input.healthScore);
  if (healthScore !== null) {
    evidence.push({
      code: "HLT",
      label: "Health context",
      detail: `${roundedScore(healthScore)} from available signals`,
      tone: metricTone(healthScore, 60, 45),
    });
  }

  if (healthSignals?.sleepDurationMin !== null && healthSignals?.sleepDurationMin !== undefined) {
    const efficiency = healthSignals.sleepEfficiency === null
      ? ""
      : ` · ${Math.round(healthSignals.sleepEfficiency)}% efficiency`;
    evidence.push({
      code: "SLP",
      label: "Sleep",
      detail: `${formatDuration(healthSignals.sleepDurationMin)} observed${efficiency}`,
      tone: "neutral",
    });
  }

  if (healthSignals?.hrvMs !== null && healthSignals?.hrvMs !== undefined) {
    evidence.push({
      code: "HRV",
      label: "Heart-rate variability",
      detail: `${Math.round(healthSignals.hrvMs)} ms observed`,
      tone: "neutral",
    });
  }

  if (healthSignals?.restingHr !== null && healthSignals?.restingHr !== undefined) {
    evidence.push({
      code: "RHR",
      label: "Resting heart rate",
      detail: `${Math.round(healthSignals.restingHr)} bpm observed`,
      tone: "neutral",
    });
  }

  if (healthSignals?.steps !== null && healthSignals?.steps !== undefined) {
    evidence.push({
      code: "ACT",
      label: "Daily movement",
      detail: `${Math.round(healthSignals.steps).toLocaleString("en-US")} steps observed`,
      tone: "neutral",
    });
  } else if (healthSignals?.activeMinutes !== null && healthSignals?.activeMinutes !== undefined) {
    evidence.push({
      code: "ACT",
      label: "Daily movement",
      detail: `${Math.round(healthSignals.activeMinutes)} active min observed`,
      tone: "neutral",
    });
  }

  const attentionRatio = finite(input.attentionLoadRatio);
  if (attentionRatio !== null) {
    evidence.push(ratioEvidence("ATT", "Attention load", attentionRatio));
  }

  const scheduleRatio = finite(input.scheduleLoadRatio);
  if (scheduleRatio !== null) {
    evidence.push(ratioEvidence("CAL", "Schedule load", scheduleRatio));
  }

  if (input.canPersonalize && input.rhythm?.topDriver) {
    evidence.push({
      code: "PAT",
      label: "Personal pattern",
      detail: `${input.rhythm.topDriver.label} ${input.rhythm.topDriver.direction} next-day state`,
      tone: input.rhythm.topDriver.direction === "supports" ? "support" : "limit",
    });
  }

  const ranked = evidence
    .sort((a, b) => {
      const priority = { limit: 2, support: 1, neutral: 0 };
      return priority[b.tone] - priority[a.tone];
    });
  const healthDetail = ranked.find((item) => ["SLP", "HRV", "RHR", "ACT"].includes(item.code));
  const selected = ranked.filter((item) => item !== healthDetail).slice(0, healthDetail ? 4 : 5);
  return healthDetail ? [...selected, healthDetail] : selected;
}

function action(
  value: Omit<DailyOutlookAction, "durationMinutes"> & { durationMinutes?: number | null },
): DailyOutlookAction {
  return { ...value, durationMinutes: value.durationMinutes ?? null };
}

/**
 * Explainable policy for today's recommendation. The policy selects the action;
 * generative copy may rephrase headline and summary, but cannot change this
 * action, its duration, its evidence or any metric value.
 */
export function deriveDailyOutlook(input: DailyOutlookInput): DailyOutlook {
  const healthScore = finite(input.healthScore);
  const attentionLoadRatio = finite(input.attentionLoadRatio);
  const scheduleLoadRatio = finite(input.scheduleLoadRatio);
  const confidence = calculateConfidence(input);
  const shared = {
    policyVersion: DAILY_OUTLOOK_POLICY_VERSION,
    evidence: buildEvidence(input),
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel: confidenceLabel(confidence),
    personalization: input.canPersonalize ? "personal" as const : "state" as const,
    healthSignals: normalizeHealthSignals(input.healthSignals),
  };

  if (input.recovery < 35 || input.readiness < 40 || (healthScore !== null && healthScore < 40)) {
    const limitingHealth = healthScore !== null && healthScore < 40;
    const limitingReadiness = !limitingHealth && input.readiness < 40;
    const metricCode = limitingHealth ? "HLT" : limitingReadiness ? "RDY" : "REC";
    const metricLabel = limitingHealth ? "Health context" : limitingReadiness ? "Readiness" : "Recovery";
    const metricValue = limitingHealth ? healthScore : limitingReadiness ? input.readiness : input.recovery;
    return {
      ...shared,
      headline: "Recovery is the priority today",
      summary: withHealthContext(`${metricLabel} is ${roundedScore(metricValue ?? 0)}, the clearest limiting signal today. Avoid adding cognitive load before restoring reserve.`, input.healthSignals),
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "recover",
        label: "Choose a recovery protocol in Lab",
        shortLabel: "Recovery protocol",
        kind: "lab",
        route: "/neuro-lab?tab=detox",
        metricCode,
        metricLabel,
        metricDetail: `${roundedScore(metricValue ?? 0)} today`,
      }),
    };
  }

  if (attentionLoadRatio !== null && attentionLoadRatio >= 1.35) {
    return {
      ...shared,
      headline: "Digital load is the constraint",
      summary: withHealthContext(`Attention load is ${Math.round((attentionLoadRatio - 1) * 100)}% above your baseline. A reset is more relevant than adding another cognitive demand.`, input.healthSignals),
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "protect_attention",
        label: "Open an attention reset in Lab",
        shortLabel: "Attention reset",
        kind: "lab",
        route: "/neuro-lab?tab=detox",
        metricCode: "ATT",
        metricLabel: "Attention load",
        metricDetail: `${Math.round((attentionLoadRatio - 1) * 100)}% above baseline`,
      }),
    };
  }

  if (scheduleLoadRatio !== null && scheduleLoadRatio >= 1.35 && input.readiness < 65) {
    return {
      ...shared,
      headline: "Protect capacity from schedule load",
      summary: withHealthContext(`Schedule load is ${Math.round((scheduleLoadRatio - 1) * 100)}% above baseline while Readiness is ${roundedScore(input.readiness)}. No extra training is recommended.`, input.healthSignals),
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "protect_capacity",
        label: "Keep cognitive demand below your usual peak",
        shortLabel: "Protect capacity",
        kind: "guidance",
        route: null,
        metricCode: "RDY",
        metricLabel: "Readiness",
        metricDetail: `${roundedScore(input.readiness)} today`,
      }),
    };
  }

  if (
    input.readiness >= 75 &&
    input.recovery >= 60 &&
    input.sharpness >= 65 &&
    (healthScore === null || healthScore >= 55)
  ) {
    return {
      ...shared,
      headline: "Your signals are aligned",
      summary: withHealthContext(`Readiness ${roundedScore(input.readiness)}, Sharpness ${roundedScore(input.sharpness)} and Recovery ${roundedScore(input.recovery)} support demanding cognitive work today.`, input.healthSignals),
      intensity: "strong",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "use_capacity",
        label: "Use this state for your highest-priority cognitive work",
        shortLabel: "Use capacity",
        kind: "guidance",
        route: null,
        metricCode: "RDY",
        metricLabel: "Readiness",
        metricDetail: `${roundedScore(input.readiness)} today`,
      }),
    };
  }

  if (input.recovery >= 55 && input.sharpness < 50) {
    return {
      ...shared,
      headline: "Sharpness is today’s opportunity",
      summary: withHealthContext(`Recovery is ${roundedScore(input.recovery)}, while Sharpness is ${roundedScore(input.sharpness)}. A focus drill is the most directly connected intervention.`, input.healthSignals),
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "train_focus",
        label: "Open an attentional-control drill in Lab",
        shortLabel: "Train sharpness",
        kind: "lab",
        route: "/neuro-lab?tab=games&system=fast",
        metricCode: "SHP",
        metricLabel: "Sharpness",
        metricDetail: `${roundedScore(input.sharpness)} today`,
      }),
    };
  }

  if (input.recovery >= 55 && input.reasoningQuality < 45) {
    return {
      ...shared,
      headline: "Reasoning is today’s opportunity",
      summary: withHealthContext(`Recovery is ${roundedScore(input.recovery)}, while Reasoning is ${roundedScore(input.reasoningQuality)}. A deliberate-reasoning drill is the most relevant training action.`, input.healthSignals),
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "train_reasoning",
        label: "Open a deliberate-reasoning drill in Lab",
        shortLabel: "Train reasoning",
        kind: "lab",
        route: "/neuro-lab?tab=games&system=slow",
        metricCode: "RQ",
        metricLabel: "Reasoning",
        metricDetail: `${roundedScore(input.reasoningQuality)} today`,
      }),
    };
  }

  if (input.readiness < 55) {
    return {
      ...shared,
      headline: "Sustained capacity is limited",
      summary: withHealthContext(`Readiness is ${roundedScore(input.readiness)}, below the range used for demanding sustained work. Keep cognitive demand below your usual peak.`, input.healthSignals),
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "protect_capacity",
        label: "Protect capacity; skip additional training today",
        shortLabel: "Protect capacity",
        kind: "guidance",
        route: null,
        metricCode: "RDY",
        metricLabel: "Readiness",
        metricDetail: `${roundedScore(input.readiness)} today`,
      }),
    };
  }

  return {
    ...shared,
    headline: "Your state is steady",
    summary: withHealthContext(`Readiness is ${roundedScore(input.readiness)} and Recovery is ${roundedScore(input.recovery)}, with no dominant limiting signal. Follow your normal plan today.`, input.healthSignals),
    intensity: "steady",
    windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
    windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
    action: action({
      key: "normal_plan",
      label: "Follow your normal plan; no added protocol is needed",
      shortLabel: "Normal plan",
      kind: "guidance",
      route: null,
      metricCode: "RDY",
      metricLabel: "Readiness",
      metricDetail: `${roundedScore(input.readiness)} today`,
    }),
  };
}
