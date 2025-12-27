import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Check, Leaf, Target, Flame, Star, Gamepad2, BookMarked } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";
import { cn } from "@/lib/utils";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";

// XP split based on plan structure
const PLAN_XP_SPLIT: Record<TrainingPlanId, { gamesPercent: number; tasksPercent: number }> = {
  light: { gamesPercent: 0.75, tasksPercent: 0.25 },
  expert: { gamesPercent: 0.60, tasksPercent: 0.40 },
  superhuman: { gamesPercent: 0.58, tasksPercent: 0.42 },
};
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { DistractionLoadCard } from "@/components/app/DistractionLoadCard";

// Circular progress ring component
interface RingProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  displayValue: string;
}

const ProgressRing = ({ value, max, size, strokeWidth, color, label, displayValue }: RingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {displayValue}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
};

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const Home = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { sessionsCompleted, weeklyXPEarned, weeklyXPTarget, plan } = useWeeklyProgress();
  const { cognitiveReadinessScore, isLoading: readinessLoading } = useCognitiveReadiness();
  
  const [showProtocolSheet, setShowProtocolSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanId | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  

  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const hasProtocol = !!user?.trainingPlan;
  const readinessScore = cognitiveReadinessScore ?? 50;
  
  // Calculate cognitive performance (simulated based on weekly progress)
  const cognitivePerformance = Math.min(Math.round(65 + (sessionsCompleted * 8)), 100);
  
  // Weekly target progress
  const weeklyTarget = 3;
  const sessionsProgress = Math.min(sessionsCompleted / weeklyTarget, 1) * 100;

  const handleStartSession = () => {
    navigate("/neuro-lab");
  };

  const handleOpenProtocolSheet = () => {
    setSelectedPlan(currentPlan);
    setShowProtocolSheet(true);
  };

  const handleConfirmProtocolChange = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) {
      setShowProtocolSheet(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateUser({ trainingPlan: selectedPlan });
      toast({
        title: "Protocol updated",
        description: `Switched to ${TRAINING_PLANS[selectedPlan].name}`,
      });
      setShowProtocolSheet(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update protocol",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };


  // Get insight based on readiness
  const getInsight = () => {
    if (readinessScore >= 75) {
      return {
        title: "Peak condition",
        body: "Your cognitive system is operating at maximum capacity. This is the ideal time for high-load sessions. Push your limits today to consolidate your progress."
      };
    }
    if (readinessScore >= 55) {
      return {
        title: "Solid foundation",
        body: "You have room to work with controlled intensity. Focus on execution quality. Today's consistency builds tomorrow's performance."
      };
    }
    return {
      title: "Recovery phase",
      body: "Your system requires consolidation. A lighter session today will prepare optimal conditions for superior performance in the coming days."
    };
  };

  const insight = getInsight();

  // No protocol configured
  if (!hasProtocol) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <h1 className="text-xl font-semibold mb-2">Configure Protocol</h1>
            <p className="text-sm text-muted-foreground/60 mb-8">
              Assessment required before training
            </p>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Begin Assessment
            </button>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex flex-col min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-5 py-4 max-w-md mx-auto">

        {/* Three Rings - WHOOP style */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center gap-6 mb-8"
        >
          <ProgressRing
            value={readinessLoading ? 0 : readinessScore}
            max={100}
            size={90}
            strokeWidth={6}
            color="hsl(210, 70%, 55%)"
            label="Readiness"
            displayValue={readinessLoading ? "—" : `${Math.round(readinessScore)}%`}
          />
          <ProgressRing
            value={cognitivePerformance}
            max={100}
            size={90}
            strokeWidth={6}
            color="hsl(var(--primary))"
            label="Performance"
            displayValue={`${cognitivePerformance}%`}
          />
          <ProgressRing
            value={sessionsCompleted}
            max={weeklyTarget}
            size={90}
            strokeWidth={6}
            color="hsl(38, 92%, 50%)"
            label="Sessions"
            displayValue={`${sessionsCompleted}/${weeklyTarget}`}
          />
        </motion.section>

        {/* Distraction Load Card - Collapsible */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4"
        >
          <DistractionLoadCard />
        </motion.section>

        {/* Insight Card - Coaching message */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-8"
        >
          <div className="p-5 rounded-2xl bg-card border border-border/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-2">{insight.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.body}
                </p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 shrink-0">
                <Check className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Quick Status Cards */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <button 
            onClick={handleOpenProtocolSheet}
            className="p-4 rounded-xl bg-card border border-border/40 text-left hover:bg-muted/30 transition-colors active:scale-[0.98]"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Active Protocol
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {TRAINING_PLANS[currentPlan].name.replace(" Training", "")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Weekly XP
            </p>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-sm font-semibold tabular-nums text-amber-400">
                {weeklyXPEarned} <span className="text-muted-foreground font-normal">/ {weeklyXPTarget}</span>
              </p>
            </div>
            <div className="h-1 bg-amber-500/10 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (weeklyXPEarned / weeklyXPTarget) * 100)}%` }}
              />
            </div>
          </div>
        </motion.section>

        {/* Today's Session */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <button
            onClick={handleStartSession}
            className="w-full p-4 rounded-xl bg-card border border-border/40 flex items-center justify-between hover:bg-muted/30 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Today's session</p>
                <p className="text-xs text-muted-foreground">Heavy Slow Thinking · 30 min</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.section>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="pt-2"
        >
          <button
            onClick={handleStartSession}
            className={cn(
              "w-full py-4 rounded-xl",
              "bg-primary text-primary-foreground",
              "text-base font-semibold",
              "shadow-button",
              "active:scale-[0.98] transition-transform"
            )}
          >
            Start Training
          </button>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-3 uppercase tracking-[0.1em]">
            Focus: clarity under cognitive load
          </p>
        </motion.div>
      </main>

      {/* Protocol Change Sheet */}
      <Sheet open={showProtocolSheet} onOpenChange={setShowProtocolSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg">Change Protocol</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-3 mb-6">
            {(Object.keys(TRAINING_PLANS) as TrainingPlanId[]).map((planId) => {
              const plan = TRAINING_PLANS[planId];
              const PlanIcon = PLAN_ICONS[planId];
              const isSelected = selectedPlan === planId;
              const isCurrent = currentPlan === planId;
              
              // Calculate XP breakdown
              const split = PLAN_XP_SPLIT[planId];
              const gamesXPTarget = Math.round(plan.weeklyXPTarget * split.gamesPercent);
              const tasksXPTarget = Math.round(plan.weeklyXPTarget * split.tasksPercent);
              
              return (
                <button
                  key={planId}
                  onClick={() => setSelectedPlan(planId)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border/40 bg-card hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary/10" : "bg-muted/50"
                      )}>
                        <PlanIcon className={cn(
                          "w-5 h-5",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary"
                        )}>
                          {plan.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.sessionDuration}/session
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                        Current
                      </span>
                    )}
                    {isSelected && !isCurrent && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  
                  {/* XP Breakdown */}
                  <div className="ml-13 pl-13 border-t border-border/20 pt-2 mt-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-medium text-amber-400">{plan.weeklyXPTarget} XP/week</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Gamepad2 className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-muted-foreground">
                          Games: <span className="text-blue-400 font-medium">{gamesXPTarget}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookMarked className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-muted-foreground">
                          Tasks: <span className="text-purple-400 font-medium">{tasksXPTarget}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleConfirmProtocolChange}
            disabled={isUpdating || selectedPlan === currentPlan}
            className={cn(
              "w-full py-4 rounded-xl text-base font-semibold transition-all",
              selectedPlan && selectedPlan !== currentPlan
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isUpdating ? "Updating..." : "Confirm Change"}
          </button>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
};

export default Home;
