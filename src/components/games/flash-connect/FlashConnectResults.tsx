/**
 * ============================================
 * FLASH CONNECT – RESULTS SCREEN v2.0
 * ============================================
 * 
 * Uses UnifiedGameResults following Global Game Feedback Spec.
 */

import { UnifiedGameResults, KPIData, ReviewMistake } from "@/components/games";
import { useGameInsight } from "@/hooks/useGameInsight";

export interface FlashConnectResultsProps {
  connectionRate: number; // % correct
  farLinkHitRate: number | null; // % correct on hard rounds only
  medianReactionTime: number; // ms
  xpAwarded: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  roundsCompleted: number;
  totalRounds: number;
  durationSeconds: number;
  mistakes?: ReviewMistake[];
  onContinue: () => void;
  onPlayAgain?: () => void;
}

export function FlashConnectResults({
  connectionRate,
  farLinkHitRate,
  medianReactionTime,
  xpAwarded,
  isPerfect,
  difficulty,
  roundsCompleted,
  totalRounds,
  durationSeconds,
  mistakes = [],
  onContinue,
  onPlayAgain,
}: FlashConnectResultsProps) {
  // Speed tier (relative labels)
  const getSpeedTier = (): "low" | "medium" | "high" => {
    if (medianReactionTime <= 1500) return "high";
    if (medianReactionTime <= 2500) return "medium";
    return "low";
  };
  
  const getSpeedLabel = () => {
    const tier = getSpeedTier();
    if (tier === "high") return "Fast";
    if (tier === "medium") return "Medium";
    return "Steady";
  };

  // Build KPIs for Rapid Association (RA)
  const kpis: KPIData[] = [
    {
      id: "connection-rate",
      label: "Accuracy",
      value: `${Math.round(connectionRate)}%`,
      tier: connectionRate >= 80 ? "high" : connectionRate >= 60 ? "medium" : "low",
    },
    {
      id: "speed",
      label: "Speed",
      value: getSpeedLabel(),
      sublabel: `${medianReactionTime}ms`,
      tier: getSpeedTier(),
    },
  ];
  
  // Add far-link rate for hard difficulty
  if (difficulty === "hard" && farLinkHitRate !== null) {
    kpis.push({
      id: "far-link",
      label: "Far-Links",
      value: `${Math.round(farLinkHitRate)}%`,
      tier: farLinkHitRate >= 70 ? "high" : farLinkHitRate >= 50 ? "medium" : "low",
    });
  }

  const insight = useGameInsight({ gameType: "S1-RA", skill: "RA", currentScore: Math.round(connectionRate), xpAwarded });

  return (
    <UnifiedGameResults
      gameName="Flash Connect"
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
      insight={insight}
      onPlayAgain={onPlayAgain || onContinue}
      onExit={onContinue}
    />
  );
}
