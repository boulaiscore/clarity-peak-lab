import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { CognitiveTasksSection, CognitiveTasksLegend, CognitiveLibrary } from "@/components/dashboard/CognitiveInputs";
import { 
  Zap, ChevronRight, Crown, 
  Gamepad2, BookMarked, Play, CheckCircle2, Library, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining } from "@/hooks/useDailyTraining";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingPlanId } from "@/lib/trainingPlans";
import { SessionPicker } from "@/components/app/SessionPicker";
import { GamesLibrary } from "@/components/app/GamesLibrary";
import { ContentDifficulty } from "@/lib/contentLibrary";
import { TrainHeader } from "@/components/app/TrainHeader";
import { WeeklyGoalCard } from "@/components/dashboard/WeeklyGoalCard";

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

export default function NeuroLab() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, isAreaLocked, canAccessNeuroActivation, canStartSession, remainingSessions, maxDailySessions } = usePremiumGating();
  const { isDailyCompleted, isInReminderWindow, reminderTime } = useDailyTraining();
  const { getNextSession, completedSessionTypes, sessionsCompleted, sessionsRequired, plan, weeklyXPEarned, weeklyGamesXP, weeklyContentXP, weeklyXPTarget } = useWeeklyProgress();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "neuro-activation" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);
  const [activeTab, setActiveTab] = useState("games");
  const [tasksSubTab, setTasksSubTab] = useState<"active" | "library">("active");
  
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

  const handleNeuroActivation = () => {
    if (!canAccessNeuroActivation()) {
      setPaywallFeature("neuro-activation");
      setPaywallFeatureName("Neuro Activation™");
      setShowPaywall(true);
      return;
    }
    navigate("/neuro-lab/neuro-activation");
  };

  const handleStartRecommended = () => {
    if (nextSession && recommendedAreas.length > 0) {
      setShowSessionPicker(true);
    }
  };

  return (
    <AppShell>
      <div className="px-5 py-5 max-w-md mx-auto">

        {/* Current Session Banner - Shows what to do based on plan */}
        {!isWeekComplete && nextSession ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-transparent border border-primary/30"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-primary font-medium uppercase tracking-wide">
                Today's Session
              </span>
            </div>
            
            <h2 className="text-[15px] font-semibold text-foreground mb-1">
              {nextSession.name}
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">
              {nextSession.description} • {nextSession.duration}
            </p>
            
            {/* Recommended Areas */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-muted-foreground">Train:</span>
              {recommendedAreas.slice(0, 2).map((areaId) => {
                const area = NEURO_LAB_AREAS.find(a => a.id === areaId);
                return (
                  <span 
                    key={areaId}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {area?.title || areaId}
                  </span>
                );
              })}
            </div>

            <button
              onClick={handleStartRecommended}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Session
            </button>
          </motion.div>
        ) : isWeekComplete ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-emerald-400">Week Complete!</h3>
                <p className="text-[11px] text-muted-foreground">
                  All {sessionsRequired} sessions done. Free training unlocked.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Neuro Activation */}
        <button
          onClick={handleNeuroActivation}
          className={cn(
            "w-full p-4 rounded-xl border transition-all duration-200 mb-5",
            "bg-gradient-to-br from-primary/12 to-transparent",
            "border-primary/25 hover:border-primary/40 active:scale-[0.98]",
            !canAccessNeuroActivation() && "opacity-80"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[14px]">Neuro Activation</h3>
              <p className="text-[11px] text-muted-foreground">
                5-min cognitive warm-up protocol
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {!canAccessNeuroActivation() && (
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-primary/15 rounded text-primary font-medium">
                  <Crown className="w-3 h-3" />
                  PRO
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </div>
        </button>

        {/* Weekly Goal - shared across Games/Tasks */}
        <WeeklyGoalCard />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="games" className="flex items-center gap-1.5 text-xs">
              <Gamepad2 className="w-3.5 h-3.5" />
              Games
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-xs">
              <BookMarked className="w-3.5 h-3.5" />
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games" className="mt-0">
            <GamesLibrary 
              onStartGame={handleEnterArea}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            {/* Sub-navigation for Tasks */}
            <div className="flex items-center gap-1 p-1.5 bg-card border border-border/50 rounded-xl mb-4">
              <button
                onClick={() => setTasksSubTab("active")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all",
                  tasksSubTab === "active" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <BookMarked className="w-3.5 h-3.5" />
                Active
              </button>
              <button
                onClick={() => setTasksSubTab("library")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all",
                  tasksSubTab === "library" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Library className="w-3.5 h-3.5" />
                Library
              </button>
            </div>

            {tasksSubTab === "active" ? (
              <div className="space-y-6">
                {/* Intro + Legend */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30 flex-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Passive training:</span> Curated content for deep cognitive development.
                    </p>
                  </div>
                  <CognitiveTasksLegend />
                </div>

                {/* Podcasts Section */}
                <CognitiveTasksSection 
                  type="podcast" 
                  title="Podcast"
                />

                {/* Books Section */}
                <CognitiveTasksSection 
                  type="book" 
                  title="Book"
                />

                {/* Articles Section */}
                <CognitiveTasksSection 
                  type="article" 
                  title="Reading"
                />
              </div>
            ) : (
              <CognitiveLibrary />
            )}
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
        weeklyXPEarned={weeklyXPEarned}
      />
    </AppShell>
  );
}