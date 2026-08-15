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
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { useDailyRecoverySnapshot } from "@/hooks/useDailyRecoverySnapshot";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useTutorialState } from "@/hooks/useTutorialState";
import { useActiveBooks } from "@/hooks/useActiveBooks";
import { useActiveReasonSession } from "@/hooks/useReasonSessions";
import { cn } from "@/lib/utils";
import { getSharpnessStatus, getReadinessStatus, getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";
import { HomeTabId } from "@/components/home/HomeTabs";
import { IntuitionTab } from "@/components/home/IntuitionTab";
import { ReasoningTab } from "@/components/home/ReasoningTab";
import { CapacityTab } from "@/components/home/CapacityTab";
import { RecoveryBatteryCard } from "@/components/dashboard/RecoveryBatteryCard";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";

import { useAcuteRecoveryBoost } from "@/hooks/useAcuteRecoveryBoost";
import { applyBoostToRec } from "@/lib/recovery/acuteBoost";

import { TodayActivitiesCard } from "@/components/home/TodayActivitiesCard";
import { SignalCoverageRow } from "@/components/home/SignalCoverageRow";
import { DailyOutlookCard } from "@/components/home/DailyOutlookCard";
import { FirstRunHealthAccess } from "@/components/onboarding/FirstRunHealthAccess";
import { isNativePlatform } from "@/lib/capacitor/health";

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
  onClick
}: RingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return <button className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.97]" onClick={onClick}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--foreground))" strokeWidth={strokeWidth} className="opacity-[0.08]" />
        </svg>
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 6px ${color}55)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-normal tracking-tight text-foreground tabular-nums leading-none">
            {displayValue}
          </span>
          {deltaIndicator && <span className="text-[9px] font-medium mt-1 tabular-nums opacity-70" style={{ color }}>
              {deltaIndicator}
            </span>}
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
        {label}
        {onClick && <ChevronRight className="w-3 h-3 opacity-80" strokeWidth={2.5} />}
      </span>
      {dynamicIndicator && <span className="mt-1 text-[11px] font-semibold tracking-wide" style={{ color }}>
        {dynamicIndicator}
      </span>}
    </button>;
};

