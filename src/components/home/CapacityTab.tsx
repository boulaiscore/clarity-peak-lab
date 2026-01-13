import { motion } from "framer-motion";
import { Star, Swords, BookMarked, Smartphone, TrendingUp, Battery, Layers } from "lucide-react";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { useAuth } from "@/contexts/AuthContext";

export function CapacityTab() {
  const { user } = useAuth();
  const { weeklyXPTarget } = useWeeklyProgress();
  const { cappedTotalXP, rawGamesXP, rawTasksXP, rawDetoxXP, gamesXPTarget, tasksXPTarget, detoxXPTarget } = useStableCognitiveLoad();
  
  // Calculate capped values
  const cappedGamesXP = Math.min(rawGamesXP, gamesXPTarget);
  const cappedTasksXP = Math.min(rawTasksXP, tasksXPTarget);
  
  const currentPlan = (user?.trainingPlan || "light") as TrainingPlanId;
  const planConfig = TRAINING_PLANS[currentPlan];
  
  const totalProgress = weeklyXPTarget > 0 ? (cappedTotalXP / weeklyXPTarget) * 100 : 0;
  const gamesProgress = gamesXPTarget > 0 ? (cappedGamesXP / gamesXPTarget) * 100 : 0;
  const tasksProgress = tasksXPTarget > 0 ? (cappedTasksXP / tasksXPTarget) * 100 : 0;
  const detoxProgress = detoxXPTarget > 0 ? (rawDetoxXP / detoxXPTarget) * 100 : 0;
  
  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-green-400";
    if (value >= 60) return "text-amber-400";
    return "text-orange-400";
  };
  
  const getBarColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 60) return "bg-amber-500";
    return "bg-orange-500";
  };

  // Ring calculations
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(totalProgress / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  // Dynamic color based on progress
  const ringColor = totalProgress >= 90 
    ? "hsl(142, 71%, 45%)" 
    : totalProgress >= 60 
      ? "hsl(80, 60%, 45%)" 
      : totalProgress >= 30 
        ? "hsl(45, 85%, 50%)" 
        : "hsl(25, 90%, 50%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Ring */}
      <div className="flex flex-col items-center py-4">
        <div className="relative" style={{ width: size, height: size }}>
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
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Layers className="w-5 h-5 text-amber-400 mb-1" />
            <span className={`text-4xl font-bold tabular-nums ${getScoreColor(totalProgress)}`}>
              {cappedTotalXP}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Cognitive Capacity</p>
        <p className="text-[10px] text-muted-foreground/60">
          of {weeklyXPTarget} CC · {planConfig.name}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">Capacity Breakdown</h3>
        
        <div className="space-y-3">
          <CategoryRow 
            icon={<Swords className="w-4 h-4 text-blue-400" />}
            label="Challenges"
            current={cappedGamesXP}
            target={gamesXPTarget}
            progress={gamesProgress}
            color="bg-blue-500"
          />
          <CategoryRow 
            icon={<BookMarked className="w-4 h-4 text-purple-400" />}
            label="Tasks"
            current={cappedTasksXP}
            target={tasksXPTarget}
            progress={tasksProgress}
            color="bg-purple-500"
          />
          <CategoryRow 
            icon={<Smartphone className="w-4 h-4 text-teal-400" />}
            label="Recovery (Detox)"
            current={rawDetoxXP}
            target={detoxXPTarget}
            progress={detoxProgress}
            color="bg-teal-500"
          />
        </div>
      </div>

      {/* Insight Card */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Battery className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-400 mb-1">Capacity Impact</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consistent weekly capacity builds cognitive reserve. Missing targets 
              for 2+ weeks leads to measurable performance decline.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CategoryRowProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  progress: number;
  color: string;
}

function CategoryRow({ icon, label, current, target, progress, color }: CategoryRowProps) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {current} <span className="text-muted-foreground font-normal">/ {target}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
