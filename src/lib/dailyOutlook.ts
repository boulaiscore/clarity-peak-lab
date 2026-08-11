import { clamp } from "@/lib/cognitiveEngine";

export const DAILY_OUTLOOK_POLICY_VERSION = "daily-outlook-v1-explainable";

export type DailyOutlookActionKey =
  | "recover"
  | "protect_attention"
  | "focus_block"
  | "decision_block"
  | "analysis_block"
  | "train_focus"
  | "train_reasoning";

export type DailyOutlookTone = "support" | "limit" | "neutral";
export type DailyOutlookIntensity = "protective" | "steady" | "strong";

export interface DailyOutlookEvidence {
  code: "REC" | "RDY" | "SHP" | "RQ" | "HLT" | "ATT" | "CAL" | "PAT";
  label: string;
  detail: string;
  tone: DailyOutlookTone;
}

export interface DailyOutlookAction {
  key: DailyOutlookActionKey;
  label: string;
  shortLabel: string;
  durationMinutes: number;
  kind: "work" | "lab";
  route: string | null;
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
}

export interface DailyOutlookInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  healthScore?: number | null;
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

function workAction(
  outcome: DailyOutlookInput["primaryOutcome"],
  durationMinutes: number,
): DailyOutlookAction {
  if (outcome === "decide") {
    return {
      key: "decision_block",
      label: `Start a ${durationMinutes}-minute decision block`,
      shortLabel: "Decision block",
      durationMinutes,
      kind: "work",
      route: null,
    };
  }
  if (outcome === "reason") {
    return {
      key: "analysis_block",
      label: `Start a ${durationMinutes}-minute analysis block`,
      shortLabel: "Analysis block",
      durationMinutes,
      kind: "work",
      route: null,
    };
  }
  return {
    key: "focus_block",
    label: `Start a ${durationMinutes}-minute focus block`,
    shortLabel: "Focus block",
    durationMinutes,
    kind: "work",
    route: null,
  };
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

  return evidence
    .sort((a, b) => {
      const priority = { limit: 2, support: 1, neutral: 0 };
      return priority[b.tone] - priority[a.tone];
    })
    .slice(0, 4);
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
  };

  if (input.recovery < 35 || input.readiness < 40 || (healthScore !== null && healthScore < 40)) {
    return {
      ...shared,
      headline: "Restore before demanding work",
      summary: "Available reserve is limited. Keep the next block light and rebuild capacity first.",
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: {
        key: "recover",
        label: "Start a 10-minute recovery",
        shortLabel: "Recovery first",
        durationMinutes: 10,
        kind: "lab",
        route: "/neuro-lab?tab=detox",
      },
    };
  }

  if (attentionLoadRatio !== null && attentionLoadRatio >= 1.35) {
    return {
      ...shared,
      headline: "Protect your attention",
      summary: "Digital load is above your personal baseline. Reset before stacking more demanding work.",
      intensity: "protective",
      windowLabel: null,
      windowSource: null,
      action: {
        key: "protect_attention",
        label: "Start a 15-minute detox",
        shortLabel: "Reduce digital load",
        durationMinutes: 15,
        kind: "lab",
        route: "/neuro-lab?tab=detox",
      },
    };
  }

  if (scheduleLoadRatio !== null && scheduleLoadRatio >= 1.35 && input.readiness < 65) {
    return {
      ...shared,
      headline: "Use a shorter work block",
      summary: "Schedule demand is high relative to your baseline, while sustained capacity is moderate.",
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: workAction(input.primaryOutcome, 25),
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
      headline: "Use your strongest window",
      summary: "Recovery, sharpness and sustained capacity are aligned for demanding work.",
      intensity: "strong",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? "Next available block" : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : input.canPersonalize ? "next_available" : null,
      action: workAction(input.primaryOutcome, 75),
    };
  }

  if (input.recovery >= 55 && input.sharpness < 50) {
    return {
      ...shared,
      headline: "Sharpness is today's opportunity",
      summary: "Recovery can support a brief focus stimulus before your next work block.",
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: {
        key: "train_focus",
        label: "Train focus for 7 minutes",
        shortLabel: "Train sharpness",
        durationMinutes: 7,
        kind: "lab",
        route: "/neuro-lab?tab=games",
      },
    };
  }

  if (input.recovery >= 55 && input.reasoningQuality < 45) {
    return {
      ...shared,
      headline: "Reasoning is today's opportunity",
      summary: "A short deliberate-thinking stimulus fits your current reserve.",
      intensity: "steady",
      windowLabel: null,
      windowSource: null,
      action: {
        key: "train_reasoning",
        label: "Train reasoning for 7 minutes",
        shortLabel: "Train reasoning",
        durationMinutes: 7,
        kind: "lab",
        route: "/neuro-lab?tab=games",
      },
    };
  }

  if (input.readiness < 55) {
    return {
      ...shared,
      headline: "Keep effort measured",
      summary: "Sustained capacity is moderate. Use a short block and stop before quality falls.",
      intensity: "protective",
      windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? null : null,
      windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : null,
      action: workAction(input.primaryOutcome, 25),
    };
  }

  return {
    ...shared,
    headline: "Steady capacity",
    summary: "Conditions support normal work with a deliberate break after the next block.",
    intensity: "steady",
    windowLabel: input.canPersonalize ? input.rhythm?.openWindow ?? "Next available block" : null,
    windowSource: input.canPersonalize && input.rhythm?.openWindow ? "calendar" : input.canPersonalize ? "next_available" : null,
    action: workAction(input.primaryOutcome, 50),
  };
}
