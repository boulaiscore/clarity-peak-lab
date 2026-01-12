import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Check, Leaf, Target, Flame, Star, Gamepad2, BookMarked, Smartphone, Zap, Ban, Layers } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";
import { useUserMetrics } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";

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

  // Stable (no-flicker) weekly load totals
  const stableCognitiveLoad = useStableCognitiveLoad();
  const { cappedTotalXP, rawDetoxXP, detoxXPTarget, detoxProgress, detoxComplete } = stableCognitiveLoad;
  const totalWeeklyXP = cappedTotalXP;
  const { cognitiveReadinessScore, isLoading: readinessLoading, cognitiveMetrics } = useCognitiveReadiness();
  const { data: userMetrics } = useUserMetrics(user?.id);
  
  const [showProtocolSheet, setShowProtocolSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanId | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  

  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const hasProtocol = !!user?.trainingPlan;
  const readinessScore = cognitiveReadinessScore ?? 50;
  
  // Calculate cognitive performance from ACTUAL metrics (not simplified formula)
  const cognitivePerformance = useMemo(() => {
    const metrics = userMetrics || cognitiveMetrics;
    if (!metrics) return 50; // Default starting point
    
    // Average of key cognitive metrics for a holistic performance score
    const scores = [
      metrics.reasoning_accuracy ?? 50,
      metrics.focus_stability ?? 50,
      metrics.fast_thinking ?? 50,
      metrics.slow_thinking ?? 50,
      metrics.creativity ?? 50,
    ];
    
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round(avg);
  }, [userMetrics, cognitiveMetrics]);
  
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



  // Get insight based on readiness - with cause-effect messaging
  const getInsight = () => {
    const planName = TRAINING_PLANS[currentPlan].name.replace(" Training", "");
    
    if (readinessScore >= 75) {
      return {
        title: "Optimal window",
        body: `Your ${planName} protocol detected peak readiness. High-intensity training today will have 2x impact on memory consolidation tonight.`,
        action: "Push intensity"
      };
    }
    if (readinessScore >= 55) {
      return {
        title: "Stable foundation",
        body: `Conditions support your ${planName} load. Training now maintains the cognitive edge you've built—skipping starts a 48h decline curve.`,
        action: "Maintain momentum"
      };
    }
    return {
      title: "Strategic recovery",
      body: `Your ${planName} protocol recommends lighter load today. This protects System 1 speed while preserving System 2 depth for tomorrow's peak performance.`,
      action: "Protect tomorrow"
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

        {/* Three Rings with Cognitive Interpretations */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex justify-center gap-6 mb-4">
            <ProgressRing
              value={readinessLoading ? 0 : readinessScore}
              max={100}
              size={90}
              strokeWidth={6}
              color="hsl(210, 70%, 55%)"
              label="System 1 Readiness"
              displayValue={readinessLoading ? "—" : `${Math.round(readinessScore)}%`}
              microcopy="Intuition and reaction capacity"
            />
            <ProgressRing
              value={cognitivePerformance}
              max={100}
              size={90}
              strokeWidth={6}
              color="hsl(var(--primary))"
              label="System 2 Performance"
              displayValue={`${cognitivePerformance}%`}
              microcopy="Reasoning depth and cognitive control"
            />
            {/* Cognitive Load - Energy Core */}
            <div className="flex flex-col items-center">
              <div className="relative w-[90px] h-[90px] flex items-center justify-center">
                {/* Outer glow ring - intensity based on progress */}
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, transparent 40%, hsl(38, 92%, 50%, ${0.05 + (totalWeeklyXP / weeklyXPTarget) * 0.15}) 70%, transparent 100%)`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Middle pulse ring */}
                <motion.div 
                  className="absolute w-16 h-16 rounded-full border border-amber-400/20"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
                
                {/* Core energy orb */}
                <motion.div 
                  className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, 
                      hsl(38, 92%, 65%) 0%, 
                      hsl(38, 92%, 50%) 40%, 
                      hsl(38, 80%, 35%) 100%)`,
                    boxShadow: `
                      0 0 ${10 + (totalWeeklyXP / weeklyXPTarget) * 20}px hsl(38, 92%, 50%, ${0.3 + (totalWeeklyXP / weeklyXPTarget) * 0.4}),
                      inset 0 -4px 8px hsl(38, 80%, 30%, 0.4),
                      inset 0 4px 8px hsl(38, 100%, 80%, 0.3)
                    `,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 ${10 + (totalWeeklyXP / weeklyXPTarget) * 20}px hsl(38, 92%, 50%, ${0.3 + (totalWeeklyXP / weeklyXPTarget) * 0.4}), inset 0 -4px 8px hsl(38, 80%, 30%, 0.4), inset 0 4px 8px hsl(38, 100%, 80%, 0.3)`,
                      `0 0 ${15 + (totalWeeklyXP / weeklyXPTarget) * 25}px hsl(38, 92%, 50%, ${0.4 + (totalWeeklyXP / weeklyXPTarget) * 0.5}), inset 0 -4px 8px hsl(38, 80%, 30%, 0.4), inset 0 4px 8px hsl(38, 100%, 80%, 0.3)`,
                      `0 0 ${10 + (totalWeeklyXP / weeklyXPTarget) * 20}px hsl(38, 92%, 50%, ${0.3 + (totalWeeklyXP / weeklyXPTarget) * 0.4}), inset 0 -4px 8px hsl(38, 80%, 30%, 0.4), inset 0 4px 8px hsl(38, 100%, 80%, 0.3)`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Inner highlight */}
                  <div className="absolute top-1.5 left-2 w-3 h-2 rounded-full bg-white/30 blur-sm" />
                  
                  {/* Charging particles effect when not full */}
                  {totalWeeklyXP < weeklyXPTarget && (
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute top-1 left-1/2 w-1 h-1 rounded-full bg-amber-200/60" />
                      <div className="absolute bottom-2 right-1 w-0.5 h-0.5 rounded-full bg-amber-100/40" />
                    </motion.div>
                  )}
                </motion.div>
                
                {/* XP value below orb */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-baseline gap-0.5">
                  <span className="text-base font-bold text-amber-400 tabular-nums">{totalWeeklyXP}</span>
                  <span className="text-[9px] text-amber-400/60">XP</span>
                </div>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">
                Cognitive Load
              </p>
              <p className="mt-0.5 text-[8px] text-muted-foreground/60 text-center max-w-[80px] leading-tight">
                Adaptive cognitive strain
              </p>
            </div>
          </div>
          
          {/* Explanatory line below rings */}
          <p className="text-center text-xs text-muted-foreground leading-relaxed px-4">
            The first session of the week calibrates your intuition–reasoning balance.
          </p>
        </motion.section>

        {/* Detox Engagement Card - Whoop-style motivation */}
        {!detoxComplete && (() => {
          const detoxRemaining = Math.max(0, detoxXPTarget - rawDetoxXP);
          const minutesRemaining = Math.round(detoxRemaining / 2); // ~2 XP per minute
          
          // Different messages based on progress
          const getDetoxMessage = () => {
            if (detoxProgress === 0) {
              return {
                headline: "Your mental sharpness is waiting",
                body: `${minutesRemaining} minutes of digital detox unlocks peak cognitive clarity. Every minute of focus compounds into faster reaction time.`,
                metric: `+${Math.round(detoxXPTarget * 0.15)}% sharpness potential`,
                urgency: "high"
              };
            }
            if (detoxProgress < 50) {
              return {
                headline: "You're building mental edge",
                body: `${minutesRemaining} min left to hit your detox target. Your prefrontal cortex is recalibrating—don't break the chain.`,
                metric: `${Math.round(detoxProgress)}% → 100% clarity`,
                urgency: "medium"
              };
            }
            if (detoxProgress < 100) {
              return {
                headline: "Almost there—finish strong",
                body: `Just ${minutesRemaining} min to lock in this week's cognitive gains. Your attention span is sharpening with every session.`,
                metric: `${Math.round(100 - detoxProgress)}% to peak focus`,
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
                className="w-full p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 hover:border-teal-500/40 transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-teal-400" />
                      <Ban className="w-4 h-4 text-teal-400 absolute inset-0" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-teal-300">{message.headline}</h3>
                      {message.urgency === "high" && (
                        <Zap className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {message.body}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-teal-400 uppercase tracking-wide">
                        {message.metric}
                      </span>
                      <ChevronRight className="w-4 h-4 text-teal-400/60" />
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-teal-500/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, detoxProgress)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </button>
            </motion.section>
          );
        })()}

        {/* Distraction Load Card - Collapsible */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4"
        >
          <DistractionLoadCard />
        </motion.section>

        {/* Insight Card - Protocol-driven coaching with cause-effect */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6"
        >
          <div className="p-5 rounded-2xl bg-card border border-border/40">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    readinessScore >= 75 ? "bg-emerald-400" : readinessScore >= 55 ? "bg-amber-400" : "bg-blue-400"
                  )} />
                  <h3 className="text-sm font-semibold">{insight.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {insight.body}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-primary font-medium">
                  → {insight.action}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

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
              Weekly Cognitive Load
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
                ? "XP build long-term cognitive adaptations."
                : "XP build long-term cognitive adaptations."
              }
            </p>
          </div>
        </motion.section>

        {/* Primary CTA with consequence framing */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
            Go To Lab
          </button>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
            Train intuition and critical reasoning.
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
                  
                  {/* XP Breakdown */}
                  <div className="ml-13 pl-13 border-t border-border/20 pt-2 mt-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-medium text-amber-400">{plan.weeklyXPTarget} XP/week</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
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
                      {plan.detox && (
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3 h-3 text-teal-400" />
                          <span className="text-[10px] text-muted-foreground">
                            Detox: <span className="text-teal-400 font-medium">{detoxXPTarget} XP</span>
                            <span className="text-muted-foreground/60"> ({Math.round(plan.detox.weeklyMinutes / 60)}h)</span>
                          </span>
                        </div>
                      )}
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
