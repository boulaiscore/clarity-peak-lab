/**
 * Preset objectives a user can prepare for.
 * Each preset declares which cognitive metric matters most on the day,
 * so the daily verdict and the coach know what to protect as the date gets closer.
 */
export type ObjectiveFocus = "sharpness" | "reasoning" | "readiness" | "recovery";

export interface ObjectivePreset {
  value: string;
  label: string;
  /** Shown under the option in the profile. */
  description: string;
  focus: ObjectiveFocus;
  /** Plain-language name of what the day demands, used inside generated copy. */
  demand: string;
}

export const OBJECTIVE_FOCUS_LABEL: Record<ObjectiveFocus, string> = {
  sharpness: "Sharpness",
  reasoning: "Reasoning",
  readiness: "Readiness",
  recovery: "Recovery",
};

export const OBJECTIVE_PRESETS: ObjectivePreset[] = [
  {
    value: "interview",
    label: "Job interview",
    description: "Consulting, finance, tech or any final round.",
    focus: "sharpness",
    demand: "thinking fast under pressure",
  },
  {
    value: "case_interview",
    label: "Case or technical round",
    description: "Structured problem solving in front of someone.",
    focus: "reasoning",
    demand: "structured reasoning out loud",
  },
  {
    value: "exam",
    label: "Exam or test",
    description: "GMAT, GRE, university or certification exam.",
    focus: "sharpness",
    demand: "hours of sustained attention",
  },
  {
    value: "presentation",
    label: "Presentation or pitch",
    description: "Board meeting, investor pitch, keynote.",
    focus: "readiness",
    demand: "being clear and composed on stage",
  },
  {
    value: "negotiation",
    label: "Negotiation or big decision",
    description: "A conversation where judgement matters.",
    focus: "reasoning",
    demand: "clear judgement under pressure",
  },
  {
    value: "deadline",
    label: "Deadline or heavy week",
    description: "A period of high output rather than one moment.",
    focus: "readiness",
    demand: "holding output for several days",
  },
  {
    value: "competition",
    label: "Competition or event",
    description: "A race, a match, a performance.",
    focus: "recovery",
    demand: "arriving physically fresh",
  },
  {
    value: "other",
    label: "Something else",
    description: "Name it yourself.",
    focus: "readiness",
    demand: "performing at your best",
  },
];

export function findObjectivePreset(kind: string | null | undefined): ObjectivePreset | null {
  if (!kind) return null;
  return OBJECTIVE_PRESETS.find((preset) => preset.value === kind) ?? null;
}

/** The name shown to the user: the custom label when given, otherwise the preset name. */
export function objectiveDisplayLabel(
  kind: string | null | undefined,
  customLabel: string | null | undefined,
): string {
  const custom = typeof customLabel === "string" ? customLabel.trim() : "";
  if (custom) return custom;
  return findObjectivePreset(kind)?.label ?? "";
}
