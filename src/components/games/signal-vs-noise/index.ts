/**
 * Signal vs Noise - S2 Insight Game
 * 
 * Trains pattern detection and causal inference
 * under uncertainty with executive-style data.
 */

export { SignalVsNoiseDrill } from "./SignalVsNoiseDrill";
export { SignalVsNoiseResults } from "./SignalVsNoiseResults";
export type { CaseResult, SessionMetrics } from "./SignalVsNoiseDrill";
export { 
  generateSession, 
  getAllCases,
  DIFFICULTY_CONFIG,
  XP_BASE,
  type Difficulty,
  type SignalCase,
} from "./signalVsNoiseContent";
