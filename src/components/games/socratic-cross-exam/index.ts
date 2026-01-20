/**
 * Socratic Cross-Exam — Game exports
 */

export { SocraticCrossExamDrill } from "./SocraticCrossExamDrill";
export { SocraticCrossExamResults } from "./SocraticCrossExamResults";
export { 
  generateSocraticSession, 
  SOCRATIC_CONFIG,
  type SocraticRound,
  type SocraticAssumption,
  type ContradictionPair,
} from "./socraticCrossExamContent";

export interface SocraticRoundResult {
  roundIndex: number;
  roundId: string;
  claim: string;
  
  // Assumption selection
  selectedAssumptions: [string, string];
  correctAssumptions: [string, string];
  assumptionScore: number; // 0, 60, or 100
  
  // Cross-exam question
  crossExamCorrect: boolean;
  selectedCrossExamOption: number;
  correctCrossExamOption: number;
  
  // Contradiction pair
  selectedContradictionId: string;
  minimalPairId: string;
  contradictionScore: number; // 0, 50, or 100
  
  // Aggregates
  roundScore: number;
}
