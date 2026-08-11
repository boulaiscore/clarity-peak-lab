import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { ReasonTabContent } from "@/components/lab";
import { ChevronRight, Dumbbell, BookMarked, CheckCircle2, Zap, Settings2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining, useDailyTrainingStreak } from "@/hooks/useDailyTraining";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
import { SessionPicker } from "@/components/app/SessionPicker";
import { GamesLibrary } from "@/components/app/GamesLibrary";
import { ContentDifficulty } from "@/lib/contentLibrary";
import { WeeklyGoalCard } from "@/components/dashboard/WeeklyGoalCard";
import { DetoxChallengeTab } from "@/components/app/DetoxChallengeTab";
import { ProtocolChangeSheet } from "@/components/app/ProtocolChangeSheet";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { LoomaTrainingLoop } from "@/components/app/LoomaTrainingLoop";
import { deriveDailyCognitiveState } from "@/lib/dailyCognitiveState";

// Map session types to recommended game areas
const SESSION_TO_AREAS: Record<string, NeuroLabArea[]> = {
  "fast-focus": ["focus"],
  "mixed": ["focus", "reasoning"],
  "consolidation": ["reasoning", "creativity"],
  "fast-control": ["focus"],
  "slow-reasoning": ["reasoning", "creativity"],
  "dual-process": ["focus", "reasoning"],
  "heavy-slow": ["reasoning", "creativity"],
  "dual-stress": ["focus", "reasoning"],
  "reflection": ["reasoning", "creativity"]
};
function TasksTabContent() {
  return <ReasonTabContent />;
}

