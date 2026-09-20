import { clamp } from "@/lib/cognitiveEngine";
import { LOW_RECOVERY_THRESHOLD } from "@/lib/decayConstants";

export const DAILY_OUTLOOK_POLICY_VERSION = "daily-outlook-v5-objective";

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

export type DailyVerdictKind = "recover" | "protect" | "decide" | "build" | "steady";

export interface DailyVerdict {
  kind: DailyVerdictKind;
  label: string;
  subline: string;
}

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

export interface DailyOutlookPreviousMetrics {
  sharpness: number | null;
  readiness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
}

export interface DailyOutlookBehaviorContext {
  metricTrendPerDay: number | null;
  cognitiveActivityDays7d: number | null;
  gameSessions7d: number | null;
  qualityTimeMinutes7d: number | null;
  recoveryMinutes7d: number | null;
}

export interface DailyOutlookCoachBasis {
  goalGuidance: string;
  /** Empty when the user has no upcoming objective. */
  objectiveGuidance: string;
  patternInsight: string;
  learnedFromHistory: boolean;
}

export interface DailyOutlookObjective {
  /** Display name, either the preset name or the user's own wording. */
  label: string;
  /** Whole days from today to the objective date. Negative means it has passed. */
  daysUntil: number | null;
  /** Metric the objective depends on, from the chosen preset. */
  focus?: ObjectiveFocus | null;
  /** Plain-language description of what the day demands. */
  demand?: string | null;
}

export interface DailyOutlookEvidence {
  code: "REC" | "RDY" | "SHP" | "RQ" | "HLT" | "SLP" | "HRV" | "RHR" | "ACT" | "ATT" | "DFR" | "CAL" | "PAT";
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
  verdict: DailyVerdict;
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
  coachBasis: DailyOutlookCoachBasis;
}

