import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { format, subDays, addDays, isToday, parseISO, isBefore, startOfDay } from "date-fns";
import { useHistoricalMetrics, getDateDisplayLabel } from "@/hooks/useHistoricalMetrics";
import { useYesterdayMetrics, formatDeltaPercent } from "@/hooks/useYesterdayMetrics";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { useDailyRecoverySnapshot } from "@/hooks/useDailyRecoverySnapshot";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { usePrioritizedSuggestions } from "@/hooks/usePrioritizedSuggestions";
import { useCognitiveInsights } from "@/hooks/useCognitiveInsights";
import { useTutorialState } from "@/hooks/useTutorialState";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { cn } from "@/lib/utils";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { getSharpnessStatus, getReadinessStatus, getRecoveryStatus, getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { CognitiveInsightCard } from "@/components/home/CognitiveInsightCard";
import { SmartSuggestionCard } from "@/components/home/SmartSuggestionCard";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";
import { WearableConnectionPrompt } from "@/components/dashboard/WearableConnectionPrompt";
import { HomeTabId } from "@/components/home/HomeTabs";
import { IntuitionTab } from "@/components/home/IntuitionTab";
import { ReasoningTab } from "@/components/home/ReasoningTab";
import { CapacityTab } from "@/components/home/CapacityTab";

// --- Compact metric row item ---
interface MetricItemProps {
  label: string;
  value: number;
  status: string;
  delta: string | null;
  color: string;
  isLoading: boolean;
  onClick?: () => void;
}

function MetricItem({ label, value, status, delta, color, isLoading, onClick }: MetricItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-center py-3 rounded-xl hover:bg-muted/30 transition-colors active:scale-[0.97]"
    >
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums text-foreground leading-none mb-1">
        {isLoading ? "—" : Math.round(value)}
      </p>
      {!isLoading && (
        <p className="text-[10px] font-medium" style={{ color, opacity: 0.85 }}>
          {status}
          {delta && <span className="ml-1 tabular-nums">{delta}</span>}
        </p>
      )}
    </button>
  );
}

// --- Recovery compact bar ---
interface RecoveryBarProps {
  value: number;
  delta: string | null;
  isLoading: boolean;
  onClick?: () => void;
}