const Home = () => {
  const navigate = useNavigate();
  const [healthAccessBlockingTutorial, setHealthAccessBlockingTutorial] = useState(
    () => isNativePlatform(),
  );
  const {
    user
  } = useAuth();

  // Baseline calibration status - gates Games and Tasks
  const {
    isCalibrated,
    isLoading: baselineLoading
  } = useBaselineStatus();

  const {
    totalProgress
  } = useCappedWeeklyProgress();

  // Active books for "Currently Reading" card
  const { data: activeBooks = [] } = useActiveBooks();

  // Active Quality Time session (Reading / Listening) indicator
  const { data: activeReasonSession } = useActiveReasonSession();
  // New cognitive engine metrics
  // recoveryRaw: null until REC baseline exists and can be decayed (used for snapshots)
  const {
    sharpness,
    readiness,
    recovery,
    recoveryRaw,
    signalCoverage,
    signalCoverageLevel,
    signalUpdatedAt,
    signalSources,
    isLoading: metricsLoading
  } = useTodayMetrics();

  // Acute Recovery Boost — display-layer only, transient state shift
  const acuteBoost = useAcuteRecoveryBoost();

  // Reasoning Quality metric
  const { rq } = useReasoningQuality();

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

  // Scroll to top whenever the active sub-tab changes (smooth, consistent navigation)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

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
  const recoveryWithBoost = isViewingToday
    ? applyBoostToRec(recovery, acuteBoost.activeBoost)
    : recovery;
  const displayRecovery = isViewingToday ? recoveryWithBoost : historicalMetrics?.recovery ?? 0;
  const displayRQ = isViewingToday ? rq : historicalMetrics?.reasoningQuality ?? 0;
  const isDisplayLoading = isViewingToday ? metricsLoading : historicalLoading;
  const hasHistoricalData = !isViewingToday && historicalMetrics !== null;

  // Calculate deltas vs yesterday (only show for today view)
  const sharpnessDelta = isViewingToday ? formatDeltaPercent(sharpness, yesterdayMetrics?.sharpness ?? null) : null;
  const readinessDelta = isViewingToday ? formatDeltaPercent(readiness, yesterdayMetrics?.readiness ?? null) : null;
  const recoveryDelta = isViewingToday ? formatDeltaPercent(recovery, yesterdayMetrics?.recovery ?? null) : null;
  const rqDelta = isViewingToday ? formatDeltaPercent(rq, yesterdayMetrics?.reasoningQuality ?? null) : null;
  const activeSourceCount = signalSources.filter((source) => source.status !== "off").length;

  // Tutorial state - shows after first onboarding completion
  const {
    showTutorial,
    markTutorialComplete
  } = useTutorialState();
  const hasProtocol = !!user?.trainingPlan;

  const sharpnessColor = "hsl(205, 100%, 58%)";
  const readinessColor = "hsl(225, 85%, 64%)";
  const rqColor = "hsl(190, 80%, 52%)";

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
            <button onClick={() => navigate("/app/calibration")} className="inline-flex items-center rounded-xl border border-foreground/15 bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-[0_12px_28px_-18px_rgba(0,0,0,0.9)] transition-all hover:bg-foreground/90 active:scale-[0.98]">
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
            <button onClick={() => navigate("/onboarding")} className="inline-flex items-center rounded-xl border border-foreground/15 bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.98]">
              Begin Assessment
            </button>
          </motion.div>
        </main>
      </AppShell>;
  }
  return <AppShell>
    {({ passiveFeatures, isLoading: passiveLoading }) => <>
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.14))] px-5 pt-8 pb-4 max-w-md mx-auto">

        {/* Tab Content */}
        {activeTab === "overview" && <>
            {/* Date Navigation Header */}
            <motion.section initial={false} className="mb-4 flex justify-center items-center gap-3">
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

            {isViewingToday && !metricsLoading && (
              <SignalCoverageRow
                level={signalCoverageLevel}
                coverage={signalCoverage}
                updatedAt={signalUpdatedAt}
                sources={signalSources}
              />
            )}

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
            
            <motion.section initial={false} className="mb-3">
              <div className="flex justify-center gap-5 mb-5">
                <ProgressRing value={isDisplayLoading ? 0 : displaySharpness} max={100} size={88} strokeWidth={6} color={sharpnessColor} label="Sharpness" displayValue={isDisplayLoading ? "—" : `${Math.round(displaySharpness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getSharpnessStatus(displaySharpness).label, getSharpnessStatus(displaySharpness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : sharpnessDelta} onClick={isViewingToday ? () => setActiveTab("intuition") : undefined} />
                <ProgressRing value={displayReadiness} max={100} size={88} strokeWidth={6} color={readinessColor} label="Readiness" displayValue={isDisplayLoading ? "—" : `${Math.round(displayReadiness)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReadinessStatus(displayReadiness).label, getReadinessStatus(displayReadiness).level, null, null).text} deltaIndicator={isDisplayLoading ? null : readinessDelta} onClick={isViewingToday ? () => setActiveTab("reasoning") : undefined} />
                <ProgressRing value={isDisplayLoading ? 0 : displayRQ} max={100} size={88} strokeWidth={6} color={rqColor} label="Reasoning" displayValue={isDisplayLoading ? "—" : `${Math.round(displayRQ)}`} dynamicIndicator={isDisplayLoading ? undefined : getMetricDisplayInfo(getReasoningQualityStatus(displayRQ).label, getReasoningQualityStatus(displayRQ).level, null, null).text} deltaIndicator={isDisplayLoading ? null : rqDelta} onClick={isViewingToday ? () => navigate("/app/reasoning-quality-impact") : undefined} />
              </div>

              <p className="mb-5 text-center text-[10px] leading-relaxed text-muted-foreground/60">
                Personal state signals · changeable over time · no comparison with other people
              </p>

              {isViewingToday && totalProgress >= 100 && <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Weekly Target Reached</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                    Same plan, same rhythm. Keep training or rest freely.
                  </p>
                </div>}

              <RecoveryBatteryCard recovery={displayRecovery} isLoading={isDisplayLoading} deltaVsYesterday={recoveryDelta} onClick={isViewingToday ? () => setActiveTab("capacity") : undefined} acuteBoost={isViewingToday ? acuteBoost.activeBoost : 0} acuteBoostRemainingMinutes={isViewingToday ? acuteBoost.remainingMinutes : 0} />
            </motion.section>


        {/* My Day — one outlook, then observed activity */}
        {isViewingToday && (
          <>
            <DailyOutlookCard
              sharpness={sharpness}
              readiness={readiness}
              recovery={recoveryWithBoost}
              reasoningQuality={rq}
              signalCoverage={signalCoverage}
              activeSourceCount={activeSourceCount}
              passiveFeatures={passiveFeatures}
              isLoading={isDisplayLoading || passiveLoading}
            />
            <TodayActivitiesCard
              activeQualityTime={
                activeReasonSession
                  ? { type: activeReasonSession.session_type, isLive: true, bookTitle: null, count: 0 }
                  : activeBooks.length > 0
                  ? { type: "reading", isLive: false, bookTitle: activeBooks.length === 1 ? activeBooks[0].title : null, count: activeBooks.length }
                  : null
              }
            />
          </>
        )}
          </>}

        {activeTab === "intuition" && <IntuitionTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "reasoning" && <ReasoningTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "capacity" && <CapacityTab onBackToOverview={() => setActiveTab("overview")} />}
      </main>

      
      {/* Onboarding Tutorial - appears once after first login post-onboarding */}
      <OnboardingTutorial
        show={!healthAccessBlockingTutorial && showTutorial}
        onComplete={markTutorialComplete}
      />
      <FirstRunHealthAccess onVisibilityChange={setHealthAccessBlockingTutorial} />
    </>}
    </AppShell>;
};
export default Home;
