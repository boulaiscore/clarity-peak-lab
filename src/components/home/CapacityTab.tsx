import { motion } from "framer-motion";
import { Layers, Swords, BookMarked, Smartphone } from "lucide-react";
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
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(totalProgress / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  // Dynamic color based on progress
  const ringColor = totalProgress >= 90 
    ? "hsl(142, 71%, 45%)" 
    : totalProgress >= 60 
      ? "hsl(80, 60%, 50%)" 
      : totalProgress >= 30 
        ? "hsl(45, 85%, 50%)" 
        : "hsl(25, 90%, 50%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Main Ring - Large & Centered */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted)/0.3)"
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Capacity</p>
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {cappedTotalXP}
            </span>
            <span className="text-sm text-muted-foreground mt-1">of {weeklyXPTarget}</span>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Layers className="w-5 h-5 text-amber-400 mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Weekly Load</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {totalProgress >= 100 
            ? "Target reached. Your cognitive reserve is fully stocked for the week." 
            : totalProgress >= 50 
              ? `${Math.round(100 - totalProgress)}% remaining to hit your ${planConfig.name} target.`
              : "Build momentum early—consistency compounds cognitive gains."}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Breakdown</span>
          <span>target</span>
        </div>
        
        <div className="space-y-2">
          <CategoryRow 
            icon={<Swords className="w-4 h-4 text-blue-400" />}
            label="Challenges"
            current={cappedGamesXP}
            target={gamesXPTarget}
          />
          <CategoryRow 
            icon={<BookMarked className="w-4 h-4 text-purple-400" />}
            label="Tasks"
            current={cappedTasksXP}
            target={tasksXPTarget}
          />
          <CategoryRow 
            icon={<Smartphone className="w-4 h-4 text-teal-400" />}
            label="Recovery"
            current={Math.min(rawDetoxXP, detoxXPTarget)}
            target={detoxXPTarget}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CategoryRow({ icon, label, current, target }: { 
  icon: React.ReactNode; 
  label: string; 
  current: number; 
  target: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium tabular-nums">
        {current} <span className="text-muted-foreground">/ {target}</span>
      </span>
    </div>
  );
}
