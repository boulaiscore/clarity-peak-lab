// src/components/report/ClinicalReportMockup.tsx
// Uses the production report template with representative sample data.
import { ClinicalReport } from "@/components/report/ClinicalReport";
import {
  MOCK_AGGREGATES,
  MOCK_BADGES,
  MOCK_METRICS,
  MOCK_PROFILE,
} from "@/lib/mockReportData";
import { calculateSCI } from "@/lib/cognitiveNetworkScore";

export function ClinicalReportMockup() {
  const generatedAt = new Date("2026-05-25T09:00:00.000Z");

  const liveSci = calculateSCI(
    {
      focus_stability: MOCK_METRICS.focus_stability,
      fast_thinking: MOCK_METRICS.fast_thinking,
      reasoning_accuracy: MOCK_METRICS.reasoning_accuracy,
      slow_thinking: MOCK_METRICS.slow_thinking,
    },
    {
      weeklyGamesXP: 850,
      xpTargetWeek: 1000,
    },
    {
      weeklyDetoxMinutes: 55,
      weeklyWalkMinutes: 70,
      detoxTarget: 100,
    },
  );

  const profile = {
    ...MOCK_PROFILE,
    work_type: "management",
    education_level: "master",
    degree_discipline: "business",
    session_duration: "10-15 minutes",
  };

  const metrics = {
    ...MOCK_METRICS,
    cognitive_performance_score: liveSci.total,
    cognitive_readiness_score: 78,
  };

  const aggregates = {
    ...MOCK_AGGREGATES,
    sessionsLast7d: 6,
    preferredDuration: "10-15 minutes",
    mostUsedExercises: [
      { exerciseId: "S1-AE", count: 14 },
      { exerciseId: "S2-CT", count: 12 },
      { exerciseId: "S1-RA", count: 11 },
      { exerciseId: "S2-IN", count: 9 },
    ],
  };

  return (
    <ClinicalReport
      profile={profile}
      metrics={metrics}
      aggregates={aggregates}
      badges={MOCK_BADGES}
      generatedAt={generatedAt}
      isPreview
      liveSci={liveSci}
    />
  );
}
