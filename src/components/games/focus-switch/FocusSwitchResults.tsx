import { UnifiedGameResults, type KPIData } from "@/components/games/UnifiedGameResults";
import { useGameInsight } from "@/hooks/useGameInsight";
import type { FocusSwitchFinalResults } from "./FocusSwitchDrill";
import type { ReviewMistake } from "@/components/games/ReviewMistakesSheet";

interface FocusSwitchResultsProps {
  results: FocusSwitchFinalResults;
  onContinue: () => void;
}

export function FocusSwitchResults({ results, onContinue }: FocusSwitchResultsProps) {
  const focusScore = Math.round((1 - results.perseverationRate) * 100);
  const recoveryScore = Math.round(results.recoverySpeedIndex * 100);
  const kpis: KPIData[] = [
    {
      id: "switch-speed",
      label: "Switch",
      value: `${Math.round(results.switchLatencyAvg)}ms`,
      tier: results.switchLatencyAvg <= 500 ? "high" : results.switchLatencyAvg <= 900 ? "medium" : "low",
    },
    {
      id: "focus-lock",
      label: "Focus",
      value: `${focusScore}%`,
      tier: tier(focusScore),
    },
    {
      id: "recovery",
      label: "Recovery",
      value: `${recoveryScore}%`,
      tier: tier(recoveryScore),
    },
  ];
  const reviewSignals = [
    {
      label: "Target capture",
      observed: `${Math.round(results.hitRate * 100)}%`,
      reference: "90%+ reference",
      missesReference: results.hitRate < 0.9,
      note: "Missed targets reduce the attention signal even when false taps stay low.",
    },
    {
      label: "False alarms",
      observed: `${Math.round(results.falseAlarmRate * 100)}%`,
      reference: "10% or less",
      missesReference: results.falseAlarmRate > 0.1,
      note: "Wait for the active rule before committing to a tap.",
    },
    {
      label: "Switch latency",
      observed: `${Math.round(results.switchLatencyAvg)}ms`,
      reference: "500ms or less",
      missesReference: results.switchLatencyAvg > 500,
      note: "Re-anchor on the highlighted lane immediately after each switch.",
    },
    {
      label: "Rule carry-over",
      observed: `${Math.round(results.perseverationRate * 100)}%`,
      reference: "Below 10%",
      missesReference: results.perseverationRate >= 0.1,
      note: "Release the previous rule before responding to the new active lane.",
    },
  ];
  const mistakes: ReviewMistake[] = reviewSignals
    .filter(signal => signal.missesReference)
    .map((signal, index) => ({
      roundNumber: index + 1,
      segmentLabel: signal.label,
      isTimeout: false,
      options: [
        { id: `${index}-observed`, label: signal.observed, type: "text" },
        { id: `${index}-reference`, label: signal.reference, type: "text" },
      ],
      userChoiceIndex: 0,
      correctIndex: 1,
      microLine: signal.note,
    }));
  const insight = useGameInsight({
    gameType: "S1-AE",
    skill: "AE",
    currentScore: results.score,
    xpAwarded: results.xpAwarded,
  });

  return (
    <UnifiedGameResults
      gameName="Focus Switch"
      difficulty={results.difficulty}
      roundsCompleted={3}
      totalRounds={3}
      durationSeconds={70}
      skill="AE"
      systemType="S1"
      xpAwarded={results.xpAwarded}
      kpis={kpis}
      isPerfect={results.isPerfect}
      mistakes={mistakes}
      reviewMode="performance"
      qualityLine={results.xpAwarded > 0 ? results.qualityLine : undefined}
      insight={insight}
      onExit={onContinue}
    />
  );
}

function tier(value: number): "low" | "medium" | "high" {
  if (value >= 80) return "high";
  if (value >= 60) return "medium";
  return "low";
}
