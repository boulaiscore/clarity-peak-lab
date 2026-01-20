import { motion } from "framer-motion";
import { Brain, Flame, Leaf, Target, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrainingPlanId, getTrainingPlan } from "@/lib/trainingPlans";
import { CognitiveRing } from "./CognitiveRing";
import { useNavigate } from "react-router-dom";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

interface TrainHeaderProps {
  trainingPlan: TrainingPlanId;
  sessionsCompleted: number;
  sessionsRequired: number;
  weeklyXPEarned: number;
  weeklyXPTarget: number;
  greetingName?: string;
}

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

export function TrainHeader({
  trainingPlan,
  sessionsCompleted,
  sessionsRequired,
  weeklyXPEarned,
  weeklyXPTarget,
  greetingName,
}: TrainHeaderProps) {
  const navigate = useNavigate();
  const plan = getTrainingPlan(trainingPlan);
  const PlanIcon = PLAN_ICONS[trainingPlan];

  const { cognitiveReadinessScore } = useCognitiveReadiness();

  const safeSessionsRequired = Math.max(1, sessionsRequired);
  const weekProgress = Math.min(100, (sessionsCompleted / safeSessionsRequired) * 100);
  const xpProgress = Math.min(100, weeklyXPTarget > 0 ? (weeklyXPEarned / weeklyXPTarget) * 100 : 0);

  const readinessScore = cognitiveReadinessScore ?? 75;

  const readinessTone =
    readinessScore >= 70
      ? "text-success"
      : readinessScore >= 40
        ? "text-warning"
        : "text-destructive";

  return (
    <section className="relative pb-3" aria-label="Train overview">
      {/* Top row: plan + settings */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-2"
      >
        <button
          onClick={() => navigate("/app/account")}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1 rounded-full",
            "border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:bg-card/80 transition-colors"
          )}
          aria-label={`Selected plan: ${plan.name}. Open account settings.`}
        >
          <PlanIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium">{plan.name}</span>
        </button>

        <button
          onClick={() => navigate("/app/account")}
          className="w-7 h-7 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card/80 transition-colors"
          aria-label="Open settings"
        >
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Greeting - single line */}
      {greetingName ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-3"
        >
          <h1 className="text-base font-semibold tracking-tight">
            Hey {greetingName} <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest ml-2">{plan.tagline}</span>
          </h1>
        </motion.div>
      ) : null}

      {/* Compact ring row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-end gap-1"
        >
          <div className="text-right">
            <p className={cn("text-lg font-bold leading-none", readinessTone)}>
              {Math.round(readinessScore)}%
            </p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Readiness</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground leading-none">{sessionsCompleted}/{sessionsRequired}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Sessions</p>
          </div>
        </motion.div>

        {/* Ring - smaller, with completion state */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-full",
            weekProgress >= 100 && "ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-background"
          )}
        >
          <CognitiveRing progress={weekProgress} size={100} strokeWidth={7}>
            <div className="flex flex-col items-center">
              <Brain className={cn("w-5 h-5 mb-0.5", weekProgress >= 100 ? "text-emerald-400" : "text-primary")} />
              <span className="text-xl font-bold leading-none">{Math.round(weekProgress)}%</span>
              <span className={cn(
                "text-[8px] uppercase tracking-wide",
                weekProgress >= 100 ? "text-emerald-400 font-medium" : "text-muted-foreground"
              )}>
                {weekProgress >= 100 ? "Complete" : "Week"}
              </span>
            </div>
          </CognitiveRing>
        </motion.div>

        {/* Right Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-start gap-1"
        >
          <div>
            <div className="flex items-center gap-1">
              <p className={cn(
                "text-lg font-bold leading-none",
                weekProgress >= 100 ? "text-emerald-400" : "text-primary"
              )}>
                {weeklyXPEarned}
              </p>
              {weekProgress >= 100 && (
                <span className="text-emerald-400 text-[10px]">✓</span>
              )}
            </div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {weekProgress >= 100 ? "Target reached" : "XP"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">{weeklyXPTarget}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Target</p>
          </div>
        </motion.div>
      </div>

      {/* XP progress bar - slimmer */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 px-2"
      >
        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>
      </motion.div>
    </section>
  );
}