function RecoveryBar({ value, delta, isLoading, onClick }: RecoveryBarProps) {
  const fillPercent = Math.min(Math.max(value, 0), 100);
  
  const getColor = (v: number): string => {
    if (v <= 35) return `hsl(${(v / 35) * 30}, 85%, 45%)`;
    if (v <= 65) return `hsl(${30 + ((v - 35) / 30) * 40}, 80%, 48%)`;
    return `hsl(${70 + ((v - 65) / 35) * 70}, 90%, 50%)`;
  };

  const color = getColor(value);
  const status = getRecoveryStatus(value);

  if (isLoading) {
    return <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />;
  }

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-2 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-2 min-w-[80px]">
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">Recovery</span>
      </div>
      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
        <span className="text-sm font-bold tabular-nums">{Math.round(value)}%</span>
        {delta && (
          <span className="text-[9px] tabular-nums" style={{ color }}>{delta}</span>
        )}
      </div>
    </button>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionsCompleted, weeklyXPTarget, plan } = useWeeklyProgress();
  const { isCalibrated, isLoading: baselineLoading } = useBaselineStatus();
  const stableCognitiveLoad = useStableCognitiveLoad();
  const { cappedTotalXP } = stableCognitiveLoad;
  const { totalProgress } = useCappedWeeklyProgress();
  const { optimalRange } = useTrainingCapacity();
  const { topSuggestion, isLoading: suggestionsLoading } = usePrioritizedSuggestions();
  const { sharpness, readiness, recoveryRaw, isLoading: metricsLoading } = useTodayMetrics();
  const { recoveryEffective, isLoading: recoveryEffectiveLoading } = useRecoveryEffective();
  const { rq, s2Core, taskPriming, isLoading: rqLoading } = useReasoningQuality();

  const cognitiveInsights = useCognitiveInsights({
    sharpness, readiness, recovery: recoveryEffective, rq,
  });

  const { persistDailySnapshot, isSnapshotCurrentToday } = useDailyRecoverySnapshot();

  useEffect(() => {
    if (!metricsLoading && !isSnapshotCurrentToday()) {
      persistDailySnapshot(recoveryRaw).catch(err => {
        console.error("[Home] Failed to persist daily snapshot:", err);
      });
    }
  }, [metricsLoading, recoveryRaw, persistDailySnapshot, isSnapshotCurrentToday]);

  const [activeTab, setActiveTab] = useState<HomeTabId>("overview");
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  const isViewingToday = useMemo(() => {
    try { return isToday(parseISO(selectedDate)); } catch { return true; }
  }, [selectedDate]);

  const canGoBack = useMemo(() => {
    try {
      const minDate = startOfDay(subDays(new Date(), 7));
      return isBefore(minDate, startOfDay(parseISO(selectedDate)));
    } catch { return false; }
  }, [selectedDate]);

  const { metrics: historicalMetrics, isLoading: historicalLoading } = useHistoricalMetrics({ date: selectedDate });
  const { yesterdayMetrics } = useYesterdayMetrics(selectedDate);

  const handlePreviousDay = () => {
    if (canGoBack) setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  };
  const handleNextDay = () => {
    if (!isViewingToday) setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  };

  const dateDisplayLabel = useMemo(() => getDateDisplayLabel(selectedDate), [selectedDate]);

  const displaySharpness = isViewingToday ? sharpness : historicalMetrics?.sharpness ?? 0;
  const displayReadiness = isViewingToday ? readiness : historicalMetrics?.readiness ?? 0;
  const displayRecovery = isViewingToday ? recoveryEffective : historicalMetrics?.recovery ?? 0;
  const displayRQ = isViewingToday ? rq : historicalMetrics?.reasoningQuality ?? 0;
  const isDisplayLoading = isViewingToday ? metricsLoading || recoveryEffectiveLoading : historicalLoading;
  const hasHistoricalData = !isViewingToday && historicalMetrics !== null;

  const sharpnessDelta = isViewingToday ? formatDeltaPercent(sharpness, yesterdayMetrics?.sharpness ?? null) : null;
  const readinessDelta = isViewingToday ? formatDeltaPercent(readiness, yesterdayMetrics?.readiness ?? null) : null;
  const recoveryDelta = isViewingToday ? formatDeltaPercent(recoveryEffective, yesterdayMetrics?.recovery ?? null) : null;
  const rqDelta = isViewingToday ? formatDeltaPercent(rq, yesterdayMetrics?.reasoningQuality ?? null) : null;

  const { showTutorial, markTutorialComplete } = useTutorialState();
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const hasProtocol = !!user?.trainingPlan;

  const sharpnessColor = "hsl(210, 100%, 60%)";
  const readinessColor = "hsl(245, 58%, 65%)";
  const rqColor = "hsl(207, 44%, 55%)";

  // Baseline calibration not completed
  if (!baselineLoading && !isCalibrated) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.14))] px-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6">
              <LoomaLogo size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Complete Calibration</h1>
            <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
              A 2-minute cognitive baseline is required before Train begins.
            </p>
            <button onClick={() => navigate("/app/calibration")} className="inline-flex items-center px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  // No protocol configured
  if (!hasProtocol) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.14))] px-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
            <h1 className="text-xl font-semibold mb-2">Configure Protocol</h1>
            <p className="text-sm text-muted-foreground/60 mb-8">Assessment required before training</p>
            <button onClick={() => navigate("/onboarding")} className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Begin Assessment
            </button>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.14))] px-5 pt-4 pb-4 max-w-md mx-auto">
        {activeTab === "overview" && (
          <>
            {/* Date Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center gap-3 mb-6"
            >
              <button
                onClick={handlePreviousDay}
                disabled={!canGoBack}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  canGoBack ? "bg-muted/40 hover:bg-muted/60 active:scale-95" : "opacity-20 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4 text-foreground/70" />
              </button>
              <span className="px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 min-w-[100px] text-center">
                {dateDisplayLabel}
              </span>
              <button
                onClick={handleNextDay}
                disabled={isViewingToday}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  !isViewingToday ? "bg-muted/40 hover:bg-muted/60 active:scale-95" : "opacity-20 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4 text-foreground/70" />
              </button>
            </motion.div>

            {/* No data for historical date */}
            {!isViewingToday && !historicalLoading && !hasHistoricalData && (
              <p className="text-xs text-muted-foreground/50 text-center mb-4">No data recorded for this day</p>
            )}

            {/* Compact Metrics Summary — Strava-style inline row */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className="mb-2"
            >
              <div className="flex divide-x divide-border/20">
                <MetricItem
                  label="Sharpness"
                  value={displaySharpness}
                  status={getSharpnessStatus(displaySharpness).label}
                  delta={sharpnessDelta}
                  color={sharpnessColor}
                  isLoading={isDisplayLoading}
                  onClick={isViewingToday ? () => setActiveTab("intuition") : undefined}
                />
                <MetricItem
                  label="Readiness"
                  value={displayReadiness}
                  status={getReadinessStatus(displayReadiness).label}
                  delta={readinessDelta}
                  color={readinessColor}
                  isLoading={isDisplayLoading}
                  onClick={isViewingToday ? () => setActiveTab("reasoning") : undefined}
                />
                <MetricItem
                  label="Reasoning"
                  value={displayRQ}
                  status={getReasoningQualityStatus(displayRQ).label}
                  delta={rqDelta}
                  color={rqColor}
                  isLoading={isDisplayLoading}
                  onClick={isViewingToday ? () => navigate("/app/reasoning-quality-impact") : undefined}
                />
              </div>
            </motion.section>

            {/* Recovery Bar — minimal */}
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mb-6 px-1"
            >
              <RecoveryBar
                value={displayRecovery}
                delta={recoveryDelta}
                isLoading={isDisplayLoading || recoveryEffectiveLoading}
                onClick={isViewingToday ? () => setActiveTab("capacity") : undefined}
              />
            </motion.section>

            {/* Weekly progress — ultra compact */}
            {isViewingToday && totalProgress >= 100 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="flex items-center justify-center gap-2 mb-5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Weekly target reached</span>
              </motion.div>
            )}

            {/* Single dominant insight card */}
            {isViewingToday && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4"
              >
                <CognitiveInsightCard
                  primaryInsight={cognitiveInsights.primaryInsight}
                  secondaryInsight={null}
                  decisionReadiness={cognitiveInsights.decisionReadiness}
                  isLoading={metricsLoading || rqLoading || cognitiveInsights.isLoading}
                />
              </motion.section>
            )}

            {/* Single top action — the most important thing to do */}
            {isViewingToday && topSuggestion && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
              >
                <SmartSuggestionCard suggestion={topSuggestion} index={0} />
              </motion.section>
            )}

            {/* Wearable prompt — kept but pushed lower */}
            {isViewingToday && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="mt-2"
              >
                <WearableConnectionPrompt />
              </motion.section>
            )}
          </>
        )}

        {activeTab === "intuition" && <IntuitionTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "reasoning" && <ReasoningTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "capacity" && <CapacityTab onBackToOverview={() => setActiveTab("overview")} />}
      </main>

      <OnboardingTutorial show={showTutorial} onComplete={markTutorialComplete} />
    </AppShell>
  );
};
export default Home;
