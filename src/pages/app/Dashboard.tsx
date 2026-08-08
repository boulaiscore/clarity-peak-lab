import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { OverviewCarousel } from "@/components/dashboard/OverviewCarousel";
import { TrainingTasks } from "@/components/dashboard/TrainingTasks";
import { GamesStats } from "@/components/dashboard/GamesStats";
import { MetricTrendCharts } from "@/components/dashboard/MetricTrendCharts";
import { DetoxStats } from "@/components/dashboard/DetoxStats";
import { BaselineStatusCard } from "@/components/dashboard/BaselineStatusCard";
import {
  MonitorPanel,
  MonitorSectionHeader,
  MonitorSegmentedControl,
} from "@/components/dashboard/MonitorUI";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useCognitiveNetworkScore } from "@/hooks/useCognitiveNetworkScore";
import { useInitializeCognitiveBaseline } from "@/hooks/useInitializeCognitiveBaseline";
import { useSubscription } from "@/hooks/useSubscription";

const PRIMARY_TABS = [
  { value: "insights", label: "Overview" },
  { value: "report", label: "Report" },
] as const;

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
  const initialTab = searchParams.get("tab") as "overview" | "training" | "report" | null;
  const initialSubTab = searchParams.get("subtab") as "trends" | "games" | "tasks" | "detox" | null;

  const [activeTab, setActiveTab] = useState<"insights" | "report">(
    initialTab === "report" ? "report" : "insights"
  );
  const [analyticsTab, setAnalyticsTab] = useState<"trends" | "activity">(
    initialSubTab === "trends" ? "trends" :
    initialSubTab && ["games", "tasks", "detox"].includes(initialSubTab) ? "activity" : "trends"
  );
  const [activitySubTab, setActivitySubTab] = useState<"tasks" | "detox" | "training">(
    initialSubTab === "games" ? "training" :
    initialSubTab === "tasks" ? "tasks" :
    initialSubTab === "detox" ? "detox" : "tasks"
  );

  const { isActive: isPremium } = useSubscription();

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

  // Synthesized Cognitive Index (SCI) for neural animation
  const { sci, statusText: sciStatusText, bottleneck } = useCognitiveNetworkScore();

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
      <div className="mx-auto max-w-md space-y-6 px-5 py-5">
        <MonitorSegmentedControl
          ariaLabel="Monitor view"
          value={activeTab}
          options={PRIMARY_TABS}
          onChange={setActiveTab}
        />

        {/* Baseline Status - shows only when calibration is needed */}
        <BaselineStatusCard />

        {activeTab === "insights" ? (
          <div className="space-y-8">
            <OverviewCarousel
              sci={sci}
              sciStatusText={sciStatusText}
              thinkingScores={thinkingScores}
              bottleneck={bottleneck}
            />

            <section className="space-y-4">
              <MonitorSectionHeader
                eyebrow="History"
                title="Signals over time"
                description="Compare metric direction with the activity that may be shaping it."
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
        ) : (
          <section className="space-y-4">
            <MonitorSectionHeader
              eyebrow="Report"
              title="Personal performance report"
              description="A longer view of your observed task, recovery and consistency patterns."
            />

            <MonitorPanel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Your data, in context
                </p>
                {!isPremium && (
                  <span className="rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[9px] font-medium text-muted-foreground">
                    Premium
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                See what is changing and what to do next.
              </h3>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Review multi-week metric direction, supporting activity and practical next steps in one consistent summary.
              </p>

              <div className="my-5 grid grid-cols-2 gap-3 border-y border-border/25 py-4">
                <div>
                  <p className="text-[10px] font-medium text-foreground">Performance trends</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">Your baseline and recent direction</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-foreground">Next actions</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">Suggestions grounded in your activity</p>
                </div>
              </div>

              <Button asChild variant={isPremium ? "premium" : "default"} className="h-11 w-full text-[12px] font-medium">
                <Link to="/app/report">
                  {isPremium ? "View full report" : "Explore report"}
                </Link>
              </Button>
            </MonitorPanel>
          </section>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
