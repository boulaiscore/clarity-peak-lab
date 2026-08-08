import { UnifiedGameResults, type KPIData } from "@/components/games/UnifiedGameResults";
import { useGameInsight } from "@/hooks/useGameInsight";
import type { OrbitLockFinalResults } from "./OrbitLockDrill";
import type { ReviewMistake } from "@/components/games/ReviewMistakesSheet";

interface OrbitLockResultsProps {
  results: OrbitLockFinalResults;
  onContinue: () => void;
}

export function OrbitLockResults({ results, onContinue }: OrbitLockResultsProps) {
  const controlScore = Math.round((1 - results.overcorrectionIndex) * 100);
  const resistanceScore = Math.round(results.distractionResistanceIndex * 100);
  const kpis: KPIData[] = [
    {
      id: "stability",
      label: "In band",
      value: `${results.totalTimeInBandPct}%`,
      tier: tier(results.totalTimeInBandPct),
    },
    {
      id: "control",
      label: "Control",
      value: `${controlScore}%`,
      tier: tier(controlScore),
    },
    {
      id: "resistance",
      label: "Resistance",
      value: `${resistanceScore}%`,
      tier: tier(resistanceScore),
    },
  ];
  const actValues = [
    ["Stabilize", results.act1TimeInBandPct],
    ["Resist", results.act2TimeInBandPct],
    ["Hold", results.act3TimeInBandPct],
  ] as const;
  const mistakes: ReviewMistake[] = actValues
    .filter(([, value]) => value < 85)
    .map(([label, value], index) => ({
      roundNumber: index + 1,
      segmentLabel: label,
      isTimeout: false,
      options: [
        { id: `${label}-observed`, label: `${value}% in band`, type: "text" },
        { id: `${label}-reference`, label: "85%+ reference", type: "text" },
      ],
      userChoiceIndex: 0,
      correctIndex: 1,
      microLine: "Use smaller corrections to spend more time inside the target band.",
    }));
  if (mistakes.length === 0 && results.overcorrectionIndex >= 0.3) {
    mistakes.push({
      roundNumber: 1,
      segmentLabel: "Control smoothness",
      isTimeout: false,
      options: [
        { id: "control-observed", label: `${Math.round(results.overcorrectionIndex * 100)}% correction load`, type: "text" },
        { id: "control-reference", label: "Below 30%", type: "text" },
      ],
      userChoiceIndex: 0,
      correctIndex: 1,
      microLine: "Reduce correction size rather than reacting more often.",
    });
  }
  const insight = useGameInsight({
    gameType: "S1-AE",
    skill: "AE",
    currentScore: results.score,
    xpAwarded: results.xpAwarded,
  });

  return (
    <UnifiedGameResults
      gameName="Orbit Lock"
      difficulty={results.difficulty}
      roundsCompleted={results.actsCount}
      totalRounds={3}
      durationSeconds={90}
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
