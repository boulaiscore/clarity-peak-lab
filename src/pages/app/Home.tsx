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
import { useTutorialState } from "@/hooks/useTutorialState";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { cn } from "@/lib/utils";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { getSharpnessStatus, getReadinessStatus, getRecoveryStatus, getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";
import { DailyBriefing } from "@/components/home/DailyBriefing";
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
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";
import { TestModeFloatingToggle } from "@/components/dev/TestModeFloatingToggle";
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
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} className="opacity-20" />
        </svg>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        {/* Center content: icon, value, and status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="opacity-40 mb-0.5" style={{
          color
        }}>
              {icon}
            </div>}
          {dynamicIndicator && <span className="text-[9px] font-medium mb-0.5" style={{
          color,
          opacity: 0.8
        }}>
              {dynamicIndicator}
            </span>}
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {displayValue}
          </span>
          {deltaIndicator && <span className="text-[8px] font-medium mt-0.5 tabular-nums" style={{
          color,
          opacity: 0.85
        }}>
              {deltaIndicator}
            </span>}
        </div>
      </div>
      {/* Label below the ring - button-like */}
      <span className="mt-2 px-3 py-1 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80 hover:bg-muted/60 transition-colors">
        {label}
      </span>
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
      body: "Readiness is low — do Recover or light Reason instead.",
      action: "Start Recover"
    };
  };
  const insight = getInsight();

  // Baseline calibration not completed - show CTA to complete it
  if (!baselineLoading && !isCalibrated) {
    return <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
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
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
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
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-5 py-4 max-w-md mx-auto">

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
              <div className="flex justify-center gap-6 mb-4">
                <ProgressRing value={isDisplayLoading ? 0 : displaySharpness} max={100} size={90} strokeWidth={4} color={sharpnessColor} label="Sharpness" displayValue={isDisplayLoading ? "—" : `${Math.round(displaySharpness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getSharpnessStatus(displaySharpness).label, getSharpnessStatus(displaySharpness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : sharpnessDelta} onClick={isViewingToday ? () => setActiveTab("intuition") : undefined} />
                <ProgressRing value={displayReadiness} max={100} size={90} strokeWidth={4} color={readinessColor} label="Readiness" displayValue={isDisplayLoading ? "—" : `${Math.round(displayReadiness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReadinessStatus(displayReadiness).label, getReadinessStatus(displayReadiness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : readinessDelta} onClick={isViewingToday ? () => setActiveTab("reasoning") : undefined} />
                <ProgressRing value={isDisplayLoading ? 0 : displayRQ} max={100} size={90} strokeWidth={4} color={rqColor} label="Reasoning" displayValue={isDisplayLoading ? "—" : `${Math.round(displayRQ)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReasoningQualityStatus(displayRQ).label, getReasoningQualityStatus(displayRQ).level, null, null).text} deltaIndicator={isDisplayLoading ? null : rqDelta} onClick={isViewingToday ? () => navigate("/app/reasoning-quality-impact") : undefined} />
              </div>
              
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

        {/* Daily Insight with Action - Combined premium box */}
        {isViewingToday && topSuggestion && <motion.section initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.08
        }} className="mb-3">
            <button onClick={() => navigate(topSuggestion.route)} className={cn("w-full p-3.5 rounded-xl bg-gradient-to-br transition-all active:scale-[0.98] text-left", topSuggestion.colorClass)}>
              {/* Briefing text */}
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                <DailyBriefing sharpness={sharpness} readiness={readiness} recovery={recoveryEffective} rq={rq} isLoading={metricsLoading || rqLoading} />
              </p>
              
              {/* Action CTA */}
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", topSuggestion.urgency === "critical" ? "bg-red-500/15" : topSuggestion.urgency === "high" ? "bg-amber-500/15" : "bg-primary/15")}>
                  <topSuggestion.icon className={cn("w-4 h-4", topSuggestion.urgency === "critical" ? "text-red-500" : topSuggestion.urgency === "high" ? "text-amber-500" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("text-xs font-medium", topSuggestion.urgency === "critical" ? "text-red-600 dark:text-red-400" : topSuggestion.urgency === "high" ? "text-amber-600 dark:text-amber-400" : "text-primary")}>
                    {topSuggestion.action}
                  </span>
                </div>
                <ChevronRight className={cn("w-4 h-4 opacity-60", topSuggestion.urgency === "critical" ? "text-red-500" : topSuggestion.urgency === "high" ? "text-amber-500" : "text-primary")} />
              </div>
            </button>
          </motion.section>}

        {/* Additional suggestions (skip first since it's in the combined box) */}
        {prioritizedSuggestions.slice(1, 2).map((suggestion, index) => <SmartSuggestionCard key={suggestion.id} suggestion={suggestion} index={index} />)}

        {/* In-Progress Tasks Reminder - shown after priority suggestions */}
        {(() => {
          const inProgressTasks = getInProgressTasks();
          if (inProgressTasks.length === 0) return null;
          const getTaskIcon = (type: "podcast" | "book" | "article") => {
            switch (type) {
              case "podcast":
                return <Headphones className="w-4 h-4" />;
              case "book":
                return <BookOpen className="w-4 h-4" />;
              case "article":
                return <FileText className="w-4 h-4" />;
            }
          };
          return <motion.section initial={{
            opacity: 0,
            y: 12
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.14
          }} className="mb-4">
              <button onClick={() => navigate("/neuro-lab?tab=tasks")} className="w-full p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-all active:scale-[0.98] text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {inProgressTasks.length} task{inProgressTasks.length > 1 ? 's' : ''} in progress
                  </span>
                </div>
                <div className="space-y-2">
                  {inProgressTasks.slice(0, 2).map(task => <div key={task.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        {getTaskIcon(task.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Started {formatDistanceToNow(new Date(task.startedAt), {
                        addSuffix: true
                      })}
                        </p>
                      </div>
                    </div>)}
                  {inProgressTasks.length > 2 && <p className="text-[10px] text-muted-foreground">
                      +{inProgressTasks.length - 2} more
                    </p>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Complete to add to Library
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </motion.section>;
        })()}

        {/* Optimal Zone Card - Full width */}
        <motion.section initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.15
        }} className="mb-3">
          <button onClick={() => navigate("/neuro-lab")} className="w-full p-4 rounded-xl bg-muted/40 border border-border/30 text-left hover:bg-muted/60 transition-colors active:scale-[0.98]">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Today's Optimal Zone
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {totalWeeklyXP} <span className="text-muted-foreground font-normal">XP</span>
                </p>
                <span className="text-muted-foreground/50">|</span>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {optimalRange.min}–{optimalRange.max} <span className="font-normal">target</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Your optimal cognitive load based on current recovery and weekly capacity. Try to stay within this range for sustainable cognitive adaptation.                      
            </p>
          </button>
        </motion.section>

        {/* Fast Charge - WHOOP-style swipe card */}
        <motion.div initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.18
        }} className="mb-6">
          <FastChargeSwipeCard />
        </motion.div>

          </>}

        {activeTab === "intuition" && <IntuitionTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "reasoning" && <ReasoningTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "capacity" && <CapacityTab onBackToOverview={() => setActiveTab("overview")} />}
      </main>

      
      {/* Onboarding Tutorial - appears once after first login post-onboarding */}
      <OnboardingTutorial show={showTutorial} onComplete={markTutorialComplete} />
      
      {/* DEV: Test Mode Toggle - remove this line to hide */}
      <TestModeFloatingToggle />
    </AppShell>;
};
export default Home;