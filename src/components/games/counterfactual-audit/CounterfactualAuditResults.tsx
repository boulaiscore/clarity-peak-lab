import { useMemo } from "react";
import { UnifiedGameResults, type KPIData } from "@/components/games/UnifiedGameResults";
import type { ReviewMistake } from "@/components/games/ReviewMistakesSheet";
import { useGameInsight } from "@/hooks/useGameInsight";
import type { RoundResult, SessionMetrics } from "./CounterfactualAuditDrill";
import type { Difficulty } from "./counterfactualAuditContent";

interface CounterfactualAuditResultsProps {
  results: RoundResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function CounterfactualAuditResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToLab,
}: CounterfactualAuditResultsProps) {
  const kpis: KPIData[] = [
    metricKpi("accuracy", "Accuracy", metrics.accuracyPct),
    metricKpi("discipline", "Discipline", metrics.evidenceDisciplineScore),
    metricKpi("calibration", "Calibration", metrics.calibrationScore),
  ];
  const mistakes = useMemo<ReviewMistake[]>(() => results
    .filter(result => !result.isCorrect)
    .sort((a, b) => Number(b.confidencePct >= 70) - Number(a.confidencePct >= 70))
    .slice(0, 5)
    .map(result => ({
      roundNumber: result.roundIndex + 1,
      isTimeout: result.timeoutFlag,
      options: result.options.map(option => ({ id: option.id, label: option.text, type: "text" as const })),
      userChoiceIndex: result.timeoutFlag ? null : result.options.findIndex(option => option.id === result.chosenOptionId),
      correctIndex: result.options.findIndex(option => option.id === result.correctOptionId),
      microLine: result.timeoutFlag
        ? "Time expired before the evidence was calibrated."
        : "The best flip changes the core mechanism, not a proxy.",
    })), [results]);
  const insight = useGameInsight({
    gameType: "S2-CT",
    skill: "CT",
    currentScore: metrics.sessionScore,
    xpAwarded,
  });

  return (
    <UnifiedGameResults
      gameName="Counterfactual Audit"
      difficulty={normalizeDifficulty(difficulty)}
      roundsCompleted={results.length}
      totalRounds={results.length}
      durationSeconds={durationSeconds}
      skill="CT"
      systemType="S2"
      xpAwarded={xpAwarded}
      kpis={kpis}
      isPerfect={metrics.sessionScore >= 90}
      mistakes={mistakes}
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