export interface DailyOutlookInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  healthScore?: number | null;
  healthSignals?: Partial<DailyOutlookHealthSignals> | null;
  attentionLoadRatio?: number | null;
  digitalFragmentationRatio?: number | null;
  scheduleLoadRatio?: number | null;
  signalCoverage: number;
  recoveryEstimated?: boolean;
  primaryOutcome?: "decide" | "focus" | "reason" | null;
  workType?: string | null;
  objective?: DailyOutlookObjective | null;
  behaviorContext?: Partial<DailyOutlookBehaviorContext> | null;
  previousMetrics?: Partial<DailyOutlookPreviousMetrics> | null;
  canPersonalize: boolean;
  rhythm?: {
    status: "learning" | "emerging" | "reliable";
    observedDays: number;
    openWindow: string | null;
    topDriver: {
      label: "Recovery" | "Health" | "Attention" | "Fragmentation" | "Schedule";
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
  return `Today’s health data includes ${observations.slice(0, 2).join(" and ")}.`;
}

function workContext(workType: string | null | undefined): string {
  switch (workType) {
    case "management": return " in your management work";
    case "creative": return " in your creative work";
    case "technical": return " in your technical work";
    case "student": return " in your study work";
    case "knowledge": return " in your knowledge work";
    default: return "";
  }
}

function goalGuidance(
  input: DailyOutlookInput,
  intensity: DailyOutlookIntensity,
): string {
  const context = workContext(input.workType);
  const outcome = input.primaryOutcome ?? "focus";
  if (intensity === "protective") {
    if (outcome === "decide") return `Make fewer decisions${context}, and leave the important ones for when you feel fresher.`;
    if (outcome === "reason") return `Work on one clear problem${context}, rather than pushing for hours.`;
    return `Keep your focus sessions short${context} today.`;
  }
  if (intensity === "strong") {
    if (outcome === "decide") return `Handle your most important decision${context} today.`;
    if (outcome === "reason") return `Use this energy on your hardest problem${context}.`;
    return `Use your best focus on the work that matters most${context}.`;
  }
  if (outcome === "decide") return `Take important decisions one at a time${context}.`;
  if (outcome === "reason") return `Keep the work structured${context}, and stop when concentration drops.`;
  return `Choose one priority${context} and keep a steady pace.`;
}

function patternInsight(input: DailyOutlookInput): Pick<DailyOutlookCoachBasis, "patternInsight" | "learnedFromHistory"> {
  if (input.canPersonalize && input.rhythm?.topDriver) {
    const driver = input.rhythm.topDriver;
    return {
      patternInsight: `Your data shows that ${driver.label.toLowerCase()} is often followed by a ${driver.direction === "supports" ? "better" : "worse"} day.`,
      learnedFromHistory: true,
    };
  }

  const trend = finite(input.behaviorContext?.metricTrendPerDay);
  if (trend !== null && Math.abs(trend) >= 0.12) {
    return {
      patternInsight: trend > 0
        ? "Your scores have been improving lately."
        : "Your scores have been lower lately.",
      learnedFromHistory: true,
    };
  }

  const activityDays = finite(input.behaviorContext?.cognitiveActivityDays7d);
  if (activityDays !== null && activityDays > 0) {
    return {
      patternInsight: `You trained on ${Math.round(activityDays)} of the last 7 days.`,
      learnedFromHistory: true,
    };
  }

  if (input.canPersonalize && input.rhythm && input.rhythm.observedDays > 0) {
    return {
      patternInsight: `LOOMA has ${Math.round(input.rhythm.observedDays)} days of data and is still learning what affects you.`,
      learnedFromHistory: input.rhythm.status !== "learning",
    };
  }

  return {
    patternInsight: "LOOMA is still learning what affects your performance.",
    learnedFromHistory: false,
  };
}

/** Score of the metric the objective depends on, when the user picked a preset. */
function objectiveFocusScore(input: DailyOutlookInput): number | null {
  switch (input.objective?.focus) {
    case "sharpness": return finite(input.sharpness);
    case "reasoning": return finite(input.reasoningQuality);
    case "readiness": return finite(input.readiness);
    case "recovery": return finite(input.recovery);
    default: return null;
  }
}

/**
 * One sentence tying the objective to the metric it depends on,
 * added only when that metric is currently below its usable range.
 */
function objectiveFocusSentence(input: DailyOutlookInput, days: number | null): string {
  const objective = input.objective;
  const focus = objective?.focus;
  const demand = typeof objective?.demand === "string" ? objective.demand.trim() : "";
  const score = objectiveFocusScore(input);
  if (!focus || !demand || score === null) return "";
  const metricName = OBJECTIVE_FOCUS_LABEL[focus];

  if (days === 0) {
    return score < 50
      ? `It needs ${demand}, and your ${metricName} is ${Math.round(score)} right now, so cut everything that is not the event itself.`
      : `It needs ${demand}, and your ${metricName} is holding at ${Math.round(score)}.`;
  }
  if (score < 45) {
    return `It needs ${demand}. Your ${metricName} is ${Math.round(score)}, below where you want it on the day, so treat that as the thing to fix first.`;
  }
  if (score < 60) {
    return `It needs ${demand}, and your ${metricName} is ${Math.round(score)}: enough to work with, not yet where you want it on the day.`;
  }
  return "";
}

/**
 * Turns a user-declared objective with a date into day-level guidance.
 * The objective never changes the metric policy, only how the day is framed.
 */
function objectiveGuidance(
  input: DailyOutlookInput,
  intensity: DailyOutlookIntensity,
): string {
  const objective = input.objective;
  const label = typeof objective?.label === "string" ? objective.label.trim() : "";
  if (!label) return "";
  const days = finite(objective?.daysUntil);
  if (days === null) {
    return [`You are working towards ${label}.`, objectiveFocusSentence(input, null)]
      .filter(Boolean).join(" ");
  }
  if (days < 0) return "";

  const focusSentence = objectiveFocusSentence(input, days);
  const withFocus = (sentence: string) => [sentence, focusSentence].filter(Boolean).join(" ");

  if (days === 0) {
    if (intensity === "protective") {
      return withFocus(`${label} is today, and you are not at your best: keep the warm-up light and save your energy for the moment itself.`);
    }
    return withFocus(`${label} is today. Do the essential preparation only and go in fresh.`);
  }

  if (days === 1) {
    return withFocus(intensity === "protective"
      ? `${label} is tomorrow. Stop heavy preparation early today and protect your sleep.`
      : `${label} is tomorrow. Do one focused review today, then stop early.`);
  }

  if (days <= 7) {
    if (intensity === "protective") {
      return withFocus(`${label} is in ${days} days. Keep today light so the days before it are usable.`);
    }
    if (intensity === "strong") {
      return withFocus(`${label} is in ${days} days. Use today for the hardest part of your preparation.`);
    }
    return withFocus(`${label} is in ${days} days. Keep preparation to one solid block today.`);
  }

  if (days <= 30) {
    return withFocus(intensity === "strong"
      ? `${label} is in ${days} days. This is a good day to push preparation forward.`
      : `${label} is in ${days} days, so there is no need to force it today.`);
  }

  return withFocus(`${label} is in ${days} days. Build the habit now rather than sprinting.`);
}

function buildCoachBasis(
  input: DailyOutlookInput,
  intensity: DailyOutlookIntensity,
): DailyOutlookCoachBasis {
  return {
    goalGuidance: goalGuidance(input, intensity),
    objectiveGuidance: objectiveGuidance(input, intensity),
    ...patternInsight(input),
  };
}

function previousDaySentence(input: DailyOutlookInput): string {
  const previous = input.previousMetrics;
  if (!previous) return "";
  const entries: Array<{ label: string; delta: number }> = [
    { label: "Recovery", delta: dayDelta(input.recovery, previous.recovery) ?? Number.NaN },
    { label: "Readiness", delta: dayDelta(input.readiness, previous.readiness) ?? Number.NaN },
    { label: "Sharpness", delta: dayDelta(input.sharpness, previous.sharpness) ?? Number.NaN },
    { label: "Reasoning", delta: dayDelta(input.reasoningQuality, previous.reasoningQuality) ?? Number.NaN },
  ].filter((entry) => Number.isFinite(entry.delta));
  if (entries.length === 0) return "";

  const moved = entries
    .filter((entry) => Math.abs(entry.delta) >= 2)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);
  if (moved.length === 0) {
    return "Your scores are about the same as yesterday.";
  }
  const described = moved
    .map((entry) => `${entry.label} ${entry.delta > 0 ? "up" : "down"} ${Math.abs(entry.delta)}`)
    .join(" and ");
  return `Since yesterday: ${described}.`;
}

