import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { format, subDays, addDays, isToday, parseISO, isBefore, startOfDay } from "date-fns";
import { useHistoricalMetrics, getDateDisplayLabel } from "@/hooks/useHistoricalMetrics";
import { useYesterdayMetrics, formatDeltaPercent } from "@/hooks/useYesterdayMetrics";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { useDailyRecoverySnapshot } from "@/hooks/useDailyRecoverySnapshot";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useTutorialState } from "@/hooks/useTutorialState";
import { useActiveBooks } from "@/hooks/useActiveBooks";
import { useActiveReasonSession } from "@/hooks/useReasonSessions";
import { cn } from "@/lib/utils";
import { HomeTabId } from "@/components/home/HomeTabs";
import { IntuitionTab } from "@/components/home/IntuitionTab";
import { ReasoningTab } from "@/components/home/ReasoningTab";
import { CapacityTab } from "@/components/home/CapacityTab";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";
import { CognitiveStateCard } from "@/components/home/CognitiveStateCard";
import { useAcuteRecoveryBoost } from "@/hooks/useAcuteRecoveryBoost";
import { applyBoostToRec } from "@/lib/recovery/acuteBoost";

import { TodayActivitiesCard } from "@/components/home/TodayActivitiesCard";
const Home = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();

  // Baseline calibration status - gates Games and Tasks
  const {
    isCalibrated,
    isLoading: baselineLoading
  } = useBaselineStatus();

  // Active books for "Currently Reading" card
  const { data: activeBooks = [] } = useActiveBooks();

  // Active Quality Time session (Reading / Listening) indicator
  const { data: activeReasonSession } = useActiveReasonSession();
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
    isLoading: recoveryEffectiveLoading
  } = useRecoveryEffective();

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
    ? applyBoostToRec(recoveryEffective, acuteBoost.activeBoost)
    : recoveryEffective;
  const displayRecovery = isViewingToday ? recoveryWithBoost : historicalMetrics?.recovery ?? 0;
  const displayRQ = isViewingToday ? rq : historicalMetrics?.reasoningQuality ?? 0;
  const isDisplayLoading = isViewingToday ? metricsLoading || recoveryEffectiveLoading : historicalLoading;
  const hasHistoricalData = !isViewingToday && historicalMetrics !== null;

  // Calculate deltas vs yesterday (only show for today view)
  const sharpnessDelta = isViewingToday ? formatDeltaPercent(sharpness, yesterdayMetrics?.sharpness ?? null) : null;
  const readinessDelta = isViewingToday ? formatDeltaPercent(readiness, yesterdayMetrics?.readiness ?? null) : null;
  const recoveryDelta = isViewingToday ? formatDeltaPercent(recoveryEffective, yesterdayMetrics?.recovery ?? null) : null;

  // Tutorial state - shows after first onboarding completion
  const {
    showTutorial,
    markTutorialComplete
  } = useTutorialState();
  const hasProtocol = !!user?.trainingPlan;

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
            
            <motion.div initial={false}>
              <CognitiveStateCard
                readiness={displayReadiness}
                recovery={displayRecovery}
                sharpness={displaySharpness}
                reasoningQuality={displayRQ}
                readinessDelta={readinessDelta}
                recoveryDelta={recoveryDelta}
                sharpnessDelta={sharpnessDelta}
                passiveFeatures={isViewingToday ? passiveFeatures : null}
                isLoading={isDisplayLoading}
                passiveLoading={passiveLoading}
                isHistorical={!isViewingToday}
                onReadiness={isViewingToday ? () => setActiveTab("reasoning") : undefined}
                onRecovery={isViewingToday ? () => setActiveTab("capacity") : undefined}
                onSharpness={isViewingToday ? () => setActiveTab("intuition") : undefined}
              />
            </motion.div>


        {/* My Day — Daily Outlook + Today's Activities */}
        {isViewingToday && (
          <TodayActivitiesCard
            activeQualityTime={
              activeReasonSession
                ? { type: activeReasonSession.session_type, isLive: true, bookTitle: null, count: 0 }
                : activeBooks.length > 0
                ? { type: "reading", isLive: false, bookTitle: activeBooks.length === 1 ? activeBooks[0].title : null, count: activeBooks.length }
                : null
            }
          />
        )}

        {/* Single priority — Whoop-style focus, secondary suggestions removed for calm */}
          </>}

        {activeTab === "intuition" && <IntuitionTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "reasoning" && <ReasoningTab onBackToOverview={() => setActiveTab("overview")} />}
        {activeTab === "capacity" && <CapacityTab onBackToOverview={() => setActiveTab("overview")} />}
      </main>

      
      {/* Onboarding Tutorial - appears once after first login post-onboarding */}
      <OnboardingTutorial show={showTutorial} onComplete={markTutorialComplete} />
      </>}
    </AppShell>;
};
export default Home;
