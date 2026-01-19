/**
 * CAUSAL LEDGER — Results Screen
 * 
 * End screen following the Unified Game Feedback System.
 */

import { useMemo } from "react";
import { UnifiedGameResults, KPIData } from "../UnifiedGameResults";
import { ReviewMistake } from "../ReviewMistakesSheet";
import { RoundResult } from "./CausalLedgerDrill";
import { CAUSAL_LEDGER_CONFIG, DECISION_LABELS } from "./causalLedgerContent";

interface CausalLedgerResultsProps {
  results: RoundResult[];
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function CausalLedgerResults({
  results,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToLab,
}: CausalLedgerResultsProps) {
  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const totalRounds = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    
    // 1. Reasoning Accuracy
    const reasoningAccuracy = totalRounds > 0
      ? Math.round((correctCount / totalRounds) * 100)
      : 0;
    
    // 2. Inference Discipline
    // correct_underspecified_judgments / total_underspecified_rounds
    const underspecifiedRounds = results.filter(r => r.correctDecision === "underspecified");
    const correctUnderspecified = underspecifiedRounds.filter(r => r.isCorrect).length;
    const inferenceDiscipline = underspecifiedRounds.length > 0
      ? Math.round((correctUnderspecified / underspecifiedRounds.length) * 100)
      : 100;
    
    // 3. Deliberation Stability
    // 1 / std(decision_time_ms across rounds)
    const times = results.map(r => r.decisionTimeMs);
    const meanTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - meanTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize: lower std = more stable
    // Very stable: stdDev < 5000ms
    // Variable: stdDev > 15000ms
    let stabilityLabel: "Stable" | "Variable" | "Moderate";
    let stabilityTier: "high" | "medium" | "low";
    
    if (stdDev < 5000) {
      stabilityLabel = "Stable";
      stabilityTier = "high";
    } else if (stdDev > 15000) {
      stabilityLabel = "Variable";
      stabilityTier = "low";
    } else {
      stabilityLabel = "Moderate";
      stabilityTier = "medium";
    }
    
    return [
      {
        id: "reasoning-accuracy",
        label: "Accuracy",
        value: `${reasoningAccuracy}%`,
        sublabel: "reasoning",
        tier: reasoningAccuracy >= 75 ? "high" : reasoningAccuracy < 50 ? "low" : "medium",
      },
      {
        id: "inference-discipline",
        label: "Discipline",
        value: `${inferenceDiscipline}%`,
        sublabel: "inference",
        tier: inferenceDiscipline >= 75 ? "high" : inferenceDiscipline < 50 ? "low" : "medium",
      },
      {
        id: "deliberation-stability",
        label: "Stability",
        value: stabilityLabel,
        sublabel: "deliberation",
        tier: stabilityTier,
      },
    ];
  }, [results]);
  
  // Generate mistake cards for review
  const mistakes = useMemo((): ReviewMistake[] => {
    const errorRounds = results.filter(r => !r.isCorrect);
    
    // Prioritize Act II-III mistakes (more instructive)
    const sortedErrors = [...errorRounds].sort((a, b) => b.actIndex - a.actIndex);
    const selectedErrors = sortedErrors.slice(0, 4);
    
    return selectedErrors.map(r => {
      const options = (["supported", "underspecified", "flawed"] as const).map((d, idx) => ({
        id: `${r.roundIndex}-${idx}`,
        label: DECISION_LABELS[d].label,
        type: "text" as const,
      }));
      
      const userChoiceIndex = ["supported", "underspecified", "flawed"].indexOf(r.userDecision);
      const correctIndex = ["supported", "underspecified", "flawed"].indexOf(r.correctDecision);
      
      return {
        roundNumber: r.roundIndex + 1,
        isTimeout: false,
        options,
        userChoiceIndex,
        correctIndex,
        microLine: `"${r.claim.substring(0, 50)}..." — ${r.scenario.substring(0, 60)}...`,
        explanation: getExplanationForScenario(r.scenarioId),
      };
    });
  }, [results]);
  
  // Check for perfect session
  const isPerfect = results.every(r => r.isCorrect);
  
  return (
    <UnifiedGameResults
      gameName="Causal Ledger"
      difficulty="medium" // S2 games don't have difficulty selector
      roundsCompleted={results.length}
      totalRounds={CAUSAL_LEDGER_CONFIG.rounds}
      durationSeconds={durationSeconds}
      skill="CT"
      systemType="S2"
      xpAwarded={xpAwarded}
      kpis={kpis}
      isPerfect={isPerfect}
      mistakes={mistakes}
      onPlayAgain={onPlayAgain}
      onExit={onBackToLab}
    />
  );
}

// Helper to get explanation for review
function getExplanationForScenario(scenarioId: string): string {
  // This could be enhanced to pull from the content bank
  const explanations: Record<string, string> = {
    "a1-01": "The claim lacked control for alternative explanations.",
    "a1-02": "Classic confounding: both are caused by hot weather.",
    "a1-03": "Selection bias may explain the difference.",
    "a1-04": "Correlation with stable home environments confounds the result.",
    "a1-05": "Concurrent interventions cannot be ruled out.",
    "a1-06": "Reverse causation is a plausible alternative.",
    "a1-07": "Spurious correlation driven by national wealth.",
    "a1-08": "Self-reported measures may be biased.",
    "a2-01": "Proper RCT methodology supports the causal claim.",
    "a2-02": "Modest difference without proper controls.",
    "a2-03": "Systematic differences in lifestyle create confounds.",
    "a2-04": "Selection effect: chosen employees may differ.",
    "a2-05": "Randomization controls for confounders.",
    "a2-06": "Seasonal variation and Hawthorne effect possible.",
    "a2-07": "No control group to isolate the intervention.",
    "a2-08": "Mechanism unclear; variables not properly isolated.",
    "a3-01": "Large-scale RCT with verification supports causation.",
    "a3-02": "Needs comparison with control regions.",
    "a3-03": "Meta-analysis provides robust aggregated evidence.",
    "a3-04": "Long-term data needed for complete picture.",
    "a3-05": "Natural experiment with clear intervention point.",
    "a3-06": "Expectation effects may confound results.",
    "a3-07": "Educational advantages may independently contribute.",
    "a3-08": "Concurrent improvements make isolation difficult.",
  };
  
  return explanations[scenarioId] || "The claim required more careful evaluation of the evidence.";
}