function coachSummary(
  stateInterpretation: string,
  input: DailyOutlookInput,
  intensity: DailyOutlookIntensity,
  nextMove: string,
): string {
  const basis = buildCoachBasis(input, intensity);
  return [
    stateInterpretation,
    previousDaySentence(input),
    basis.goalGuidance,
    basis.objectiveGuidance,
    healthContextSentence(input.healthSignals),
    basis.patternInsight,
    nextMove,
  ].filter(Boolean).join(" ");
}


function metricTone(value: number, supportiveAt = 60, limitingBelow = 45): DailyOutlookTone {
  if (value >= supportiveAt) return "support";
  if (value < limitingBelow) return "limit";
  return "neutral";
}

function ratioEvidence(
  code: "ATT" | "DFR" | "CAL",
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
  const estimateCap = input.recoveryEstimated ? 0.55 : 1;
  if (!input.canPersonalize) return Math.min(sourceCoverage * 0.65, estimateCap);
  const historyMaturity = input.rhythm
    ? clamp(input.rhythm.observedDays / 21, 0, 1)
    : 0;
  return Math.min(clamp(0.7 * sourceCoverage + 0.3 * historyMaturity, 0, 1), estimateCap);
}

function confidenceLabel(confidence: number): DailyOutlook["confidenceLabel"] {
  if (confidence >= 0.72) return "High";
  if (confidence >= 0.34) return "Medium";
  return "Baseline";
}

function dayDelta(current: number, previous: number | null | undefined): number | null {
  const prior = finite(previous ?? null);
  if (prior === null) return null;
  const delta = roundedScore(current) - roundedScore(prior);
  return Number.isFinite(delta) ? delta : null;
}

function metricDetail(current: number, previous: number | null | undefined): string {
  const delta = dayDelta(current, previous);
  if (delta === null) return `${roundedScore(current)} today`;
  if (delta === 0) return `${roundedScore(current)} today · flat vs yesterday`;
  return `${roundedScore(current)} today · ${delta > 0 ? "+" : ""}${delta} vs yesterday`;
}

