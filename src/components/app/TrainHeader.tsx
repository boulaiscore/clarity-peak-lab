import { motion } from "framer-motion";
import { Brain, Flame, Leaf, Target, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrainingPlanId, getTrainingPlan, getPlanColor } from "@/lib/trainingPlans";
import { CognitiveRing } from "./CognitiveRing";
import { useNavigate } from "react-router-dom";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

interface TrainHeaderProps {
  trainingPlan: TrainingPlanId;
  sessionsCompleted: number;
  sessionsRequired: number;
  weeklyXPEarned: number;
  weeklyXPTarget: number;
  cognitiveReadinessScore?: number | null;
}

const PLAN_ICONS: Record<TrainingPlanId, React.ElementType> = {
  light: Leaf,
  expert: Target,
  superhuman: Flame,
};

const PLAN_COLORS: Record<TrainingPlanId, { ring: string; text: string; bg: string }> = {
  light: { 
    ring: "hsl(142, 76%, 36%)", 
    text: "text-emerald-400", 
    bg: "bg-emerald-500/10" 
  },
  expert: { 
    ring: "hsl(217, 91%, 60%)", 
    text: "text-blue-400", 
    bg: "bg-blue-500/10" 
  },
  superhuman: { 
    ring: "hsl(0, 84%, 60%)", 
    text: "text-red-400", 
    bg: "bg-red-500/10" 
  },
};

export function TrainHeader({
  trainingPlan,
  sessionsCompleted,
  sessionsRequired,
  weeklyXPEarned,
  weeklyXPTarget,
}: TrainHeaderProps) {
  const navigate = useNavigate();
  const plan = getTrainingPlan(trainingPlan);
  const PlanIcon = PLAN_ICONS[trainingPlan];
  const colors = PLAN_COLORS[trainingPlan];
  
  const { cognitiveReadinessScore, readinessClassification } = useCognitiveReadiness();
  
  const weekProgress = Math.min(100, (sessionsCompleted / sessionsRequired) * 100);
  const xpProgress = Math.min(100, (weeklyXPEarned / weeklyXPTarget) * 100);
  
  const readinessScore = cognitiveReadinessScore ?? 75;
  
  const getReadinessColor = () => {
    if (readinessScore >= 70) return "text-emerald-400";
    if (readinessScore >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="relative pb-6">
      {/* Plan Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => navigate("/app/account")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "border border-border/50 bg-card/50 backdrop-blur-sm",
            "hover:bg-card/80 transition-colors"
          )}
        >
          <PlanIcon className={cn("w-4 h-4", colors.text)} />
          <span className="text-xs font-medium">{plan.name}</span>
        </button>
        
        <button
          onClick={() => navigate("/app/account")}
          className="w-8 h-8 rounded-full bg-card/50 border border-border/50 flex items-center justify-center hover:bg-card/80 transition-colors"
        >
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Central Ring Section - Whoop Style */}
      <div className="flex items-center justify-center gap-6">
        {/* Left Metrics */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-end gap-4"
        >
          <div className="text-right">
            <p className={cn("text-2xl font-bold", getReadinessColor())}>
              {Math.round(readinessScore)}%
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Readiness
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">
              {sessionsCompleted}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sessions
            </p>
          </div>
        </motion.div>

        {/* Central Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CognitiveRing 
            progress={weekProgress} 
            size={160}
            strokeWidth={10}
          >
            <div className="flex flex-col items-center">
              <Brain className={cn("w-8 h-8 mb-1", colors.text)} />
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
            <p className={cn("text-2xl font-bold", colors.text)}>
              {weeklyXPEarned}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              XP Earned
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {weeklyXPTarget}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              XP Target
            </p>
          </div>
        </motion.div>
      </div>

      {/* XP Progress Bar */}
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
            className={cn("h-full rounded-full", 
              trainingPlan === "light" ? "bg-emerald-500" :
              trainingPlan === "expert" ? "bg-blue-500" : "bg-red-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
