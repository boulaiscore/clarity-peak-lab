import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, Target, Zap, Clock, Headphones, BookOpen, FileText, Activity, Check } from "lucide-react";
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
import { useInProgressTasks } from "@/hooks/useInProgressTasks";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { usePrioritizedSuggestions } from "@/hooks/usePrioritizedSuggestions";
import { useCognitiveInsights } from "@/hooks/useCognitiveInsights";
import { useTutorialState } from "@/hooks/useTutorialState";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { useActiveBooks } from "@/hooks/useActiveBooks";
import { cn } from "@/lib/utils";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { getSharpnessStatus, getReadinessStatus, getRecoveryStatus, getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";
import { CognitiveInsightCard } from "@/components/home/CognitiveInsightCard";
import { useMetricWeeklyChange } from "@/hooks/useMetricWeeklyChange";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DistractionLoadCard } from "@/components/app/DistractionLoadCard";
import { HomeTabId } from "@/components/home/HomeTabs";
import { IntuitionTab } from "@/components/home/IntuitionTab";
import { ReasoningTab } from "@/components/home/ReasoningTab";
import { CapacityTab } from "@/components/home/CapacityTab";
import { RecoveryBatteryCard } from "@/components/dashboard/RecoveryBatteryCard";
import { SmartSuggestionCard } from "@/components/home/SmartSuggestionCard";
import { ReadingLoadDashboard } from "@/components/lab/ReadingLoadDashboard";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";

import { FastChargeSwipeCard } from "@/components/home/FastChargeSwipeCard";


