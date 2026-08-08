// src/components/report/ClinicalReportMockup.tsx
// Uses the production report template with representative sample data.
import { ClinicalReport, type ReportMetricSnapshot } from "@/components/report/ClinicalReport";
import {
  MOCK_AGGREGATES,
  MOCK_BADGES,
  MOCK_METRICS,
  MOCK_PROFILE,
} from "@/lib/mockReportData";
import { calculateSCI } from "@/lib/cognitiveNetworkScore";
import { calculateSharpness } from "@/lib/cognitiveEngine";

function generateSampleSnapshots(anchorDate: Date): ReportMetricSnapshot[] {
  return Array.from({ length: 60 }, (_, index) => {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() - (59 - index));

    const progress = index / 59;
    const wave = Math.sin(index / 4) * 3;
    const recovery = Math.round(54 + progress * 18 + Math.sin(index / 5) * 6);
    const ae = Math.round(66 + progress * 12 + wave);
    const ra = Math.round(63 + progress * 11 + Math.cos(index / 6) * 4);
    const ct = Math.round(61 + progress * 13 + Math.sin(index / 7) * 3);
    const inScore = Math.round(64 + progress * 10 + Math.cos(index / 5) * 3);
    const s1 = Math.round((ae + ra) / 2);
    const s2 = Math.round((ct + inScore) / 2);
    const readiness = Math.round(58 + progress * 17 + Math.sin(index / 6) * 4);
    const sharpness = Math.round(calculateSharpness({ AE: ae, RA: ra, CT: ct, IN: inScore }, recovery));
    const reasoningQuality = Math.round(57 + progress * 16 + Math.cos(index / 8) * 4);

    return {
      snapshot_date: date.toISOString().slice(0, 10),
      sharpness,
      readiness,
      recovery,
      reasoning_quality: reasoningQuality,
      ae,
      ra,
      ct,
      in_score: inScore,
      s1,
      s2,
      did_training: index % 3 !== 0,
    };
  });
}

export function ClinicalReportMockup() {
  const generatedAt = new Date("2026-05-25T09:00:00.000Z");
  const metricSnapshots = generateSampleSnapshots(generatedAt);

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
    { recovery: 72 },
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
    reasoning_quality: 74,
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
      metricSnapshots={metricSnapshots}
    />
  );
}
