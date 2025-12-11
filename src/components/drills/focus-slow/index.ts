import { SufficientAttention } from "./SufficientAttention";
import { ReversalTest } from "./ReversalTest";
import { MinimalAssumption } from "./MinimalAssumption";
import { NecessaryCondition } from "./NecessaryCondition";
import { ContradictionDetector } from "./ContradictionDetector";
import { EpistemicWeight } from "./EpistemicWeight";
import { CounterexamplePriority } from "./CounterexamplePriority";
import { PurposeAlignment } from "./PurposeAlignment";
import { AlternativeExplanation } from "./AlternativeExplanation";
import { InferentialLeverage } from "./InferentialLeverage";

export const FOCUS_SLOW_DRILLS = [
  { id: "sufficient_attention", component: SufficientAttention },
  { id: "reversal_test", component: ReversalTest },
  { id: "minimal_assumption", component: MinimalAssumption },
  { id: "necessary_condition", component: NecessaryCondition },
  { id: "contradiction_detector", component: ContradictionDetector },
  { id: "epistemic_weight", component: EpistemicWeight },
  { id: "counterexample_priority", component: CounterexamplePriority },
  { id: "purpose_alignment", component: PurposeAlignment },
  { id: "alternative_explanation", component: AlternativeExplanation },
  { id: "inferential_leverage", component: InferentialLeverage },
];

export {
  SufficientAttention,
  ReversalTest,
  MinimalAssumption,
  NecessaryCondition,
  ContradictionDetector,
  EpistemicWeight,
  CounterexamplePriority,
  PurposeAlignment,
  AlternativeExplanation,
  InferentialLeverage,
};
