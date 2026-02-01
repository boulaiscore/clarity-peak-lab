import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { SpotifyTasksView } from "@/components/app/SpotifyTasksView";
import { ChevronRight, Dumbbell, BookMarked, CheckCircle2, Smartphone, Ban, Brain, Zap, Battery, BatteryLow, Settings2 } from "lucide-react";
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
import { NLOOPLogo } from "@/components/ui/NLOOPLogo";

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
  return <SpotifyTasksView />;
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
        action: "S1 games + Tasks are ideal. Consider a detox or walk to boost recovery."
      };
    }

    // Foggy (35-49): Low, focus on recovery
    if (rec >= 35) {
      return {
        icon: BatteryLow,
        iconColor: "text-amber-500",
        headline: `Recovery ${Math.round(rec)}% — Low.`,
        message: "Your brain needs rest to perform.",
        action: "Skip intense training. Focus on detox, walking, or light tasks to rebuild."
      };
    }

    // Drained (<35): Very low, prioritize recovery
    return {
      icon: BatteryLow,
      iconColor: "text-red-400",
      headline: `Recovery ${Math.round(rec)}% — Depleted.`,
      message: "Training now may backfire. Your brain needs recovery.",
      action: "Detox and walk to rebuild. Tasks are fine. Save games for when you're recharged."
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
      <div className="px-4 py-4 max-w-md mx-auto space-y-0">

        {/* NeuroLoop Explanation - Expandable WHOOP-style */}
        <Collapsible className="mb-4">
          <div className="border border-border/30 bg-background">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-muted border-muted">
              <div className="flex items-center gap-3">
                <NLOOPLogo size={20} className="text-foreground" />
                <span className="text-[13px] font-bold uppercase tracking-wide text-foreground">
                  How NLOOP Works
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4 border-t border-foreground/20 pt-4">
                
                {/* Step 1: The Cycle */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step 1 — The Training Cycle
                  </h4>
                  <p className="text-[12px] text-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">Train</span> with cognitive games targeting Fast (S1) and Slow (S2) thinking systems.{" "}
                    <span className="font-semibold text-foreground">Recover</span> through digital detox and walking sessions.{" "}
                    <span className="font-semibold text-foreground">Repeat</span> — your brain adapts best with consistent, spaced practice.
                  </p>
                </div>

                {/* Step 2: Cognitive Load & Optimal Zone */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step 2 — Cognitive Load & Optimal Zone
                  </h4>
                  <p className="text-[12px] text-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">Cognitive Load</span> measures your weekly training volume in XP. 
                    The <span className="font-semibold text-foreground">Optimal Zone</span> is your personalized target range — 
                    stay within it for sustainable cognitive gains without burnout. 
                    Too little = no adaptation. Too much = diminishing returns.
                  </p>
                </div>

                {/* Step 3: Games & Systems */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step 3 — Training Games (S1 & S2)
                  </h4>
                  <p className="text-[12px] text-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">S1 Games</span> train fast, intuitive thinking (attention, reaction, pattern recognition).{" "}
                    <span className="font-semibold text-foreground">S2 Games</span> train slow, deliberate thinking (reasoning, analysis, problem-solving).
                    Games improve your core metrics: <span className="italic">Attentional Efficiency, Reasoning Accuracy, Cognitive Throughput, and Insight.</span>
                  </p>
                </div>

                {/* Step 4: Locked Games */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step 4 — Why Some Games Are Locked
                  </h4>
                  <p className="text-[12px] text-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">S2 games require higher Recovery</span> because they demand more cognitive resources. 
                    When your Recovery is low, intense reasoning work can backfire. 
                    The system protects you by gating S2 games until you're ready.
                    <span className="italic text-muted-foreground"> Premium unlocks all games regardless of recovery level.</span>
                  </p>
                </div>

                {/* Step 5: Tasks */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Step 5 — Tasks & Recovery
                  </h4>
                  <p className="text-[12px] text-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">Tasks</span> are low-intensity activities (reading, podcasts, journaling) that contribute to your weekly XP while being gentler on cognitive resources.
                    They're ideal when Recovery is low. <span className="font-semibold text-foreground">Detox & Walking</span> sessions actively restore your Recovery score — think of them as "cognitive rest days."
                  </p>
                </div>

                {/* Key Insight */}
                <div className="mt-3 pt-3 border-t border-foreground/10">
                  <p className="text-[11px] text-foreground/70 italic">
                    <span className="font-semibold text-foreground not-italic">Key insight:</span>{" "}
                    High recovery → push hard with S2 games. Low recovery → prioritize tasks, detox, and walking.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

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

        {/* Cognitive Load Guidance - Dynamic based on Recovery */}
        <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5", recoveryGuidance.iconColor)}>
              <recoveryGuidance.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[14px] font-semibold text-foreground leading-tight">
                {recoveryGuidance.headline}
              </p>
              <p className="text-[12px] text-foreground/70 leading-relaxed">
                {recoveryGuidance.message}
              </p>
              <p className="text-[12px] text-foreground/90 leading-relaxed font-medium">
                {recoveryGuidance.action}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Goal - Compact */}
        <WeeklyGoalCard compact />
        
        {/* Protocol Change - Discrete Link */}
        <ProtocolLink onOpen={() => setShowProtocolSheet(true)} planName={TRAINING_PLANS[currentPlan].name.replace(" Training", "")} />


        {/* Training Section - Distinct Background */}
        <div className="bg-muted/20 -mx-4 px-4 py-4 mt-4 rounded-t-2xl">
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-10 mb-3 bg-background/60">
              <TabsTrigger value="games" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <Dumbbell className="w-3.5 h-3.5" />
                Training
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <BookMarked className="w-3.5 h-3.5" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="detox" className="flex items-center gap-1.5 text-[11px] data-[state=active]:bg-background">
                <div className="relative w-3.5 h-3.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <Ban className="w-3.5 h-3.5 absolute inset-0" />
                </div>
                Detox & Walk
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