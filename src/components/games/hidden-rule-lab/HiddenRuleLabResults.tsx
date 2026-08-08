import { useMemo } from "react";
import { UnifiedGameResults, type KPIData } from "@/components/games/UnifiedGameResults";
import type { ReviewMistake } from "@/components/games/ReviewMistakesSheet";
import { useGameInsight } from "@/hooks/useGameInsight";
import type { RoundResult, SessionMetrics } from "./HiddenRuleLabDrill";
import type { Difficulty } from "./hiddenRuleLabContent";

interface HiddenRuleLabResultsProps {
  results: RoundResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  hasCleanLock: boolean;
  qualityLine?: string;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function HiddenRuleLabResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  hasCleanLock,
  qualityLine,
  onPlayAgain,
  onBackToLab,
}: HiddenRuleLabResultsProps) {
  const kpis: KPIData[] = [
    metricKpi("rule", "Rule lock", metrics.ruleIdAcc),
    metricKpi("test", "Test quality", metrics.testQualityScore),
    metricKpi("transfer", "Transfer", metrics.generalizationAcc),
  ];
  const mistakes = useMemo<ReviewMistake[]>(() => {
    const applyMistakes = results
      .filter(result => result.roundType === "apply" && !result.isCorrect && result.outputCorrect)
      .map(result => ({
        roundNumber: result.roundIndex + 1,
        isTimeout: false,
        options: [
          { id: "chosen", label: result.userPrediction?.label ?? "No prediction", type: "text" as const },
          { id: "correct", label: result.outputCorrect!.label, type: "text" as const },
        ],
        userChoiceIndex: 0,
        correctIndex: 1,
        microLine: "Apply the locked rule consistently to the new case.",
      }));
    const weakTests = results
      .filter(result => result.roundType === "test" && (result.chosenTestInfoGain ?? 0) < 40 && result.testOptions?.length)
      .map(result => {
        const options = result.testOptions!;
        const correctIndex = options.reduce((best, option, index) => option.infoGainScore > options[best].infoGainScore ? index : best, 0);
        return {
          roundNumber: result.roundIndex + 1,
          isTimeout: false,
          options: options.map((option, index) => ({ id: option.id, label: `Test ${index + 1} · ${option.infoGainScore}`, type: "text" as const })),
          userChoiceIndex: options.findIndex(option => option.id === result.chosenTestId),
          correctIndex,
          microLine: "Prefer the test that best separates the remaining hypotheses.",
        };
      });
    return [...applyMistakes, ...weakTests].slice(0, 5);
  }, [results]);
  const insight = useGameInsight({
    gameType: "S2-IN",
    skill: "IN",
    currentScore: metrics.sessionScore,
    xpAwarded,
  });

  return (
    <UnifiedGameResults
      gameName="Hidden Rule Lab"
      difficulty={difficulty}
      roundsCompleted={results.length}
      totalRounds={results.length}
      durationSeconds={durationSeconds}
      skill="IN"
      systemType="S2"
      xpAwarded={xpAwarded}
      kpis={kpis}
      isPerfect={hasCleanLock && metrics.sessionScore >= 90}
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
