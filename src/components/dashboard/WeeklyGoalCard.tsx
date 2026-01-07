import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Gamepad2, BookMarked, Target, CheckCircle2, Smartphone, Ban, Zap, Brain, Shield } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { XPCelebration } from "@/components/app/XPCelebration";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";

function safeProgress(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, (value / target) * 100);
}

export function WeeklyGoalCard() {
  const {
    weeklyXPEarned,
    weeklyXPTarget,
    weeklyGamesXP,
    weeklyContentXP,
    plan,
  } = useWeeklyProgress();

  // Detox XP is tracked in a separate table, but it contributes to the weekly goal.
  const { data: detoxData } = useWeeklyDetoxXP();
  const weeklyDetoxXP = detoxData?.totalXP || 0;

  const totalXPEarned = weeklyXPEarned + weeklyDetoxXP;
  const totalXPTarget = weeklyXPTarget;

  const [showCelebration, setShowCelebration] = useState(false);
  const prevGoalReached = useRef(false);

  const xpProgress = safeProgress(totalXPEarned, totalXPTarget);
  const xpRemaining = Math.max(0, totalXPTarget - totalXPEarned);
  const goalReached = totalXPEarned >= totalXPTarget && totalXPTarget > 0;

  // Derive an explicit detox target from the plan (base XP only, bonus is extra when goal is hit).
  const detoxXPTarget = Math.round(plan.detox.weeklyMinutes * plan.detox.xpPerMinute);
  
  // Use plan's explicit contentXPTarget for tasks
  const tasksXPTarget = plan.contentXPTarget;
  
  // Games XP target = total target - detox target - tasks target
  const gamesXPTarget = Math.max(0, totalXPTarget - detoxXPTarget - tasksXPTarget);

  // Progress percentages
  const gamesProgress = safeProgress(weeklyGamesXP, gamesXPTarget);
  const tasksProgress = safeProgress(weeklyContentXP, tasksXPTarget);
  const detoxProgress = safeProgress(weeklyDetoxXP, detoxXPTarget);

  // Check if each category is complete
  const gamesComplete = weeklyGamesXP >= gamesXPTarget && gamesXPTarget > 0;
  const tasksComplete = weeklyContentXP >= tasksXPTarget && tasksXPTarget > 0;
  const detoxComplete = weeklyDetoxXP >= detoxXPTarget && detoxXPTarget > 0;

  // Trigger celebration when goal is reached for the first time
  useEffect(() => {
    if (goalReached && !prevGoalReached.current) {
      setShowCelebration(true);
    }
    prevGoalReached.current = goalReached;
  }, [goalReached]);

  return (
    <>
      <XPCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-br from-muted/50 via-muted/30 to-transparent border border-border/50 mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <span className="text-[12px] font-semibold">{WEEKLY_GOAL_MESSAGES.headline}</span>
              <p className="text-[9px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.subtitle}</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {Math.round(xpProgress)}% complete
          </span>
        </div>

        {/* Total XP Progress Bar - multi-color gradient */}
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-violet-400 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Training Load Breakdown */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Training Breakdown
            </span>
          </div>

          {/* Games - Active Training */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.games.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.games.benefit}</p>
                </div>
                {gamesComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(gamesProgress)}%
              </span>
            </div>
            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${gamesComplete ? "bg-emerald-400" : "bg-blue-400"}`}
                initial={{ width: 0 }}
                animate={{ width: `${gamesProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>

          {/* Tasks - Deep Input */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-violet-500/15 flex items-center justify-center">
                  <BookMarked className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.tasks.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.tasks.benefit}</p>
                </div>
                {tasksComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(tasksProgress)}%
              </span>
            </div>
            <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tasksComplete ? "bg-emerald-400" : "bg-violet-400"}`}
                initial={{ width:  0 }}
                animate={{ width: `${tasksProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Detox - Mental Recovery */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-teal-500/15 flex items-center justify-center relative">
                  <Brain className="w-3 h-3 text-teal-400" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-foreground">{WEEKLY_GOAL_MESSAGES.categories.detox.label}</span>
                  <p className="text-[8px] text-muted-foreground">{WEEKLY_GOAL_MESSAGES.categories.detox.benefit}</p>
                </div>
                {detoxComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(detoxProgress)}%
              </span>
            </div>
            <div className="h-1.5 bg-teal-500/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${detoxComplete ? "bg-emerald-400" : "bg-gradient-to-r from-teal-400 to-cyan-400"}`}
                initial={{ width: 0 }}
                animate={{ width: `${detoxProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {WEEKLY_GOAL_MESSAGES.getProgressMessage(xpRemaining, totalXPTarget)}
        </p>
      </motion.div>
    </>
  );
}
