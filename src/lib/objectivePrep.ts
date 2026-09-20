/**
 * Turns a user objective (preset + date) into a preparation plan:
 * how far the event is, which phase the user is in, and the single move for today.
 * Purely deterministic — no AI, no network.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  findObjectivePreset,
  objectiveDisplayLabel,
  OBJECTIVE_FOCUS_LABEL,
  type ObjectiveFocus,
} from "@/config/objectives";

export type PrepPhase = "base" | "build" | "sharpen" | "taper" | "event" | "past";

export type PrepMoveKind = "train" | "recover" | "quality" | "hold";

export interface ObjectivePrepInput {
  kind: string | null | undefined;
  label: string | null | undefined;
  date: string | null | undefined;
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
}

export interface ObjectivePrepPlan {
  label: string;
  daysUntil: number | null;
  phase: PrepPhase;
  phaseLabel: string;
  phaseGuidance: string;
  focus: ObjectiveFocus;
  focusLabel: string;
  focusScore: number;
  demand: string;
  move: {
    kind: PrepMoveKind;
    label: string;
    detail: string;
    route: string | null;
  };
}

const LOW_RECOVERY = 40;
const LOW_READINESS = 45;

function scoreFor(focus: ObjectiveFocus, input: ObjectivePrepInput): number {
  switch (focus) {
    case "sharpness": return input.sharpness;
    case "reasoning": return input.reasoningQuality;
    case "readiness": return input.readiness;
    case "recovery": return input.recovery;
  }
}

function phaseFor(days: number | null): PrepPhase {
  if (days === null) return "base";
  if (days < 0) return "past";
  if (days === 0) return "event";
  if (days <= 2) return "taper";
  if (days <= 7) return "sharpen";
  if (days <= 21) return "build";
  return "base";
}

const PHASE_LABEL: Record<PrepPhase, string> = {
  base: "Build phase",
  build: "Build phase",
  sharpen: "Sharpen phase",
  taper: "Taper phase",
  event: "Event day",
  past: "Done",
};

function phaseGuidance(phase: PrepPhase, focusLabel: string): string {
  switch (phase) {
    case "base":
    case "build":
      return `Still far out. Train regularly and raise your ${focusLabel.toLowerCase()} while there is time.`;
    case "sharpen":
      return `Close now. Keep training short, protect sleep, and stop adding new load.`;
    case "taper":
      return "Almost there. No hard training, early nights, light days.";
    case "event":
      return "Today is the day. Nothing you add now helps; stay rested and calm.";
    case "past":
      return "That date has passed. Set a new one when you have it.";
  }
}

function trainRoute(focus: ObjectiveFocus): string {
  if (focus === "reasoning") return "/neuro-lab?tab=games&system=slow";
  if (focus === "sharpness") return "/neuro-lab?tab=games&system=fast";
  return "/neuro-lab?tab=detox";
}

function moveFor(
  phase: PrepPhase,
  focus: ObjectiveFocus,
  focusLabel: string,
  focusScore: number,
  input: ObjectivePrepInput,
): ObjectivePrepPlan["move"] {
  if (phase === "event") {
    return {
      kind: "hold",
      label: "Keep today easy",
      detail: "No training, no new load. Rest, eat and go in fresh.",
      route: null,
    };
  }

  if (phase === "taper") {
    if (input.recovery < 60) {
      return {
        kind: "recover",
        label: "Recover today",
        detail: `Recovery is ${Math.round(input.recovery)}. A recovery session now pays off on the day.`,
        route: "/neuro-lab?tab=detox",
      };
    }
    return {
      kind: "hold",
      label: "Hold what you have",
      detail: "You are in good shape. Sleep early and keep the load light.",
      route: null,
    };
  }

  if (input.recovery < LOW_RECOVERY || input.readiness < LOW_READINESS) {
    return {
      kind: "recover",
      label: "Recover today",
      detail: `Recovery ${Math.round(input.recovery)}, readiness ${Math.round(input.readiness)}. Training today would cost more than it gives.`,
      route: "/neuro-lab?tab=detox",
    };
  }

  if (focusScore < 60) {
    return {
      kind: "train",
      label: `Train ${focusLabel.toLowerCase()}`,
      detail: `${focusLabel} is ${Math.round(focusScore)}, below where you want it on the day. One short drill.`,
      route: trainRoute(focus),
    };
  }

  if (phase === "sharpen") {
    return {
      kind: "hold",
      label: "Keep it steady",
      detail: `${focusLabel} is ${Math.round(focusScore)}. Short drills only, protect sleep from here.`,
      route: null,
    };
  }

  return {
    kind: "quality",
    label: "Add quality time",
    detail: `${focusLabel} is ${Math.round(focusScore)}. Reading or listening keeps it building without fatigue.`,
    route: "/neuro-lab?tab=reason",
  };
}

export function buildObjectivePrep(
  input: ObjectivePrepInput,
  today: Date = new Date(),
): ObjectivePrepPlan | null {
  const preset = findObjectivePreset(input.kind);
  const label = objectiveDisplayLabel(input.kind, input.label);
  if (!preset || !label) return null;

  let daysUntil: number | null = null;
  if (input.date) {
    const parsed = parseISO(input.date);
    if (!Number.isNaN(parsed.getTime())) {
      daysUntil = differenceInCalendarDays(parsed, today);
    }
  }

  const phase = phaseFor(daysUntil);
  if (phase === "past") return null;

  const focus = preset.focus;
  const focusLabel = OBJECTIVE_FOCUS_LABEL[focus];
  const focusScore = scoreFor(focus, input);

  return {
    label,
    daysUntil,
    phase,
    phaseLabel: PHASE_LABEL[phase],
    phaseGuidance: phaseGuidance(phase, focusLabel),
    focus,
    focusLabel,
    focusScore,
    demand: preset.demand,
    move: moveFor(phase, focus, focusLabel, focusScore, input),
  };
}

export function countdownLabel(daysUntil: number | null): string {
  if (daysUntil === null) return "No date set";
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}
