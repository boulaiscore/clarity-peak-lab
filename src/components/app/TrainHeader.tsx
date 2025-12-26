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
    <section className="relative pb-6" aria-label="Train overview">
      {/* Top row: plan + settings */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <button
          onClick={() => navigate("/app/account")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:bg-card/80 transition-colors"
          )}
          aria-label={`Selected plan: ${plan.name}. Open account settings.`}
        >
          <PlanIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">{plan.name}</span>
        </button>

        <button
          onClick={() => navigate("/app/account")}
          className="w-8 h-8 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card/80 transition-colors"
          aria-label="Open settings"
        >
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Greeting */}
      {greetingName ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {plan.tagline}
          </p>
          <h1 className="text-lg font-semibold tracking-tight">Hey {greetingName}</h1>
        </motion.div>
      ) : null}

      {/* Central ring - WHOOP style */}
      <div className="flex items-center justify-center gap-6">
        {/* Left Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-end gap-4"
        >
          <div className="text-right">
            <p className={cn("text-2xl font-bold", readinessTone)}>
              {Math.round(readinessScore)}%
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">{sessionsCompleted}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</p>
          </div>
        </motion.div>

        {/* Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CognitiveRing progress={weekProgress} size={160} strokeWidth={10}>
            <div className="flex flex-col items-center">
              <Brain className="w-8 h-8 mb-1 text-primary" />
              <span className="text-3xl font-bold">{Math.round(weekProgress)}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Week</span>
            </div>
          </CognitiveRing>
        </motion.div>

        {/* Right Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-start gap-4"
        >
          <div>
            <p className="text-2xl font-bold text-primary">{weeklyXPEarned}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP Earned</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{weeklyXPTarget}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP Target</p>
          </div>
        </motion.div>
      </div>

      {/* XP progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground">Weekly XP Progress</span>
          <span className="text-[10px] text-muted-foreground">
            {weeklyXPEarned}/{weeklyXPTarget} XP
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </section>
  );
}
