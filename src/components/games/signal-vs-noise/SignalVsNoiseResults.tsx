import { useMemo } from "react";
import { UnifiedGameResults, type KPIData } from "@/components/games/UnifiedGameResults";
import type { ReviewMistake } from "@/components/games/ReviewMistakesSheet";
import { useGameInsight } from "@/hooks/useGameInsight";
import type { CaseResult, SessionMetrics } from "./SignalVsNoiseDrill";
import type { Difficulty } from "./signalVsNoiseContent";

interface SignalVsNoiseResultsProps {
  results: CaseResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  qualityLine?: string;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function SignalVsNoiseResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  qualityLine,
  onPlayAgain,
  onBackToLab,
}: SignalVsNoiseResultsProps) {
  const kpis: KPIData[] = [
    metricKpi("signal", "Signal", metrics.signalDetectionPct),
    metricKpi("explanation", "Explanation", metrics.explanationQualityScore),
    metricKpi("robustness", "Robustness", metrics.robustnessThinkingScore),
  ];
  const mistakes = useMemo<ReviewMistake[]>(() => results
    .filter(result => !result.isDriverCorrect)
    .sort((a, b) => b.confidencePct - a.confidencePct)
    .slice(0, 5)
    .map(result => {
      const keys = ["A", "B", "C"] as const;
      return {
        roundNumber: result.caseIndex,
        isTimeout: result.timeoutFlag,
        options: keys.map(key => ({ id: key, label: result.drivers[key].label, type: "text" as const })),
        userChoiceIndex: result.chosenDriver ? keys.indexOf(result.chosenDriver) : null,
        correctIndex: keys.indexOf(result.correctDriver),
        microLine: result.insightCue,
      };
    }), [results]);
  const insight = useGameInsight({
    gameType: "S2-IN",
    skill: "IN",
    currentScore: metrics.sessionScore,
    xpAwarded,
  });

  return (
    <UnifiedGameResults
      gameName="Signal vs Noise"
      difficulty={normalizeDifficulty(difficulty)}
      roundsCompleted={results.length}
      totalRounds={results.length}
      durationSeconds={durationSeconds}
      skill="IN"
      systemType="S2"
      xpAwarded={xpAwarded}
      kpis={kpis}
      isPerfect={metrics.sessionScore >= 90}
      mistakes={mistakes}
      qualityLine={xpAwarded > 0 ? qualityLine : undefined}
      insight={insight}
      onPlayAgain={onPlayAgain}
      onExit={onBackToLab}
    />
  );
}

function metricKpi(id: string, label: string, value: number): KPIData {
  return {
    id,
    label,
    value: `${Math.round(value)}%`,
    tier: value >= 80 ? "high" : value >= 55 ? "medium" : "low",
  };
}

function normalizeDifficulty(difficulty: Difficulty): "easy" | "medium" | "hard" {
  return difficulty === "standard" ? "medium" : difficulty;
}
