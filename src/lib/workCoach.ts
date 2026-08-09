export const WORK_COACH_POLICY_VERSION = "explainable-work-rules-v1";

export type PrimaryOutcome = "decide" | "focus" | "reason";
export type WorkActionKey = "focus_block" | "decision_block" | "analysis_block";
export type WorkIntensity = "protective" | "steady" | "strong";

export interface WorkRecommendationInput {
  primaryOutcome: PrimaryOutcome;
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  recoveryInitialized: boolean;
  hasWearableData: boolean;
}

export interface WorkRecommendation {
  actionKey: WorkActionKey;
  primaryOutcome: PrimaryOutcome;
  intensity: WorkIntensity;
  title: string;
  rationale: string;
  plannedDurationMinutes: number;
  objectivePrompt: string;
  evidenceLabel: string;
  confidenceLabel: "early signal" | "personal baseline" | "richer signal";
}

const ACTION_BY_OUTCOME: Record<PrimaryOutcome, WorkActionKey> = {
  decide: "decision_block",
  focus: "focus_block",
  reason: "analysis_block",
};

const STRONG_DURATION: Record<PrimaryOutcome, number> = {
  decide: 35,
  focus: 50,
  reason: 45,
};

const STEADY_DURATION: Record<PrimaryOutcome, number> = {
  decide: 30,
  focus: 40,
  reason: 40,
};

function boundedMetric(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getConfidenceLabel(input: WorkRecommendationInput): WorkRecommendation["confidenceLabel"] {
  if (input.hasWearableData) return "richer signal";
  if (input.recoveryInitialized) return "personal baseline";
  return "early signal";
}

function buildCopy(
  outcome: PrimaryOutcome,
  intensity: WorkIntensity,
): Pick<WorkRecommendation, "title" | "rationale" | "objectivePrompt"> {
  if (intensity === "protective") {
    if (outcome === "decide") {
      return {
        title: "Prepare the decision. Delay the irreversible part.",
        rationale: "Your current signals support framing options and gathering evidence better than forcing a final call.",
        objectivePrompt: "Define the decision, the alternatives and the missing evidence.",
      };
    }
    if (outcome === "reason") {
      return {
        title: "Structure the problem before solving it.",
        rationale: "Use a lighter block for evidence and assumptions. Save the hardest synthesis for a stronger window.",
        objectivePrompt: "Produce a clean map of evidence, assumptions and open questions.",
      };
    }
    return {
      title: "Protect one short, low-friction focus block.",
      rationale: "Keep the scope narrow and avoid multitasking. Finishing one useful unit is enough for this window.",
      objectivePrompt: "Choose one concrete deliverable that fits in a short block.",
    };
  }

  if (intensity === "strong") {
    if (outcome === "decide") {
      return {
        title: "Use this window for the decision that matters.",
        rationale: "Your recorded signals support deliberate work. Protect the block from messages and low-value input.",
        objectivePrompt: "Reach a decision or make the remaining uncertainty explicit.",
      };
    }
    if (outcome === "reason") {
      return {
        title: "Take on the hardest analytical block now.",
        rationale: "Reasoning and recovery signals support sustained synthesis. Work on the highest-leverage question first.",
        objectivePrompt: "Produce a defensible conclusion and its strongest counterargument.",
      };
    }
    return {
      title: "Protect a deep-work window now.",
      rationale: "Your current signals support sustained focus. Put the most valuable deliverable first and close everything else.",
      objectivePrompt: "Finish one high-value deliverable before reopening communication.",
    };
  }

  if (outcome === "decide") {
    return {
      title: "Use a bounded block to move one decision forward.",
      rationale: "Your signals are near their working range. Define the decision criteria before evaluating the options.",
      objectivePrompt: "End with a choice, a clear next test or a named blocker.",
    };
  }
  if (outcome === "reason") {
    return {
      title: "Run one focused analysis block.",
      rationale: "Your current state supports normal analytical work. Keep the question narrow enough to finish the reasoning loop.",
      objectivePrompt: "Answer one important question with evidence and assumptions visible.",
    };
  }
  return {
    title: "Follow your normal plan in one protected block.",
    rationale: "Your signals are near their usual range. A defined outcome will help LOOMA learn which conditions work for you.",
    objectivePrompt: "Choose one deliverable and finish it without switching contexts.",
  };
}

/**
 * Explainable v1 work policy. It is deterministic by design: the app first
 * needs trustworthy exposure and outcome data before an adaptive policy can be
 * validated in shadow mode.
 */
export function generateDailyWorkRecommendation(
  input: WorkRecommendationInput,
): WorkRecommendation {
  const sharpness = boundedMetric(input.sharpness);
  const readiness = boundedMetric(input.readiness);
  const recovery = boundedMetric(input.recovery);
  const reasoningQuality = boundedMetric(input.reasoningQuality);

  const protective = recovery < 35 || readiness < 42;
  const strong = !protective && readiness >= 72 && recovery >= 55 && sharpness >= 60;
  const intensity: WorkIntensity = protective ? "protective" : strong ? "strong" : "steady";
  const copy = buildCopy(input.primaryOutcome, intensity);
  const plannedDurationMinutes = intensity === "protective"
    ? 25
    : intensity === "strong"
      ? STRONG_DURATION[input.primaryOutcome]
      : STEADY_DURATION[input.primaryOutcome];

  return {
    actionKey: ACTION_BY_OUTCOME[input.primaryOutcome],
    primaryOutcome: input.primaryOutcome,
    intensity,
    plannedDurationMinutes,
    confidenceLabel: getConfidenceLabel(input),
    evidenceLabel: `Readiness ${Math.round(readiness)} · Recovery ${Math.round(recovery)} · Sharpness ${Math.round(sharpness)} · Reasoning ${Math.round(reasoningQuality)}`,
    ...copy,
  };
}

