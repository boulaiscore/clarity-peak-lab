/**
 * ============================================
 * CONSTELLATION SNAP – RESULTS SCREEN v2.0
 * ============================================
 * 
 * Uses UnifiedGameResults following Global Game Feedback Spec.
 */

import { UnifiedGameResults, KPIData, ReviewMistake } from "@/components/games";

export interface ConstellationSnapResultsProps {
  sessionScore: number; // 0-100
  accuracy: number; // % correct
  remoteAccuracy: number; // % correct on remote rounds
  medianReactionTime: number; // ms
  xpAwarded: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  roundsCompleted: number;
  totalRounds: number;
  durationSeconds: number;
  mistakes?: ReviewMistake[];
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ConstellationSnapResults({
  sessionScore,
  accuracy,
  remoteAccuracy,
  medianReactionTime,
  xpAwarded,
  isPerfect,
  difficulty,
  roundsCompleted,
  totalRounds,
  durationSeconds,
  mistakes = [],
  onPlayAgain,
  onExit,
}: ConstellationSnapResultsProps) {
  // Speed interpretation (relative labels, not thresholds)
  const getSpeedTier = (): "low" | "medium" | "high" => {
    const thresholds = {
      easy: { fast: 500, medium: 700 },
      medium: { fast: 400, medium: 600 },
      hard: { fast: 350, medium: 500 },
    };
    const t = thresholds[difficulty];
    if (medianReactionTime <= t.fast) return "high";
    if (medianReactionTime <= t.medium) return "medium";
    return "low";
  };
  
  const getSpeedLabel = () => {
    const tier = getSpeedTier();
    if (tier === "high") return "Fast";
    if (tier === "medium") return "Medium";
    return "Steady";
  };

  // Build KPIs for Rapid Association (RA)
  // RA KPIs: Association Speed, Novelty Ratio (remote accuracy), Flexibility Index
  const kpis: KPIData[] = [
    {
      id: "accuracy",
      label: "Accuracy",
      value: `${Math.round(accuracy)}%`,
      tier: accuracy >= 80 ? "high" : accuracy >= 60 ? "medium" : "low",
    },
    {
      id: "speed",
      label: "Speed",
      value: getSpeedLabel(),
      sublabel: `${medianReactionTime}ms`,
      tier: getSpeedTier(),
    },
    {
      id: "remote-links",
      label: "Remote Links",
      value: `${Math.round(remoteAccuracy)}%`,
      tier: remoteAccuracy >= 70 ? "high" : remoteAccuracy >= 50 ? "medium" : "low",
    },
  ];

  return (
    <UnifiedGameResults
      gameName="Constellation Snap"
      difficulty={difficulty}
      roundsCompleted={roundsCompleted}
      totalRounds={totalRounds}
      durationSeconds={durationSeconds}
      skill="RA"
      systemType="S1"
      xpAwarded={xpAwarded}
      kpis={kpis}
      isPerfect={isPerfect}
      mistakes={mistakes}
      onPlayAgain={onPlayAgain}
      onExit={onExit}
    />
  );
}
