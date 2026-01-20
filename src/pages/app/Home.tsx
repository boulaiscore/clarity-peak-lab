import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Check, Leaf, Target, Flame, Star, Dumbbell, BookMarked, Smartphone, Zap, Ban, Brain, Clock, Headphones, BookOpen, FileText } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { useDailyRecoverySnapshot } from "@/hooks/useDailyRecoverySnapshot";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useInProgressTasks } from "@/hooks/useInProgressTasks";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { cn } from "@/lib/utils";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { DistractionLoadCard } from "@/components/app/DistractionLoadCard";
import { HomeTabs, HomeTabId } from "@/components/home/HomeTabs";
import { IntuitionTab } from "@/components/home/IntuitionTab";
import { ReasoningTab } from "@/components/home/ReasoningTab";
import { CapacityTab } from "@/components/home/CapacityTab";
import { ReasoningQualityCard } from "@/components/dashboard/ReasoningQualityCard";

// Circular progress ring component
interface RingProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  displayValue: string;
  microcopy?: string;
  icon?: React.ReactNode;
}

const ProgressRing = ({ value, max, size, strokeWidth, color, label, displayValue, microcopy, icon }: RingProps) => {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {icon}
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {displayValue}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">
        {label}
      </p>
      {microcopy && (
        <p className="mt-0.5 text-[8px] text-muted-foreground/60 text-center max-w-[80px] leading-tight">
          {microcopy}
        </p>
      )}
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
  const { sessionsCompleted, weeklyXPTarget, plan } = useWeeklyProgress();
  
  // Baseline calibration status - gates Games and Tasks
  const { isCalibrated, isLoading: baselineLoading } = useBaselineStatus();

  // Stable (no-flicker) weekly load totals
  const stableCognitiveLoad = useStableCognitiveLoad();
  const { cappedTotalXP, rawDetoxXP, detoxXPTarget, detoxProgress, detoxComplete } = stableCognitiveLoad;
  const totalWeeklyXP = cappedTotalXP;
  
  // Capped weekly progress for smart training reminders
  const { 
    cappedGamesXP, 
    gamesXPTarget,
    totalProgress,
  } = useCappedWeeklyProgress();
  
  // New cognitive engine metrics
  const { sharpness, readiness, recovery: recoveryRaw, isLoading: metricsLoading } = useTodayMetrics();

  // REC_effective for UI display (uses RRI until first real recovery activity)
  const {
    recoveryEffective,
    isUsingRRI,
    isLoading: recoveryEffectiveLoading,
  } = useRecoveryEffective();
  
  // Reasoning Quality metric
  const {
    rq,
    s2Core,
    s2Consistency,
    taskPriming,
    isDecaying: rqIsDecaying,
    isLoading: rqLoading,
  } = useReasoningQuality();
  
  // Fetch completed content IDs to filter out from in-progress
  const { data: completedIds = [] } = useQuery({
    queryKey: ["completed-content-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("exercise_id")
        .eq("user_id", user.id)
        .like("exercise_id", "content-%");
      
      if (error) throw error;
      
      return (data || []).map(c => {
        const parts = c.exercise_id.split("-");
        return parts.slice(2).join("-");
      });
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
  
  // In-progress tasks for reminder section (auto-filters completed items)
  const { getInProgressTasks } = useInProgressTasks(completedIds);
  
  // Daily recovery snapshot for decay tracking (idempotent - runs once per day)
  const { persistDailySnapshot, isSnapshotCurrentToday } = useDailyRecoverySnapshot();
  
  // Persist daily REC snapshot on mount (once per day only)
  useEffect(() => {
    // Only run if metrics are loaded and snapshot hasn't been taken today
    if (!metricsLoading && !isSnapshotCurrentToday()) {
      // IMPORTANT: Snapshot must use real recovery (REC_raw), not RRI
      persistDailySnapshot(recoveryRaw).catch((err) => {
        console.error("[Home] Failed to persist daily snapshot:", err);
      });
    }
  }, [metricsLoading, recoveryRaw, persistDailySnapshot, isSnapshotCurrentToday]);
  
  const [showProtocolSheet, setShowProtocolSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanId | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTabId>("overview");
  
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const hasProtocol = !!user?.trainingPlan;
  
  // Premium functional color system - fixed colors per metric
  // Low values are communicated by arc length and copy, not color
  const sharpnessColor = "hsl(210, 100%, 60%)";   // Electric blue
  const readinessColor = "hsl(245, 58%, 65%)";    // Soft indigo
  const recoveryColor = "hsl(174, 72%, 45%)";     // Teal

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



  // Get insight based on readiness - direct actionable tone
  const getInsight = () => {
    if (readiness >= 75) {
      return {
        title: "Today: train hard",
        body: "Your readiness is high — push intensity for maximum gains.",
        action: "Start training"
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
      body: "Readiness is low — do a detox or light reading instead.",
      action: "Start recovery"
    };
  };

  const insight = getInsight();

  // Baseline calibration not completed - show CTA to complete it
  if (!baselineLoading && !isCalibrated) {
    return (
      <AppShell>
        <main className="flex flex-col items-center justify-center min-h-[calc(100dvh-theme(spacing.12)-theme(spacing.14))] px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Complete Calibration</h1>
            <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
              A 2-minute cognitive baseline is required before training begins. 
              This establishes your personalized skill references.
            </p>
            <button
              onClick={() => navigate("/app/calibration")}
              className="inline-flex items-center px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              Begin Calibration
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </main>
      </AppShell>
    );
  }

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

        {/* Tab Navigation */}
        <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Three Rings with Cognitive Engine Metrics */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <div className="flex justify-center gap-6 mb-4">
                <ProgressRing
                  value={metricsLoading ? 0 : sharpness}
                  max={100}
                  size={90}
                  strokeWidth={6}
                  color={sharpnessColor}
                  label="Sharpness"
                  displayValue={metricsLoading ? "—" : `${Math.round(sharpness)}%`}
                  microcopy="Current intuitive clarity"
                />
                <ProgressRing
                  value={readiness}
                  max={100}
                  size={90}
                  strokeWidth={6}
                  color={readinessColor}
                  label="Readiness"
                  displayValue={`${Math.round(readiness)}%`}
                  microcopy="Capacity for deliberate work"
                />
                <ProgressRing
                  value={recoveryEffectiveLoading ? 0 : recoveryEffective}
                  max={100}
                  size={90}
                  strokeWidth={6}
                  color={recoveryColor}
                  label="Recovery"
                  displayValue={recoveryEffectiveLoading ? "—" : `${Math.round(recoveryEffective)}%`}
                  microcopy="Attentional restoration"
                />
              </div>
              
              {/* Explanatory line below rings */}
              <p className="text-center text-xs text-muted-foreground leading-relaxed px-4 mb-4">
                Today's cognitive state based on training and recovery inputs.
              </p>
              
              {/* Reasoning Quality Card */}
              <ReasoningQualityCard
                rq={rq}
                s2Core={s2Core}
                s2Consistency={s2Consistency}
                taskPriming={taskPriming}
                isDecaying={rqIsDecaying}
                isLoading={rqLoading}
              />
            </motion.section>

        {/* In-Progress Tasks Reminder */}
        {(() => {
          const inProgressTasks = getInProgressTasks();
          if (inProgressTasks.length === 0) return null;
          
          const getTaskIcon = (type: "podcast" | "book" | "article") => {
            switch (type) {
              case "podcast": return <Headphones className="w-4 h-4" />;
              case "book": return <BookOpen className="w-4 h-4" />;
              case "article": return <FileText className="w-4 h-4" />;
            }
          };
          
          return (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mb-4"
            >
              <button
                onClick={() => navigate("/neuro-lab?tab=tasks")}
                className="w-full p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {inProgressTasks.length} task{inProgressTasks.length > 1 ? 's' : ''} in progress
                  </span>
                </div>
                <div className="space-y-2">
                  {inProgressTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        {getTaskIcon(task.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Started {formatDistanceToNow(new Date(task.startedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {inProgressTasks.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">
                      +{inProgressTasks.length - 2} more
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Complete to add to Library
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </motion.section>
          );
        })()}
        {recoveryEffective < 45 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-4"
          >
              <button
                onClick={() => navigate("/neuro-lab?tab=tasks")}
                className="w-full p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <BookMarked className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Today: read or reflect
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      To restore cognitive capacity for tomorrow.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-500/60" />
                </div>
              </button>
          </motion.section>
        )}

        {/* Detox Engagement Card - Whoop-style motivation */}
        {!detoxComplete && (() => {
          const detoxRemaining = Math.max(0, detoxXPTarget - rawDetoxXP);
          const minutesRemaining = Math.round(detoxRemaining / 2); // ~2 XP per minute
          
          // Different messages based on progress
          const getDetoxMessage = () => {
            if (detoxProgress === 0) {
              return {
                headline: "Today: start your detox",
                body: `${minutesRemaining} min to go — to restore focus.`,
                urgency: "high"
              };
            }
            if (detoxProgress < 50) {
              return {
                headline: "Today: continue detox",
                body: `${minutesRemaining} min left — to hit your weekly target.`,
                urgency: "medium"
              };
            }
            if (detoxProgress < 100) {
              return {
                headline: "Today: finish detox",
                body: `${minutesRemaining} min left — to complete recovery.`,
                urgency: "low"
              };
            }
            return null;
          };
          
          const message = getDetoxMessage();
          if (!message) return null;
          
          return (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
                <button
                  onClick={() => navigate("/neuro-lab?tab=detox")}
                  className="w-full p-3.5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <Ban className="w-4 h-4 text-primary absolute inset-0" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-primary">{message.headline}</h3>
                        {message.urgency === "high" && (
                          <Zap className="w-3 h-3 text-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{message.body}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary/60" />
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2.5 h-1 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, detoxProgress)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </button>
            </motion.section>
          );
        })()}

        {/* Smart Training Reminder - based on XP progress */}
        {(() => {
          const xpRemaining = Math.max(0, gamesXPTarget - cappedGamesXP);
          const gamesNeeded = Math.ceil(xpRemaining / 20); // ~20 XP average per game
          
          // Only show if below 80% progress and there's work to do
          if (totalProgress >= 80 || xpRemaining <= 0) return null;
          
          return (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mb-4"
            >
              <button
                onClick={() => navigate("/neuro-lab")}
                className="w-full p-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Today: train to stay on track
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {xpRemaining} XP left — ~{gamesNeeded} game{gamesNeeded > 1 ? 's' : ''} to hit target
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500/60" />
                </div>
              </button>
            </motion.section>
          );
        })()}

        {/* Quick Status Cards - Protocol as cause */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <button 
            onClick={handleOpenProtocolSheet}
            className="p-4 rounded-xl bg-card border border-border/40 text-left hover:bg-muted/30 transition-colors active:scale-[0.98]"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Your Protocol
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {TRAINING_PLANS[currentPlan].name.replace(" Training", "")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-snug">
              Balancing intuition speed and reasoning depth.
            </p>
          </button>
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
              Weekly Capacity
            </p>
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-sm font-semibold tabular-nums text-amber-400">
                {totalWeeklyXP} <span className="text-muted-foreground font-normal">/ {weeklyXPTarget}</span>
              </p>
            </div>
            <div className="h-1 bg-amber-500/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalWeeklyXP / weeklyXPTarget) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-snug">
              {totalWeeklyXP >= weeklyXPTarget 
                ? "Capacity sustains intuition & reasoning."
                : "Build capacity for sharper cognition."
              }
            </p>
          </div>
        </motion.section>

          </>
        )}

        {activeTab === "intuition" && <IntuitionTab />}
        {activeTab === "reasoning" && <ReasoningTab />}
        {activeTab === "capacity" && <CapacityTab />}
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
              
              // Calculate XP breakdown using plan values (matches useCappedWeeklyProgress)
              const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
              const tasksXPTarget = plan.contentXPTarget;
              const gamesXPTarget = Math.max(0, plan.weeklyXPTarget - tasksXPTarget - detoxXPTarget);
              
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
                  
                  {/* Capacity Breakdown */}
                  <div className="ml-13 pl-13 border-t border-border/20 pt-2 mt-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-medium text-amber-400">{plan.weeklyXPTarget} CC/week</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <BookMarked className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-muted-foreground">
                          Tasks: <span className="text-purple-400 font-medium">{tasksXPTarget}</span>
                        </span>
                      </div>
                      {plan.detox && (
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3 h-3 text-teal-400" />
                          <span className="text-[10px] text-muted-foreground">
                            Walk & Detox: <span className="text-teal-400 font-medium">{detoxXPTarget}</span>
                            <span className="text-muted-foreground/60"> ({Math.round(plan.detox.weeklyMinutes / 60)}h)</span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-muted-foreground">
                          Training: <span className="text-blue-400 font-medium">{gamesXPTarget}</span>
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
