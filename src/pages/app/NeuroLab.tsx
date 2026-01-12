import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { CognitiveTasksSection, CognitiveTasksLegend, CognitiveLibrary } from "@/components/dashboard/CognitiveInputs";
import { 
  Zap, ChevronRight, Crown, 
  Gamepad2, BookMarked, Play, CheckCircle2, Library, Star, Smartphone, Ban,
  Headphones, BookOpen, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
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
import { TrainHeader } from "@/components/app/TrainHeader";
import { WeeklyGoalCard } from "@/components/dashboard/WeeklyGoalCard";
import { DetoxChallengeTab } from "@/components/app/DetoxChallengeTab";

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

type TaskCategory = "podcast" | "book" | "article";

const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: typeof Headphones; color: string; bgColor: string }[] = [
  { id: "podcast", label: "Podcast", icon: Headphones, color: "text-violet-500", bgColor: "bg-violet-500/15" },
  { id: "book", label: "Book", icon: BookOpen, color: "text-amber-500", bgColor: "bg-amber-500/15" },
  { id: "article", label: "Reading", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/15" },
];

function TasksTabContent() {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>("podcast");
  const [viewMode, setViewMode] = useState<"active" | "library">("active");

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-1 bg-card border border-border/50 rounded-lg">
        <button
          onClick={() => setViewMode("active")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
            viewMode === "active" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <BookMarked className="w-3.5 h-3.5" />
          Active
        </button>
        <button
          onClick={() => setViewMode("library")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
            viewMode === "library" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Library className="w-3.5 h-3.5" />
          Library
        </button>
      </div>

      {viewMode === "active" ? (
        <>
          {/* Category Icon Tabs */}
          <div className="flex items-center justify-center gap-2">
            {TASK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                    isActive 
                      ? `${cat.bgColor} ring-1 ring-current ${cat.color}` 
                      : "bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isActive ? cat.bgColor : "bg-muted/30"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? cat.color : "text-muted-foreground")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? cat.color : "text-muted-foreground"
                  )}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
            
            {/* Legend */}
            <div className="ml-2">
              <CognitiveTasksLegend />
            </div>
          </div>

          {/* Selected Category Content */}
          <CognitiveTasksSection 
            type={activeCategory} 
            title={TASK_CATEGORIES.find(c => c.id === activeCategory)?.label || "Content"}
          />
        </>
      ) : (
        <CognitiveLibrary />
      )}
    </div>
  );
}

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
  const { getNextSession, completedSessionTypes, sessionsCompleted, sessionsRequired, plan, weeklyXPTarget } = useWeeklyProgress();
  // Use capped progress for the Weekly Load total (excess beyond category targets doesn't count)
  const { cappedTotalXP } = useCappedWeeklyProgress();
  const weeklyLoadXP = cappedTotalXP;
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "neuro-activation" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);
  
  // Read tab from URL query param, default to "games"
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromUrl === "tasks" || tabFromUrl === "detox") return tabFromUrl;
    return "games";
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

        {/* Week Complete Banner - only show when week is complete */}
        {isWeekComplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-2xl bg-success/10 border border-success/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-success">Week Complete!</h3>
                <p className="text-[11px] text-muted-foreground">
                  All {sessionsRequired} sessions done. Free training unlocked.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
        <WeeklyGoalCard compact />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="games" className="flex items-center gap-1.5 text-xs">
              <Gamepad2 className="w-3.5 h-3.5" />
              Games
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5 text-xs">
              <BookMarked className="w-3.5 h-3.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="detox" className="flex items-center gap-1.5 text-xs">
              <div className="relative w-3.5 h-3.5">
                <Smartphone className="w-3.5 h-3.5" />
                <Ban className="w-3.5 h-3.5 absolute inset-0" />
              </div>
              Detox
            </TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games" className="mt-0">
            <GamesLibrary 
              onStartGame={handleEnterArea}
            />
          </TabsContent>

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