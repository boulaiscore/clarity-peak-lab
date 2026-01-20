import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { SpotifyTasksView } from "@/components/app/SpotifyTasksView";
import { 
  ChevronRight, Dumbbell,
  BookMarked, CheckCircle2, Smartphone, Ban, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining } from "@/hooks/useDailyTraining";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { SessionPicker } from "@/components/app/SessionPicker";
import { GamesLibrary } from "@/components/app/GamesLibrary";
import { ContentDifficulty } from "@/lib/contentLibrary";
import { WeeklyGoalCard } from "@/components/dashboard/WeeklyGoalCard";
import { DetoxChallengeTab } from "@/components/app/DetoxChallengeTab";
import { NeuralResetPrompt } from "@/components/neural-reset/NeuralResetPrompt";

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
  "reflection": ["reasoning", "creativity"],
};

function TasksTabContent() {
  return <SpotifyTasksView />;
}

export default function NeuroLab() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, isAreaLocked, canStartSession, remainingSessions, maxDailySessions } = usePremiumGating();
  const { isCalibrated, isLoading: baselineLoading } = useBaselineStatus();
  const { isDailyCompleted, isInReminderWindow, reminderTime } = useDailyTraining();
  const { getNextSession, completedSessionTypes, sessionsCompleted, sessionsRequired, plan, weeklyXPTarget } = useWeeklyProgress();
  // Use capped progress for the Weekly Load total (excess beyond category targets doesn't count)
  const { cappedTotalXP } = useCappedWeeklyProgress();
  const weeklyLoadXP = cappedTotalXP;
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);
  
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
    "reflection": "dense",
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
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Calibration Required</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Complete your baseline calibration before accessing training and tasks.
            </p>
            <button
              onClick={() => navigate("/app/calibration")}
              className="inline-flex items-center px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-4 max-w-md mx-auto space-y-0">

        {/* Week Complete Banner - Success styling with actionable CTA */}
        {isWeekComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
          >
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
              <button
                onClick={() => navigate("/app/report")}
                className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                View Report
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Neural Reset Prompt - contextual, not mandatory */}
        <NeuralResetPrompt className="mb-4" />

        {/* Weekly Goal - Compact */}
        <WeeklyGoalCard compact />

        {/* Main Tabs - Simplified */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10 mb-3 bg-muted/30">
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

          {/* Training Tab (Games) - First */}
          <TabsContent value="games" className="mt-0">
            <GamesLibrary 
              onStartGame={handleEnterArea}
            />
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

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={setShowPaywall}
        feature={paywallFeature}
        featureName={paywallFeatureName}
      />

      <DailyTrainingConfirmDialog
        open={showDailyConfirm}
        onOpenChange={setShowDailyConfirm}
        reminderTime={reminderTime || "08:00"}
        onConfirm={handleConfirmDailyTraining}
      />

      <SessionPicker
        open={showSessionPicker}
        onOpenChange={setShowSessionPicker}
        sessionName={nextSession?.name || "Training Session"}
        sessionDescription={nextSession?.description || ""}
        sessionType={nextSession?.id || null}
        recommendedAreas={recommendedAreas}
        contentDifficulty={sessionDifficulty}
        weeklyXPTarget={weeklyXPTarget}
        weeklyXPEarned={weeklyLoadXP}
      />
    </AppShell>
  );
}