function buildEvidence(input: DailyOutlookInput): DailyOutlookEvidence[] {
  const healthSignals = normalizeHealthSignals(input.healthSignals);
  const previous = input.previousMetrics ?? null;
  const evidence: DailyOutlookEvidence[] = [
    {
      code: "REC",
      label: "Recovery",
      detail: metricDetail(input.recovery, previous?.recovery),
      tone: metricTone(input.recovery, 60, 45),
    },
    {
      code: "RDY",
      label: "Readiness",
      detail: metricDetail(input.readiness, previous?.readiness),
      tone: metricTone(input.readiness, 65, 45),
    },
    {
      code: "SHP",
      label: "Sharpness",
      detail: metricDetail(input.sharpness, previous?.sharpness),
      tone: metricTone(input.sharpness, 65, 45),
    },
    {
      code: "RQ",
      label: "Reasoning",
      detail: metricDetail(input.reasoningQuality, previous?.reasoningQuality),
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

  const fragmentationRatio = finite(input.digitalFragmentationRatio);
  if (fragmentationRatio !== null) {
    evidence.push(ratioEvidence("DFR", "Digital fragmentation", fragmentationRatio));
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
  const digitalFragmentationRatio = finite(input.digitalFragmentationRatio);
  const scheduleLoadRatio = finite(input.scheduleLoadRatio);
  const confidence = calculateConfidence(input);
  const hasHistoricalPersonalization = Boolean(
    input.canPersonalize && (
      (input.rhythm?.observedDays ?? 0) > 0 ||
      (finite(input.behaviorContext?.cognitiveActivityDays7d) ?? 0) > 0
    ),
  );
  const shared = {
    policyVersion: DAILY_OUTLOOK_POLICY_VERSION,
    evidence: buildEvidence(input),
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel: confidenceLabel(confidence),
    personalization: hasHistoricalPersonalization ? "personal" as const : "state" as const,
    healthSignals: normalizeHealthSignals(input.healthSignals),
  };

  if (input.recovery < LOW_RECOVERY_THRESHOLD || input.readiness < 35) {
    const limitingReadiness = input.readiness < 35;
    const metricCode = limitingReadiness ? "RDY" : "REC";
    const metricLabel = limitingReadiness ? "Readiness" : "Recovery";
    const metricValue = limitingReadiness ? input.readiness : input.recovery;
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "protective"),
      verdict: {
        kind: "recover",
        label: "Recovery day",
        subline: "Take it easier. Postpone important decisions if you can.",
      },
      headline: "Take it easier today",
      summary: coachSummary(
        "Your recovery is low, so pushing harder is unlikely to help.",
        input,
        "protective",
        "Try a recovery session in Lab, then see how you feel.",
      ),
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "recover",
        label: "Start a recovery session in Lab",
        shortLabel: "Recovery session",
        kind: "lab",
        route: "/neuro-lab?tab=detox",
        metricCode,
        metricLabel,
        metricDetail: `${roundedScore(metricValue ?? 0)} today`,
      }),
    };
  }

  if (digitalFragmentationRatio !== null && digitalFragmentationRatio >= 1.35) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "protective"),
      verdict: {
        kind: "protect",
        label: "Protect your attention",
        subline: "You are switching often. Protect one block of focused work.",
      },
      headline: "Too many interruptions today",
      summary: coachSummary(
        "You are switching between apps more than usual, which can make it harder to stay focused.",
        input,
        "protective",
        "Try an attention reset in Lab before your next difficult task.",
      ),
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "protect_attention",
        label: "Open an attention reset in Lab",
        shortLabel: "Attention reset",
        kind: "lab",
        route: "/neuro-lab?tab=detox",
        metricCode: "DFR",
        metricLabel: "Digital fragmentation",
        metricDetail: `${Math.round((digitalFragmentationRatio - 1) * 100)}% above baseline`,
      }),
    };
  }

  if (attentionLoadRatio !== null && attentionLoadRatio >= 1.35) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "protective"),
      verdict: {
        kind: "protect",
        label: "Protect your attention",
        subline: "Screen activity is high. Reduce distractions before difficult work.",
      },
      headline: "Reduce distractions first",
      summary: coachSummary(
        "Your screen activity is higher than usual and may make it harder to focus.",
        input,
        "protective",
        "Try an attention reset in Lab before doing more demanding work.",
      ),
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
      coachBasis: buildCoachBasis(input, "protective"),
      verdict: {
        kind: "protect",
        label: "Keep the day lighter",
        subline: "Your schedule is busy and your energy is limited.",
      },
      headline: "Do less, but do it well",
      summary: coachSummary(
        "Your schedule is busier than usual, while your Readiness is not at its best.",
        input,
        "protective",
        "Focus on the essentials and skip extra training today.",
      ),
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "protect_capacity",
        label: "Focus on the essentials today",
        shortLabel: "Lighter day",
        kind: "guidance",
        route: null,
        metricCode: "RDY",
        metricLabel: "Readiness",
        metricDetail: `${roundedScore(input.readiness)} today`,
      }),
    };
  }

  if (
    input.readiness >= 65 &&
    input.recovery >= 65 &&
    input.sharpness >= 65
  ) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "strong"),
      verdict: {
        kind: "decide",
        label: "Good day for hard work",
        subline: "Your key scores are strong. Use that on what matters most.",
      },
      headline: "You are ready for hard work",
      summary: coachSummary(
        "Your main scores are strong enough for demanding work today.",
        input,
        "strong",
        "Start with your most important task while your energy is available.",
      ),
      intensity: "strong",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "use_capacity",
        label: "Start your most important task",
        shortLabel: "Start hard work",
        kind: "guidance",
        route: null,
        metricCode: "RDY",
        metricLabel: "Readiness",
        metricDetail: `${roundedScore(input.readiness)} today`,
      }),
    };
  }

  if (input.recovery >= 50 && input.sharpness < 50) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "steady"),
      verdict: {
        kind: "build",
        label: "Work on your focus",
        subline: "You have enough energy, but your Sharpness is low today.",
      },
      headline: "Focus needs work today",
      summary: coachSummary(
        "You have enough energy to train, but your focus is below its usual level.",
        input,
        "steady",
        "Try a focus drill in Lab.",
      ),
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "train_focus",
        label: "Start a focus drill in Lab",
        shortLabel: "Train sharpness",
        kind: "lab",
        route: "/neuro-lab?tab=games&system=fast",
        metricCode: "SHP",
        metricLabel: "Sharpness",
        metricDetail: `${roundedScore(input.sharpness)} today`,
      }),
    };
  }

  if (input.recovery >= 50 && input.reasoningQuality < 50) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "steady"),
      verdict: {
        kind: "build",
        label: "Work on your reasoning",
        subline: "You have enough energy, but your Reasoning is low today.",
      },
      headline: "Reasoning needs work today",
      summary: coachSummary(
        "You have enough energy to train, but your Reasoning score is below its usual level.",
        input,
        "steady",
        "Try a reasoning drill in Lab.",
      ),
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: action({
        key: "train_reasoning",
        label: "Start a reasoning drill in Lab",
        shortLabel: "Train reasoning",
        kind: "lab",
        route: "/neuro-lab?tab=games&system=slow",
        metricCode: "RQ",
        metricLabel: "Reasoning",
        metricDetail: `${roundedScore(input.reasoningQuality)} today`,
      }),
    };
  }

  if (input.readiness < 50) {
    return {
      ...shared,
      coachBasis: buildCoachBasis(input, "protective"),
      verdict: {
        kind: "protect",
        label: "Keep tasks short",
        subline: "Your Readiness is low. Avoid long, demanding sessions.",
      },
      headline: "Keep work sessions short",
      summary: coachSummary(
        "You may find it harder to stay effective during long tasks today.",
        input,
        "protective",
        "Skip extra training and break important work into shorter sessions.",
      ),
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: action({
        key: "protect_capacity",
        label: "Skip training and shorten work sessions",
        shortLabel: "Shorter sessions",
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
    coachBasis: buildCoachBasis(input, "steady"),
    verdict: {
      kind: "steady",
      label: "Steady day",
        subline: "Your scores are stable. Follow your normal plan.",
    },
      headline: "Follow your normal plan",
    summary: coachSummary(
        "Nothing in today’s data suggests you need to change your plans.",
      input,
      "steady",
        "Work at your usual pace today.",
    ),
    intensity: "steady",
    windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
    windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
    action: action({
      key: "normal_plan",
      label: "Follow your normal plan",
      shortLabel: "Normal plan",
      kind: "guidance",
      route: null,
      metricCode: "RDY",
      metricLabel: "Readiness",
      metricDetail: `${roundedScore(input.readiness)} today`,
    }),
  };
}