// Circular progress ring component with icon and status inside
interface RingProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  displayValue: string;
  dynamicIndicator?: string;
  deltaIndicator?: string | null;
  icon?: React.ReactNode;
  onClick?: () => void;
}
const ProgressRing = ({
  value,
  max,
  size,
  strokeWidth,
  color,
  label,
  displayValue,
  dynamicIndicator,
  deltaIndicator,
  icon,
  onClick
}: RingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;
  return <button className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.97]" onClick={onClick}>
      <div className="relative" style={{
      width: size,
      height: size
    }}>
        {/* Background ring — full track for premium WHOOP feel */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--foreground))" strokeWidth={strokeWidth} className="opacity-[0.08]" />
        </svg>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 6px ${color}55)` }} />
        </svg>
        {/* Center content: big number, WHOOP-style */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[40px] font-semibold tracking-tight text-foreground tabular-nums leading-none">
            {displayValue}
          </span>
          {deltaIndicator && <span className="text-[10px] font-medium mt-1.5 tabular-nums opacity-70" style={{
          color
        }}>
              {deltaIndicator}
            </span>}
        </div>
      </div>
      {/* Label + status below the ring */}
      <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </span>
      {dynamicIndicator && <span className="mt-1 text-[11px] font-semibold tracking-wide" style={{ color }}>
        {dynamicIndicator}
      </span>}
    </button>;
};
const Home = () => {
  const navigate = useNavigate();
  const {
    user,
    updateUser
  } = useAuth();
  const {
    sessionsCompleted,
    weeklyXPTarget,
    plan
  } = useWeeklyProgress();

  // Baseline calibration status - gates Games and Tasks
  const {
    isCalibrated,
    isLoading: baselineLoading
  } = useBaselineStatus();

  // Stable (no-flicker) weekly load totals
  const stableCognitiveLoad = useStableCognitiveLoad();
  const {
    cappedTotalXP,
    rawDetoxXP,
    detoxXPTarget,
    detoxProgress,
    detoxComplete
  } = stableCognitiveLoad;
  const totalWeeklyXP = cappedTotalXP;

  // Capped weekly progress for smart training reminders
  const {
    cappedGamesXP,
    gamesXPTarget,
    totalProgress
  } = useCappedWeeklyProgress();

  // Training Capacity for Optimal Zone display
  const {
    optimalRange
  } = useTrainingCapacity();

  // Active books for "Currently Reading" card
  const { data: activeBooks = [] } = useActiveBooks();
  // Prioritized suggestions based on metrics and lab state
  const {
    suggestions: prioritizedSuggestions,
    topSuggestion,
    isLoading: suggestionsLoading
  } = usePrioritizedSuggestions();

  // New cognitive engine metrics
  // recoveryRaw: null until REC baseline exists and can be decayed (used for snapshots)
  const {
    sharpness,
    readiness,
    recoveryRaw,
    isLoading: metricsLoading
  } = useTodayMetrics();

  // REC_effective for UI display (uses RRI until first real recovery activity)
  const {
    recoveryEffective,
    isUsingRRI,
    isLoading: recoveryEffectiveLoading
  } = useRecoveryEffective();

  // Reasoning Quality metric
  const {
    rq,
    s2Core,
    s2Consistency,
    taskPriming,
    isDecaying: rqIsDecaying,
    isLoading: rqLoading
  } = useReasoningQuality();

  // Cognitive decision insights - must be after metrics are defined
  const cognitiveInsights = useCognitiveInsights({
    sharpness,
    readiness,
    recovery: recoveryEffective,
    rq,
  });

  // Fetch completed content IDs to filter out from in-progress
  const {
    data: completedIds = []
  } = useQuery({
    queryKey: ["completed-content-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data,
        error
      } = await supabase.from("exercise_completions").select("exercise_id").eq("user_id", user.id).like("exercise_id", "content-%");
      if (error) throw error;
      return (data || []).map(c => {
        const parts = c.exercise_id.split("-");
        return parts.slice(2).join("-");
      });
    },
    enabled: !!user?.id,
    staleTime: 30_000
  });

  // In-progress tasks for reminder section (auto-filters completed items)
  const {
    getInProgressTasks
  } = useInProgressTasks(completedIds);

  // Daily recovery snapshot for decay tracking (idempotent - runs once per day)
  const {
    persistDailySnapshot,
    isSnapshotCurrentToday
  } = useDailyRecoverySnapshot();

  // Persist daily REC snapshot on mount (once per day only)
  useEffect(() => {
    // Only run if metrics are loaded and snapshot hasn't been taken today
    if (!metricsLoading && !isSnapshotCurrentToday()) {
      // IMPORTANT: Snapshot must use real recovery (REC_raw), not RRI
      // If not initialized yet, the hook will skip persisting.
      persistDailySnapshot(recoveryRaw).catch(err => {
        console.error("[Home] Failed to persist daily snapshot:", err);
      });
    }
  }, [metricsLoading, recoveryRaw, persistDailySnapshot, isSnapshotCurrentToday]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("overview");

  // Date navigation state - allows viewing past days (max 7 days back)
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  // Calculate if we're viewing today or a past date
  const isViewingToday = useMemo(() => {
    try {
      return isToday(parseISO(selectedDate));
    } catch {
      return true;
    }
  }, [selectedDate]);

  // Calculate if we can go further back (max 7 days)
  const canGoBack = useMemo(() => {
    try {
      const minDate = startOfDay(subDays(new Date(), 7));
      const currentDate = startOfDay(parseISO(selectedDate));
      return isBefore(minDate, currentDate);
    } catch {
      return false;
    }
  }, [selectedDate]);

  // Historical metrics for past dates
  const {
    metrics: historicalMetrics,
    isLoading: historicalLoading
  } = useHistoricalMetrics({
    date: selectedDate
  });

  // Yesterday's metrics for delta calculation
  const {
    yesterdayMetrics
  } = useYesterdayMetrics(selectedDate);

  // Navigation handlers
  const handlePreviousDay = () => {
    if (canGoBack) {
      const prevDate = subDays(parseISO(selectedDate), 1);
      setSelectedDate(format(prevDate, "yyyy-MM-dd"));
    }
  };
  const handleNextDay = () => {
    if (!isViewingToday) {
      const nextDate = addDays(parseISO(selectedDate), 1);
      setSelectedDate(format(nextDate, "yyyy-MM-dd"));
    }
  };

  // Get display label for current date
  const dateDisplayLabel = useMemo(() => getDateDisplayLabel(selectedDate), [selectedDate]);

  // Determine which metrics to display (today's live metrics or historical snapshot)
  const displaySharpness = isViewingToday ? sharpness : historicalMetrics?.sharpness ?? 0;
  const displayReadiness = isViewingToday ? readiness : historicalMetrics?.readiness ?? 0;
  const displayRecovery = isViewingToday ? recoveryEffective : historicalMetrics?.recovery ?? 0;
  const displayRQ = isViewingToday ? rq : historicalMetrics?.reasoningQuality ?? 0;
  const displayS2Core = isViewingToday ? s2Core : historicalMetrics?.s2 ?? 0;
  const displayTaskPriming = isViewingToday ? taskPriming : 0; // Historical doesn't store this separately
  const isDisplayLoading = isViewingToday ? metricsLoading || recoveryEffectiveLoading : historicalLoading;
  const hasHistoricalData = !isViewingToday && historicalMetrics !== null;

  // Calculate deltas vs yesterday (only show for today view)
  const sharpnessDelta = isViewingToday ? formatDeltaPercent(sharpness, yesterdayMetrics?.sharpness ?? null) : null;
  const readinessDelta = isViewingToday ? formatDeltaPercent(readiness, yesterdayMetrics?.readiness ?? null) : null;
  const recoveryDelta = isViewingToday ? formatDeltaPercent(recoveryEffective, yesterdayMetrics?.recovery ?? null) : null;
  const rqDelta = isViewingToday ? formatDeltaPercent(rq, yesterdayMetrics?.reasoningQuality ?? null) : null;

  // Tutorial state - shows after first onboarding completion
  const {
    showTutorial,
    markTutorialComplete
  } = useTutorialState();
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const hasProtocol = !!user?.trainingPlan;

  // Premium functional color system - fixed colors per metric
  // Low values are communicated by arc length and copy, not color
  const sharpnessColor = "hsl(210, 100%, 60%)"; // Electric blue
  const readinessColor = "hsl(245, 58%, 65%)"; // Soft indigo
  const rqColor = "hsl(207, 44%, 55%)"; // Steel Blue for RQ

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  // Get insight based on readiness - direct actionable tone
  const getInsight = () => {
    if (readiness >= 75) {
      return {
        title: "Today: train hard",
        body: "Your readiness is high — push intensity for maximum gains.",
        action: "Start Train"
      };
    }
    if (readiness >= 55) {
      return {
        title: "Today: maintain rhythm",
        body: "Conditions are stable — complete your session to stay on track.",
        action: "Start session"
      };
    }
    return {
      title: "Today: recover",
      body: "Readiness is low — do Recover or light Quality Time instead.",
      action: "Start Recover"
    };
  };
  const insight = getInsight();

  // Baseline calibration not completed - show CTA to complete it
  if (!baselineLoading && !isCalibrated) {
    return <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.14))] px-6">
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6">
              <LoomaLogo size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Complete Calibration</h1>
            <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
              A 2-minute cognitive baseline is required before Train begins. 
              This establishes your personalized skill references.
            </p>
            <button onClick={() => navigate("/app/calibration")} className="inline-flex items-center px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </main>
      </AppShell>;
  }

  // No protocol configured
  if (!hasProtocol) {
    return <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.14))] px-6">
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center max-w-sm">
            <h1 className="text-xl font-semibold mb-2">Configure Protocol</h1>
            <p className="text-sm text-muted-foreground/60 mb-8">
              Assessment required before training
            </p>
            <button onClick={() => navigate("/onboarding")} className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Begin Assessment
            </button>
          </motion.div>
        </main>
      </AppShell>;
  }
  return <AppShell>
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.14))] px-5 pt-3 pb-4 max-w-md mx-auto">

        {/* Tab Content */}
        {activeTab === "overview" && <>
            {/* Date Navigation Header */}
            <motion.section initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.02
        }} className="mb-4 flex justify-center items-center gap-3">
              {/* Left arrow - always visible but disabled at min date */}
              <button onClick={handlePreviousDay} disabled={!canGoBack} className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all", canGoBack ? "bg-muted/40 hover:bg-muted/60 active:scale-95" : "opacity-30 cursor-not-allowed")} aria-label="Previous day">
                <ChevronLeft className="w-4 h-4 text-foreground/70" />
              </button>
              
              {/* Date label */}
              <span className="px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 min-w-[100px] text-center">
                {dateDisplayLabel}
              </span>
              
              {/* Right arrow - only visible when viewing past date */}
              <button onClick={handleNextDay} disabled={isViewingToday} className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all", !isViewingToday ? "bg-muted/40 hover:bg-muted/60 active:scale-95" : "opacity-30 cursor-not-allowed")} aria-label="Next day">
                <ChevronRight className="w-4 h-4 text-foreground/70" />
              </button>
            </motion.section>
            
            {/* No data warning for historical dates */}
            {!isViewingToday && !historicalLoading && !hasHistoricalData && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="mb-4 text-center">
                <p className="text-xs text-muted-foreground/60">
                  No data recorded for this day
                </p>
              </motion.div>}
            
            {/* Three Rings with Cognitive Engine Metrics */}
            <motion.section initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.05
        }} className="mb-3">
              <div className="flex justify-center gap-3 mb-5">
                <ProgressRing value={isDisplayLoading ? 0 : displaySharpness} max={100} size={112} strokeWidth={6} color={sharpnessColor} label="Sharpness" displayValue={isDisplayLoading ? "—" : `${Math.round(displaySharpness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getSharpnessStatus(displaySharpness).label, getSharpnessStatus(displaySharpness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : sharpnessDelta} onClick={isViewingToday ? () => setActiveTab("intuition") : undefined} />
                <ProgressRing value={displayReadiness} max={100} size={112} strokeWidth={6} color={readinessColor} label="Readiness" displayValue={isDisplayLoading ? "—" : `${Math.round(displayReadiness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReadinessStatus(displayReadiness).label, getReadinessStatus(displayReadiness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : readinessDelta} onClick={isViewingToday ? () => setActiveTab("reasoning") : undefined} />
                <ProgressRing value={isDisplayLoading ? 0 : displayRQ} max={100} size={112} strokeWidth={6} color={rqColor} label="Reasoning" displayValue={isDisplayLoading ? "—" : `${Math.round(displayRQ)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReasoningQualityStatus(displayRQ).label, getReasoningQualityStatus(displayRQ).level, null, null).text} deltaIndicator={isDisplayLoading ? null : rqDelta} onClick={isViewingToday ? () => navigate("/app/reasoning-quality-impact") : undefined} />
              </div>

              {/* Outcome headline — Whoop-style human translation */}
              {isViewingToday && !isDisplayLoading && (() => {
                const r = Math.round(displayReadiness);
                const rec = Math.round(displayRecovery);
                let label = "";
                let line = "";
                if (rec < 40) { label = "Recovery debt"; line = "Protect today. Train light or recover."; }
                else if (r >= 75) { label = "Primed"; line = "You think faster and clearer than yesterday."; }
                else if (r >= 55) { label = "Stable"; line = "Small, consistent gains compound today."; }
                else { label = "Reactive"; line = "One focused action will reset the day."; }
                return (
                  <div className="text-center mb-5 px-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/50 mb-1.5">{label}</p>
                    <p className="text-[15px] font-light text-foreground/90 leading-snug">{line}</p>
                  </div>
                );
              })()}
              
              {/* Goal Complete indicator - only shows when target reached AND viewing today */}
              {isViewingToday && totalProgress >= 100 && <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Weekly Target Reached</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                    Same plan, same rhythm. Keep training or rest freely.
                  </p>
                </div>}
              
              {/* Recovery Battery Card */}
              <RecoveryBatteryCard recovery={displayRecovery} isLoading={isDisplayLoading || recoveryEffectiveLoading} deltaVsYesterday={recoveryDelta} onClick={isViewingToday ? () => setActiveTab("capacity") : undefined} />
            </motion.section>

        {/* Cognitive Decision Insight Card */}
        {isViewingToday && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-5"
          >
            <CognitiveInsightCard
              primaryInsight={cognitiveInsights.primaryInsight}
              secondaryInsight={cognitiveInsights.secondaryInsight}
              decisionReadiness={cognitiveInsights.decisionReadiness}
              isLoading={metricsLoading || rqLoading || cognitiveInsights.isLoading}
            />
          </motion.section>
        )}

        {/* Top action suggestion */}
        {isViewingToday && topSuggestion && (
          <SmartSuggestionCard suggestion={topSuggestion} index={0} />
        )}

        {/* Single priority — Whoop-style focus, secondary suggestions removed for calm */}




        {/* Fast Charge - WHOOP-style swipe card */}
        <motion.div initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.18
        }} className="mb-8">
          <FastChargeSwipeCard />
        </motion.div>

          </>}

        {activeTab === "intuition" && <IntuitionTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "reasoning" && <ReasoningTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "capacity" && <CapacityTab onBackToOverview={() => setActiveTab("overview")} />}
      </main>

      
      {/* Onboarding Tutorial - appears once after first login post-onboarding */}
      <OnboardingTutorial show={showTutorial} onComplete={markTutorialComplete} />
      
    </AppShell>;
};
export default Home;