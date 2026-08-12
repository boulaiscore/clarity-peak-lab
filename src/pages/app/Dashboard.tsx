import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { OverviewCarousel } from "@/components/dashboard/OverviewCarousel";
import { TrainingTasks } from "@/components/dashboard/TrainingTasks";
import { GamesStats } from "@/components/dashboard/GamesStats";
import { MetricTrendCharts } from "@/components/dashboard/MetricTrendCharts";
import { DetoxStats } from "@/components/dashboard/DetoxStats";
import { BaselineStatusCard } from "@/components/dashboard/BaselineStatusCard";
import { CognitiveRhythmPanel } from "@/components/dashboard/CognitiveRhythmPanel";
import {
  MonitorSectionHeader,
  MonitorSegmentedControl,
} from "@/components/dashboard/MonitorUI";
import { Loader2 } from "lucide-react";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useInitializeCognitiveBaseline } from "@/hooks/useInitializeCognitiveBaseline";

const ANALYTICS_TABS = [
  { value: "trends", label: "Trends" },
  { value: "activity", label: "Activity" },
] as const;

const ACTIVITY_TABS = [
  { value: "training", label: "Training" },
  { value: "tasks", label: "Quality time" },
  { value: "detox", label: "Recovery" },
] as const;

const Dashboard = () => {
  const [searchParams] = useSearchParams();

  // Initialize tabs from URL params
  const initialSubTab = searchParams.get("subtab") as "trends" | "games" | "tasks" | "detox" | null;

  const [analyticsTab, setAnalyticsTab] = useState<"trends" | "activity">(
    initialSubTab === "trends" ? "trends" :
    initialSubTab && ["games", "tasks", "detox"].includes(initialSubTab) ? "activity" : "trends"
  );
  const [activitySubTab, setActivitySubTab] = useState<"tasks" | "detox" | "training">(
    initialSubTab === "games" ? "training" :
    initialSubTab === "tasks" ? "tasks" :
    initialSubTab === "detox" ? "detox" : "tasks"
  );

  // Initialize cognitive baseline on app load
  useInitializeCognitiveBaseline();

  // Use the same effective states and baselines as Today (including inactivity decay).
  const { states, baseline, rawMetrics, isLoading: metricsLoading } = useCognitiveStates();

  // Get fast/slow thinking scores with deltas from baseline
  // S1 (Fast) = (AE + RA) / 2 = (focus_stability + fast_thinking) / 2
  // S2 (Slow) = (CT + IN) / 2 = (reasoning_accuracy + slow_thinking) / 2
  const thinkingScores = useMemo(() => {
    // Current skill values
    const { AE, RA, CT, IN } = states;

    // Calculate S1 and S2 using correct aggregation formula
    const currentFast = Math.round((AE + RA) / 2); // S1
    const currentSlow = Math.round((CT + IN) / 2); // S2

    // Baseline skill values
    const baselineAE = baseline.baselineAE;
    const baselineRA = baseline.baselineRA;
    const baselineCT = baseline.baselineCT;
    const baselineIN = baseline.baselineIN;

    // Calculate baseline S1 and S2 with same formula
    const baselineFast = (baselineAE + baselineRA) / 2;
    const baselineSlow = (baselineCT + baselineIN) / 2;

    // Only show delta if user has completed at least 1 training session
    const hasTrainedAfterBaseline = (rawMetrics?.total_sessions || 0) > 0;

    // Calculate improvement from baseline only if training has occurred
    const fastDelta = hasTrainedAfterBaseline ? Math.round(currentFast - baselineFast) : 0;
    const slowDelta = hasTrainedAfterBaseline ? Math.round(currentSlow - baselineSlow) : 0;

    return {
      fastScore: currentFast,
      slowScore: currentSlow,
      fastDelta,
      slowDelta,
      baselineFast: Math.round(baselineFast),
      baselineSlow: Math.round(baselineSlow)
    };
  }, [states, baseline, rawMetrics?.total_sessions]);

  if (metricsLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 pb-6 pt-4">
        <header className="mb-4 flex items-center justify-between px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/80">Monitor</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/45">Today</p>
        </header>

        {/* Baseline Status - shows only when calibration is needed */}
        <BaselineStatusCard />

        <div className="mt-5 space-y-7">
          <OverviewCarousel
            thinkingScores={thinkingScores}
          />

          <CognitiveRhythmPanel />

          <section className="space-y-3">
            <MonitorSectionHeader
              eyebrow="History"
              title="Signals over time"
            />

            <MonitorSegmentedControl
              ariaLabel="History view"
              value={analyticsTab}
              options={ANALYTICS_TABS}
              onChange={setAnalyticsTab}
            />

            {analyticsTab === "trends" ? (
              <MetricTrendCharts />
            ) : (
              <div className="space-y-4">
                <MonitorSegmentedControl
                  ariaLabel="Activity type"
                  value={activitySubTab}
                  options={ACTIVITY_TABS}
                  onChange={setActivitySubTab}
                />

                {activitySubTab === "tasks" ? (
                  <TrainingTasks />
                ) : activitySubTab === "detox" ? (
                  <DetoxStats />
                ) : (
                  <GamesStats />
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
