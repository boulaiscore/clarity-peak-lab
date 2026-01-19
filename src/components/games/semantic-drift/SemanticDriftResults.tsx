/**
 * SEMANTIC DRIFT — Results Screen
 * 
 * End screen following the Unified Game Feedback System.
 */

import { useMemo } from "react";
import { UnifiedGameResults, KPIData } from "../UnifiedGameResults";
import { ReviewMistake } from "../ReviewMistakesSheet";
import { RoundResult } from "./SemanticDriftDrill";
import { DIFFICULTY_CONFIG } from "./semanticDriftContent";

interface SemanticDriftResultsProps {
  results: RoundResult[];
  difficulty: "easy" | "medium" | "hard";
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToGym: () => void;
}

export function SemanticDriftResults({
  results,
  difficulty,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToGym,
}: SemanticDriftResultsProps) {
  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const validResponses = results.filter(r => !r.timeoutFlag && r.reactionTimeMs !== null);
    const reactionTimes = validResponses.map(r => r.reactionTimeMs!);
    
    // 1. Association Speed - median reaction time
    const sortedTimes = [...reactionTimes].sort((a, b) => a - b);
    const medianRT = sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0;
    
    // 2. Drift Accuracy - % of directional choices
    const directionalCount = results.filter(r => r.chosenTag === "directional").length;
    const driftAccuracy = results.length > 0
      ? Math.round((directionalCount / results.length) * 100)
      : 0;
    
    // 3. Flexibility Index
    const nonLiteralCorrect = results.filter(
      r => r.chosenTag === "directional" && !r.timeoutFlag
    ).length;
    const literalTraps = results.filter(r => r.chosenTag === "literal").length;
    const remoteErrors = results.filter(r => r.chosenTag === "remote").length;
    
    const flexibilityRaw = results.length > 0
      ? ((nonLiteralCorrect * 2 - literalTraps - remoteErrors * 0.5) / results.length) * 50 + 50
      : 50;
    const flexibilityIndex = Math.max(0, Math.min(100, Math.round(flexibilityRaw)));
    
    return [
      {
        id: "speed",
        label: "Speed",
        value: `${medianRT}ms`,
        sublabel: "median RT",
        tier: medianRT < 1200 ? "high" : medianRT > 2000 ? "low" : "medium",
      },
      {
        id: "accuracy",
        label: "Accuracy",
        value: `${driftAccuracy}%`,
        sublabel: "drift accuracy",
        tier: driftAccuracy >= 75 ? "high" : driftAccuracy < 50 ? "low" : "medium",
      },
      {
        id: "flexibility",
        label: "Flexibility",
        value: `${flexibilityIndex}`,
        sublabel: "index",
        tier: flexibilityIndex >= 70 ? "high" : flexibilityIndex < 40 ? "low" : "medium",
      },
    ];
  }, [results]);
  
  // Generate mistake cards for review
  const mistakes = useMemo((): ReviewMistake[] => {
    const errorRounds = results.filter(
      r => r.timeoutFlag || r.chosenTag !== "directional"
    );
    
    const timeouts = errorRounds.filter(r => r.timeoutFlag).slice(0, 2);
    const wrongChoices = errorRounds
      .filter(r => !r.timeoutFlag)
      .slice(0, 5 - timeouts.length);
    
    const selectedErrors = [...timeouts, ...wrongChoices].slice(0, 5);
    
    return selectedErrors.map(r => {
      const userChoiceIndex = r.chosenOption 
        ? r.options.findIndex(o => o.word === r.chosenOption)
        : null;
      const correctIndex = r.options.findIndex(o => o.word === r.correctOption);
      
      return {
        roundNumber: r.roundIndex + 1,
        isTimeout: r.timeoutFlag,
        options: r.options.map((o, idx) => ({
          id: `${r.roundIndex}-${idx}`,
          label: o.word,
          type: "text" as const,
        })),
        userChoiceIndex,
        correctIndex,
        microLine: r.timeoutFlag
          ? `Time ran out. The stronger continuation was "${r.correctOption}".`
          : `The stronger continuation here was "${r.correctOption}".`,
      };
    });
  }, [results]);
  
  const config = DIFFICULTY_CONFIG[difficulty];
  
  return (
    <UnifiedGameResults
      gameName="Semantic Drift"
      difficulty={difficulty}
      roundsCompleted={results.length}
      totalRounds={config.rounds}
      durationSeconds={durationSeconds}
      skill="RA"
      systemType="S1"
      xpAwarded={xpAwarded}
      kpis={kpis}
      mistakes={mistakes}
      onPlayAgain={onPlayAgain}
      onExit={onBackToGym}
    />
  );
}
