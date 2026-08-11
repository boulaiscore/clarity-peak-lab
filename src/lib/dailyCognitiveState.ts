export interface DailyCognitiveStateInput {
  readiness: number;
  recovery: number;
  sharpness: number;
  reasoningQuality: number;
  healthScore?: number | null;
  attentionLoadRatio?: number | null;
  scheduleLoadRatio?: number | null;
}

export type CognitiveLoadLabel = "Learning" | "Light" | "Usual" | "Elevated" | "High";

export interface DailyCognitiveState {
  headline: string;
  summary: string;
  actionLabel: string;
  actionRoute: string;
  loadLabel: CognitiveLoadLabel;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function deriveLoadLabel(
  attentionLoadRatio: number | null,
  scheduleLoadRatio: number | null,
): CognitiveLoadLabel {
  const ratios = [attentionLoadRatio, scheduleLoadRatio].filter(
    (value): value is number => value !== null,
  );
  if (ratios.length === 0) return "Learning";

  const highestLoad = Math.max(...ratios);
  if (highestLoad >= 1.35) return "High";
  if (highestLoad >= 1.1) return "Elevated";
  if (highestLoad <= 0.75) return "Light";
  return "Usual";
}

/**
 * Turns the canonical daily metrics and privacy-safe passive aggregates into a
 * single, conservative recommendation. Ratios are always relative to the
 * person's own baseline; low scores never imply fixed ability.
 */
export function deriveDailyCognitiveState(input: DailyCognitiveStateInput): DailyCognitiveState {
  const healthScore = finite(input.healthScore);
  const attentionLoadRatio = finite(input.attentionLoadRatio);
  const scheduleLoadRatio = finite(input.scheduleLoadRatio);
  const loadLabel = deriveLoadLabel(attentionLoadRatio, scheduleLoadRatio);

  if (input.recovery < 35 || input.readiness < 40 || (healthScore !== null && healthScore < 40)) {
    return {
      headline: "Recovery first",
      summary: "Your available cognitive reserve is limited today.",
      actionLabel: "Recover in Lab",
      actionRoute: "/neuro-lab?tab=detox",
      loadLabel,
    };
  }

  if (attentionLoadRatio !== null && attentionLoadRatio >= 1.35) {
    return {
      headline: "Protect your attention",
      summary: "Digital load is above your personal baseline.",
      actionLabel: "Reduce load in Lab",
      actionRoute: "/neuro-lab?tab=detox",
      loadLabel,
    };
  }

  if (scheduleLoadRatio !== null && scheduleLoadRatio >= 1.35 && input.readiness < 65) {
    return {
      headline: "Keep effort measured",
      summary: "Schedule demand is above your usual level today.",
      actionLabel: "Choose recovery",
      actionRoute: "/neuro-lab?tab=detox",
      loadLabel,
    };
  }

  if (
    input.readiness >= 75 &&
    input.recovery >= 60 &&
    input.sharpness >= 65 &&
    (healthScore === null || healthScore >= 55)
  ) {
    return {
      headline: "Ready for demanding work",
      summary: "Recovery and cognitive signals are aligned.",
      actionLabel: "View trend",
      actionRoute: "/app/dashboard",
      loadLabel,
    };
  }

  if (input.recovery >= 55 && input.sharpness < 50) {
    return {
      headline: "Focus is trainable today",
      summary: "Sharpness is today's clearest improvement opportunity.",
      actionLabel: "Train focus in Lab",
      actionRoute: "/neuro-lab?tab=games",
      loadLabel,
    };
  }

  if (input.recovery >= 55 && input.reasoningQuality < 45) {
    return {
      headline: "Reasoning is trainable today",
      summary: "Deliberate thinking is today's best training opportunity.",
      actionLabel: "Train reasoning in Lab",
      actionRoute: "/neuro-lab?tab=games",
      loadLabel,
    };
  }

  if (input.readiness < 55) {
    return {
      headline: "Keep effort measured",
      summary: "Sustained work is better handled in shorter blocks today.",
      actionLabel: "Choose Quality Time",
      actionRoute: "/neuro-lab?tab=tasks",
      loadLabel,
    };
  }

  return {
    headline: "Steady capacity",
    summary: "Suitable for normal work with regular breaks.",
    actionLabel: "View trend",
    actionRoute: "/app/dashboard",
    loadLabel,
  };
}
