import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { ReasonTabContent } from "@/components/lab";
import { ChevronRight, Dumbbell, BookMarked, CheckCircle2, Smartphone, Ban, Brain, Zap, Battery, BatteryLow, Settings2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining } from "@/hooks/useDailyTraining";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
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
  return <button onClick={onOpen} className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
      <Settings2 className="w-3.5 h-3.5" />
      <span>
        Protocol: <span className="font-medium text-foreground/80">{planName}</span>
      </span>
      <ChevronRight className="w-3 h-3 opacity-50" />
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

  // Dynamic guidance based on Recovery level
  const recoveryGuidance = useMemo(() => {
    if (recoveryLoading) {
      return {
        icon: Battery,
        iconColor: "text-muted-foreground",
        headline: "Loading your status...",
        message: "",
        action: ""
      };
    }
    const rec = recoveryEffective;

    // Peak (80+): Full intensity
    if (rec >= 80) {
      return {
        icon: Zap,
        iconColor: "text-emerald-400",
        headline: `Recovery ${Math.round(rec)}% — You're primed.`,
        message: "Your brain is ready for peak performance.",
        action: "Push hard with S2 games. This is your window for deep reasoning work."
      };
    }

    // Sharp (65-79): Good to go
    if (rec >= 65) {
      return {
        icon: Battery,
        iconColor: "text-emerald-400",
        headline: `Recovery ${Math.round(rec)}% — Strong.`,
        message: "Good energy for cognitive training.",
        action: "S2 games are unlocked. Balance intensity with a task or walk if needed."
      };
    }

    // Steady (50-64): Moderate, be strategic
    if (rec >= 50) {
      return {
        icon: Battery,
        iconColor: "text-amber-400",
        headline: `Recovery ${Math.round(rec)}% — Moderate.`,
        message: "You can train, but don't overdo it.",
        action: "S1 games + Quality Time are ideal. Consider Recover to boost recovery."
      };
    }

    // Foggy (35-49): Low, focus on recovery
    if (rec >= 35) {
      return {
        icon: BatteryLow,
        iconColor: "text-amber-500",
        headline: `Recovery ${Math.round(rec)}% — Low.`,
        message: "Your brain needs rest to perform.",
        action: "Skip intense training. Focus on Recover or light Quality Time to rebuild."
      };
    }

    // Drained (<35): Very low, prioritize recovery
    return {
      icon: BatteryLow,
      iconColor: "text-red-400",
      headline: `Recovery ${Math.round(rec)}% — Depleted.`,
      message: "Training now may backfire. Your brain needs recovery.",
      action: "Recover to rebuild. Quality Time is fine. Save Train for when you're recharged."
    };
  }, [recoveryEffective, recoveryLoading]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);
  const [showProtocolSheet, setShowProtocolSheet] = useState(false);

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
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Calibration Required</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Complete your baseline calibration before accessing training and tasks.
            </p>
            <button onClick={() => navigate("/app/calibration")} className="inline-flex items-center px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </div>
      </AppShell>;
  }
  return <AppShell>
      <div className="px-4 py-5 max-w-md mx-auto space-y-0">

        {/* NeuroLoop Explanation - Expandable WHOOP-style */}
        <Collapsible className="mb-5">
          <div className="border border-border/20 bg-muted/10 rounded-xl overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <LoomaLogo size={18} className="text-foreground/70" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  How LOOMA Lab Works
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-5 border-t border-border/20 pt-4">

                {/* Visual Training Loop */}
                <LoomaTrainingLoop />

                {/* Concept cards - scannable, one idea each */}
                <div className="space-y-3">
                  
                  {/* The Loop */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">Train → Recover → Repeat</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Cognitive games build sharpness. Detox and walking restore energy. Consistency drives adaptation.
                      </p>
                    </div>
                  </div>

                  {/* Cognitive Load */}
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

                  {/* S1 & S2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">S1 & S2 Game Systems</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        S1 trains fast thinking (attention, reaction). S2 trains slow thinking (reasoning, analysis). S2 games require higher Recovery to unlock.
                      </p>
                    </div>
                  </div>

                   {/* Quality Time & RQ */}
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

                {/* Key Insight */}
                <div className="pt-3 border-t border-border/15">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">Key:</span>{" "}
                    High recovery → push S2 games. Low recovery → Quality Time & Recover.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Cognitive Load Guidance - Dynamic based on Recovery */}
        <div className="p-3.5 rounded-xl bg-muted/15 border border-border/20 mb-1">
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5", recoveryGuidance.iconColor)}>
              <recoveryGuidance.icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-[13px] font-semibold text-foreground/90 leading-tight">
                {recoveryGuidance.headline}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {recoveryGuidance.message} {recoveryGuidance.action}
              </p>
            </div>
          </div>
        </div>

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
        <div className="mt-5">
          <WeeklyGoalCard compact />
        </div>
        
        {/* Protocol Change - Discrete Link */}
        <div className="mt-1 mb-2">
          <ProtocolLink onOpen={() => setShowProtocolSheet(true)} planName={TRAINING_PLANS[currentPlan].name.replace(" Training", "")} />
        </div>

        {/* Training Section - Distinct Background */}
        <div className="bg-muted/10 -mx-4 px-4 py-5 mt-5 rounded-t-2xl border-t border-border/15">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-10 mb-3 bg-background/60">
              <TabsTrigger value="games" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <Dumbbell className="w-3.5 h-3.5" />
                Train
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <BookMarked className="w-3.5 h-3.5" />
                Quality Time
              </TabsTrigger>
              <TabsTrigger value="detox" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <div className="relative w-3.5 h-3.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <Ban className="w-3.5 h-3.5 absolute inset-0" />
                </div>
                Recover
              </TabsTrigger>
            </TabsList>

            {/* Training Tab (Games) */}
            <TabsContent value="games" className="mt-0">
              <GamesLibrary onStartGame={handleEnterArea} />
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
      </div>

      <PremiumPaywall open={showPaywall} onOpenChange={setShowPaywall} feature={paywallFeature} featureName={paywallFeatureName} />

      <DailyTrainingConfirmDialog open={showDailyConfirm} onOpenChange={setShowDailyConfirm} reminderTime={reminderTime || "08:00"} onConfirm={handleConfirmDailyTraining} />

      <SessionPicker open={showSessionPicker} onOpenChange={setShowSessionPicker} sessionName={nextSession?.name || "Training Session"} sessionDescription={nextSession?.description || ""} sessionType={nextSession?.id || null} recommendedAreas={recommendedAreas} contentDifficulty={sessionDifficulty} weeklyXPTarget={weeklyXPTarget} weeklyXPEarned={weeklyLoadXP} />

      <ProtocolChangeSheet open={showProtocolSheet} onOpenChange={setShowProtocolSheet} />
    </AppShell>;
}