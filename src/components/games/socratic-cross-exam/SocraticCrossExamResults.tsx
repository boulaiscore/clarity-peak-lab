/**
 * SOCRATIC CROSS-EXAM — Results Screen
 */

import { useMemo } from "react";
import { UnifiedGameResults, KPIData, ReviewMistake } from "@/components/games";
import { SocraticRoundResult } from "./index";
import { SOCRATIC_CONFIG } from "./socraticCrossExamContent";

interface Props {
  results: SocraticRoundResult[];
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function SocraticCrossExamResults({
  results,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToLab,
}: Props) {
  // Calculate KPIs
  const { sessionScore, spAvg, caAvg, cmAvg, kpis } = useMemo(() => {
    const spScores = results.map(r => r.assumptionScore);
    const caScores = results.map(r => r.crossExamCorrect ? 100 : 0);
    const cmScores = results.map(r => r.contradictionScore);
    
    const spAvg = Math.round(spScores.reduce((a, b) => a + b, 0) / spScores.length);
    const caAvg = Math.round(caScores.reduce((a, b) => a + b, 0) / caScores.length);
    const cmAvg = Math.round(cmScores.reduce((a, b) => a + b, 0) / cmScores.length);
    
    const sessionScore = Math.round(results.reduce((sum, r) => sum + r.roundScore, 0) / results.length);
    
    const kpis: KPIData[] = [
      {
        id: "socratic-precision",
        label: "Precision",
        value: `${spAvg}%`,
        sublabel: "Socratic",
        tier: spAvg >= 75 ? "high" : spAvg >= 50 ? "medium" : "low",
      },
      {
        id: "consistency-accuracy",
        label: "Accuracy",
        value: `${caAvg}%`,
        sublabel: "Consistency",
        tier: caAvg >= 75 ? "high" : caAvg >= 50 ? "medium" : "low",
      },
      {
        id: "contradiction-minimality",
        label: "Minimality",
        value: `${cmAvg}%`,
        sublabel: "Contradiction",
        tier: cmAvg >= 75 ? "high" : cmAvg >= 50 ? "medium" : "low",
      },
    ];
    
    return { sessionScore, spAvg, caAvg, cmAvg, kpis };
  }, [results]);
  
  // Generate mistakes for review
  const mistakes = useMemo((): ReviewMistake[] => {
    return results
      .filter(r => r.roundScore < 80)
      .slice(0, 5)
      .map(r => ({
        roundNumber: r.roundIndex + 1,
        isTimeout: false,
        options: [
          { id: "sp", label: `SP: ${r.assumptionScore}%`, type: "text" as const },
          { id: "ca", label: `CA: ${r.crossExamCorrect ? 100 : 0}%`, type: "text" as const },
          { id: "cm", label: `CM: ${r.contradictionScore}%`, type: "text" as const },
        ],
        userChoiceIndex: 0,
        correctIndex: 0,
        microLine: `"${r.claim.substring(0, 60)}..."`,
      }));
  }, [results]);
  
  const isPerfect = sessionScore >= 90;
  
  return (
    <UnifiedGameResults
      gameName="Socratic Cross-Exam"
      difficulty="medium"
      roundsCompleted={results.length}
      totalRounds={SOCRATIC_CONFIG.rounds}
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
