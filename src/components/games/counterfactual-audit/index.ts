/**
 * COUNTERFACTUAL AUDIT — Module Exports
 * 
 * S2-CT (Critical Thinking) training game.
 * Trains counterfactual reasoning and evidence discipline.
 */

export { CounterfactualAuditDrill } from "./CounterfactualAuditDrill";
export type { RoundResult, SessionMetrics } from "./CounterfactualAuditDrill";

export { CounterfactualAuditResults } from "./CounterfactualAuditResults";

export { 
  generateSession,
  getAllRounds,
  DIFFICULTY_CONFIG,
  XP_BASE,
} from "./counterfactualAuditContent";
export type { 
  Difficulty,
  AuditRound,
  AuditOption,
  OptionClass,
} from "./counterfactualAuditContent";