// Discrete protocol change link - elegant and non-invasive
function ProtocolLink({
  onOpen,
  planName
}: {
  onOpen: () => void;
  planName: string;
}) {
  return <button onClick={onOpen} className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60 transition-colors hover:text-foreground">
      <Settings2 className="h-3 w-3" />
      <span>{planName}</span>
      <ChevronRight className="h-3 w-3 opacity-45" />
    </button>;
}
export default function NeuroLab() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user
  } = useAuth();
  const {
    isPremium,
    isAreaLocked,
    canStartSession,
    remainingSessions,
    maxDailySessions
  } = usePremiumGating();
  const {
    isCalibrated,
    isLoading: baselineLoading
  } = useBaselineStatus();
  const {
    isDailyCompleted,
    isInReminderWindow,
    reminderTime
  } = useDailyTraining();
  const { data: streakData } = useDailyTrainingStreak(user?.id);
  const {
    getNextSession,
    completedSessionTypes,
    sessionsCompleted,
    sessionsRequired,
    plan,
    weeklyXPTarget
  } = useWeeklyProgress();
  // Use capped progress for the Weekly Load total (excess beyond category targets doesn't count)
  const {
    cappedTotalXP
  } = useCappedWeeklyProgress();
  const weeklyLoadXP = cappedTotalXP;

  // Recovery for dynamic guidance
  const {
    recoveryEffective,
    isLoading: recoveryLoading
  } = useRecoveryEffective();
  const {
    sharpness,
    readiness,
    isLoading: metricsLoading,
  } = useTodayMetrics();
  const { rq, isLoading: reasoningLoading } = useReasoningQuality();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "session-limit" | "three-day-streak">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);
  const [showProtocolSheet, setShowProtocolSheet] = useState(false);

  useEffect(() => {
    if (isPremium || streakData?.streak !== 3 || !user?.id) return;
    const key = `looma_three_day_streak_paywall:${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "shown");
    setPaywallFeature("three-day-streak");
    setPaywallFeatureName("");
    setShowPaywall(true);
  }, [isPremium, streakData?.streak, user?.id]);

  // Current training plan for display
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;

  // Read tab from URL query param, default to "games" (Training first)
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromUrl === "tasks" || tabFromUrl === "detox") return tabFromUrl;
    return "games"; // Training as default
  });

  // Sync activeTab when URL changes
  useEffect(() => {
    if (tabFromUrl === "tasks" || tabFromUrl === "detox" || tabFromUrl === "games") {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Scroll to top whenever the active sub-tab changes (parity with route changes)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activeTab]);

  // Auto-open session picker if continuing session
  const continueSession = searchParams.get("continueSession") === "true";
  const [showSessionPicker, setShowSessionPicker] = useState(continueSession);
  const trainingPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const nextSession = getNextSession();
  const recommendedAreas = nextSession ? SESSION_TO_AREAS[nextSession.id] || [] : [];
  const isWeekComplete = sessionsCompleted >= sessionsRequired;

  // Map session type to content difficulty
  const SESSION_DIFFICULTY: Record<string, ContentDifficulty> = {
    "fast-focus": "light",
    "mixed": "medium",
    "consolidation": "medium",
    "fast-control": "light",
    "slow-reasoning": "dense",
    "dual-process": "medium",
    "heavy-slow": "dense",
    "dual-stress": "medium",
    "reflection": "dense"
  };
  const sessionDifficulty = nextSession ? SESSION_DIFFICULTY[nextSession.id] || "medium" : "medium";
  const handleEnterArea = (areaId: NeuroLabArea) => {
    if (!canStartSession()) {
      setPaywallFeature("session-limit");
      setPaywallFeatureName("");
      setShowPaywall(true);
      return;
    }
    if (isAreaLocked(areaId)) {
      const area = NEURO_LAB_AREAS.find(a => a.id === areaId);
      setPaywallFeature("area");
      setPaywallFeatureName(area?.title || "");
      setShowPaywall(true);
      return;
    }
    if (!isDailyCompleted && !isInReminderWindow && reminderTime) {
      setPendingAreaId(areaId);
      setShowDailyConfirm(true);
      return;
    }
    navigateToArea(areaId);
  };
  const navigateToArea = (areaId: NeuroLabArea) => {
    const isDailyTraining = !isDailyCompleted;
    navigate(`/neuro-lab/${areaId}?daily=${isDailyTraining}`);
  };
  const handleConfirmDailyTraining = () => {
    if (pendingAreaId) {
      navigateToArea(pendingAreaId);
      setShowDailyConfirm(false);
      setPendingAreaId(null);
    }
  };
  const handleStartRecommended = () => {
    if (nextSession && recommendedAreas.length > 0) {
      setShowSessionPicker(true);
    }
  };

  // SANITY CHECK: Block Games and Tasks if baseline not completed
  if (!baselineLoading && !isCalibrated) {
    return <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5">
              <LoomaLogo size={28} className="text-background" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Calibration Required</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Complete your baseline calibration before accessing training and tasks.
            </p>
            <button onClick={() => navigate("/app/calibration")} className="inline-flex items-center rounded-xl border border-foreground/15 bg-foreground px-5 py-3 text-sm font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98]">
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </div>
      </AppShell>;
  }
  return <AppShell>
      {({ passiveFeatures, isLoading: passiveLoading }) => <>
      <div className="mx-auto max-w-md px-4 pb-5 pt-4">
        <header className="mb-4 flex items-center justify-between px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/80">Lab</p>
          <ProtocolLink onOpen={() => setShowProtocolSheet(true)} planName={TRAINING_PLANS[currentPlan].name.replace(" Training", "")} />
        </header>
        {/* Today's recommended action — single dominant CTA */}
        {(() => {
          const guidance = deriveDailyCognitiveState({
            readiness,
            recovery: recoveryEffective,
            sharpness,
            reasoningQuality: rq,
            healthScore: passiveFeatures?.coachContext.healthScore,
            attentionLoadRatio: passiveFeatures?.coachContext.attentionLoadRatio,
            scheduleLoadRatio: passiveFeatures?.coachContext.scheduleLoadRatio,
          });
          const isGuidanceLoading = recoveryLoading || metricsLoading || reasoningLoading || passiveLoading;
          const handleGuidanceAction = () => {
            if (guidance.actionRoute.includes("tab=detox")) setActiveTab("detox");
            else if (guidance.actionRoute.includes("tab=tasks")) setActiveTab("tasks");
            else if (guidance.actionRoute.includes("tab=games")) setActiveTab("games");
            else navigate(guidance.actionRoute);
          };
          const isRecoveryAction = guidance.actionRoute.includes("tab=detox");
          const isQualityTimeAction = guidance.actionRoute.includes("tab=tasks");
          const isTrainingAction = guidance.actionRoute.includes("tab=games");
          const GuidanceIcon = isRecoveryAction
            ? RefreshCw
            : isQualityTimeAction
              ? BookMarked
              : isTrainingAction
                ? Dumbbell
                : Zap;
          return (
            <div className="mb-2 rounded-[20px] border border-white/[0.065] bg-gradient-to-b from-white/[0.04] to-white/[0.018] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="flex items-start gap-3">
                <GuidanceIcon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    isRecoveryAction && "text-teal-300/85",
                    isQualityTimeAction && "text-amber-300/80",
                    isTrainingAction && "text-emerald-300/85",
                    !isRecoveryAction && !isQualityTimeAction && !isTrainingAction && "text-foreground/55",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/58">
                    Today&apos;s recommended action
                  </p>
                  <p className="mt-2 text-[14px] font-semibold leading-tight text-foreground/95">
                    {isGuidanceLoading ? "Updating your state" : guidance.headline}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/72">
                    {isGuidanceLoading ? "Syncing passive signals." : guidance.summary}
                  </p>
                </div>
              </div>
              {!isGuidanceLoading && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleGuidanceAction}
                    className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/72 transition-colors hover:text-foreground"
                  >
                    {guidance.actionLabel} <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Week Complete Banner - Success styling with actionable CTA */}
        {isWeekComplete && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-emerald-400">Weekly goal reached</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Keep the rhythm or explore freely.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate("/app/report")} className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                View Report
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>}

        {/* Weekly Goal - Compact */}
        <div>
          <WeeklyGoalCard compact />
        </div>

        {/* Training Section */}
        <div className="mt-6 border-t border-white/[0.055] pt-4">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 grid h-9 w-full grid-cols-3 rounded-[11px] border border-white/[0.055] bg-black/20 p-[3px]">
              <TabsTrigger value="games" className="rounded-[8px] text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/65 data-[state=active]:bg-white/[0.075] data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Train
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-[8px] text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/65 data-[state=active]:bg-white/[0.075] data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Quality Time
              </TabsTrigger>
              <TabsTrigger value="detox" className="rounded-[8px] text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/65 data-[state=active]:bg-white/[0.075] data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Recover
              </TabsTrigger>
            </TabsList>

            {/* Training Tab (Games) */}
            <TabsContent value="games" className="mt-0">
              <GamesLibrary onStartGame={handleEnterArea} recoveryEffective={recoveryEffective} />
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-0">
              <TasksTabContent />
            </TabsContent>

            {/* Detox Tab */}
            <TabsContent value="detox" className="mt-0">
              <DetoxChallengeTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* How LOOMA Lab Works — moved to bottom */}
        <Collapsible className="mt-5">
          <div className="overflow-hidden border-y border-white/[0.055]">
            <CollapsibleTrigger className="flex w-full items-center justify-between py-3 transition-colors hover:text-foreground">
              <div className="flex items-center gap-3">
                <LoomaLogo size={15} className="text-foreground/65" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  How LOOMA Lab Works
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-5 border-t border-border/20 pt-4">
                <LoomaTrainingLoop />
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Train → Recover → Repeat</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Cognitive drills build sharpness. Detox and walking restore energy. Consistency drives adaptation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Cognitive Load & Optimal Zone</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Weekly XP measures your training volume. Stay in the Optimal Zone — too little means no growth, too much leads to diminishing returns.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">S1 & S2 Game Systems</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        S1 trains fast thinking (attention, reaction). S2 trains slow thinking (reasoning, analysis). S2 drills require higher Recovery to unlock.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BookMarked className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Quality Time → Reasoning Quality</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Reading and listening don't earn XP — they boost your RQ score, which measures cognitive priming depth over time.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/15">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">Key:</span>{" "}
                    High recovery → push S2 drills. Low recovery → Quality Time & Recover.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <PremiumPaywall open={showPaywall} onOpenChange={setShowPaywall} feature={paywallFeature} featureName={paywallFeatureName} />

      <DailyTrainingConfirmDialog open={showDailyConfirm} onOpenChange={setShowDailyConfirm} reminderTime={reminderTime || "08:00"} onConfirm={handleConfirmDailyTraining} />

      <SessionPicker open={showSessionPicker} onOpenChange={setShowSessionPicker} sessionName={nextSession?.name || "Training Session"} sessionDescription={nextSession?.description || ""} sessionType={nextSession?.id || null} recommendedAreas={recommendedAreas} contentDifficulty={sessionDifficulty} weeklyXPTarget={weeklyXPTarget} weeklyXPEarned={weeklyLoadXP} />

      <ProtocolChangeSheet open={showProtocolSheet} onOpenChange={setShowProtocolSheet} />
      </>}
    </AppShell>;
}
