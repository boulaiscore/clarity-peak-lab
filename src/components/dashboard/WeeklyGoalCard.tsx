import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Gamepad2, BookMarked, Target, CheckCircle2, Smartphone, Ban, Gift } from "lucide-react";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { XPCelebration } from "@/components/app/XPCelebration";

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-foreground" />
            <span className="text-[12px] font-semibold">Weekly Goal</span>
          </div>
          <span className="text-[12px] font-bold text-foreground">
            {totalXPEarned} / {totalXPTarget} XP
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

        {/* XP Breakdown by Source */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {plan.name} Breakdown
            </span>
          </div>

          {/* Games XP */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Games</span>
                {gamesComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Complete
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-blue-400">
                {weeklyGamesXP} / {gamesXPTarget} XP
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

          {/* Tasks XP */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-violet-500/15 flex items-center justify-center">
                  <BookMarked className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Tasks</span>
                {tasksComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Complete
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-violet-400">
                {weeklyContentXP} / {tasksXPTarget} XP
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

          {/* Detox XP (counts toward weekly goal) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-teal-500/15 flex items-center justify-center relative">
                  <Smartphone className="w-3 h-3 text-teal-400" />
                  <Ban className="w-2 h-2 text-teal-400 absolute -bottom-0.5 -right-0.5" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Detox</span>
                {detoxComplete && (
                  <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Complete
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-teal-400">
                {weeklyDetoxXP} / {detoxXPTarget} XP
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
            <p className="text-[9px] text-muted-foreground mt-1.5">
              Detox counts toward weekly target (like Games and Tasks)
            </p>
          </div>
        </div>

        {xpRemaining > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">{xpRemaining} XP</span> remaining to reach weekly target
          </p>
        ) : (
          <p className="text-[10px] text-emerald-400 font-medium">
            Weekly goal achieved! Keep training to level up faster.
          </p>
        )}
      </motion.div>
    </>
  );
}
