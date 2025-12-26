import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Zap, Brain, Target, Lock, CheckCircle2, 
  Play, Trophy, Star, Flame, Crown
} from "lucide-react";
import { LEVELS, getLevelFromXP } from "@/lib/badges";
import { TRAINING_PLANS, TrainingPlanId, SessionType } from "@/lib/trainingPlans";

interface PathNode {
  id: string;
  type: "session" | "milestone" | "level-up";
  sessionType?: SessionType;
  name: string;
  description: string;
  icon: typeof Zap;
  color: string;
  bgColor: string;
  xpReward: number;
  unlockLevel: number;
  weekNumber: number;
}

interface LearningPathMapProps {
  planId: TrainingPlanId;
  completedSessionTypes: SessionType[];
  currentWeek: number;
  experiencePoints: number;
  cognitiveLevel: number;
  gamesCompletedThisWeek: number;
  onNodeClick?: (node: PathNode) => void;
}

// Generate path nodes based on training plan
function generatePathNodes(planId: TrainingPlanId): PathNode[] {
  const plan = TRAINING_PLANS[planId];
  const nodes: PathNode[] = [];
  
  // Generate 12 weeks of content (3 months journey)
  for (let week = 1; week <= 12; week++) {
    // Add session nodes for each week
    plan.sessions.forEach((session, sessionIndex) => {
      const sessionIcons: Record<string, typeof Zap> = {
        "fast-focus": Zap,
        "mixed": Brain,
        "consolidation": Target,
        "fast-control": Zap,
        "slow-reasoning": Brain,
        "dual-process": Target,
        "heavy-slow": Brain,
        "dual-stress": Flame,
        "reflection": Star,
      };
      
      const sessionColors: Record<string, { color: string; bg: string }> = {
        "fast-focus": { color: "text-amber-400", bg: "bg-amber-500/20" },
        "mixed": { color: "text-blue-400", bg: "bg-blue-500/20" },
        "consolidation": { color: "text-emerald-400", bg: "bg-emerald-500/20" },
        "fast-control": { color: "text-orange-400", bg: "bg-orange-500/20" },
        "slow-reasoning": { color: "text-teal-400", bg: "bg-teal-500/20" },
        "dual-process": { color: "text-violet-400", bg: "bg-violet-500/20" },
        "heavy-slow": { color: "text-rose-400", bg: "bg-rose-500/20" },
        "dual-stress": { color: "text-red-400", bg: "bg-red-500/20" },
        "reflection": { color: "text-cyan-400", bg: "bg-cyan-500/20" },
      };
      
      nodes.push({
        id: `week-${week}-session-${sessionIndex}`,
        type: "session",
        sessionType: session.id,
        name: session.name,
        description: session.description,
        icon: sessionIcons[session.id] || Brain,
        color: sessionColors[session.id]?.color || "text-primary",
        bgColor: sessionColors[session.id]?.bg || "bg-primary/20",
        xpReward: 10,
        unlockLevel: Math.ceil(week / 4),
        weekNumber: week,
      });
    });
    
    // Add milestone every 4 weeks
    if (week % 4 === 0) {
      const milestoneLevel = week / 4 + 1;
      nodes.push({
        id: `milestone-week-${week}`,
        type: "level-up",
        name: `Level ${milestoneLevel}`,
        description: LEVELS[milestoneLevel - 1]?.name || "Advanced",
        icon: Crown,
        color: "text-primary",
        bgColor: "bg-primary/30",
        xpReward: 100,
        unlockLevel: milestoneLevel,
        weekNumber: week,
      });
    }
  }
  
  return nodes;
}

export function LearningPathMap({
  planId,
  completedSessionTypes,
  currentWeek,
  experiencePoints,
  cognitiveLevel,
  gamesCompletedThisWeek,
  onNodeClick,
}: LearningPathMapProps) {
  const pathNodes = generatePathNodes(planId);
  const levelInfo = getLevelFromXP(experiencePoints);
  
  // Calculate which nodes are completed, current, or locked
  const getNodeStatus = (node: PathNode, index: number) => {
    if (node.weekNumber < currentWeek) return "completed";
    if (node.weekNumber === currentWeek) {
      if (node.type === "session") {
        const isCompletedThisWeek = completedSessionTypes.includes(node.sessionType!);
        return isCompletedThisWeek ? "completed" : "current";
      }
      return "current";
    }
    if (node.unlockLevel > cognitiveLevel) return "locked";
    return "upcoming";
  };
  
  // Only show relevant weeks (current week -1 to current week +3)
  const visibleNodes = pathNodes.filter(
    node => node.weekNumber >= Math.max(1, currentWeek - 1) && node.weekNumber <= currentWeek + 3
  );

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Reasoning Path</h3>
          <p className="text-[11px] text-muted-foreground">Week {currentWeek} • Level {cognitiveLevel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2 py-1 rounded-lg text-[11px] font-medium",
            levelInfo.color.replace("text-", "bg-").replace("-400", "-500/20"),
            levelInfo.color
          )}>
            <Star className="w-3 h-3 inline mr-1" />
            {experiencePoints} XP
          </div>
        </div>
      </div>

      {/* Path Container */}
      <div className="relative py-4">
        {/* Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-muted/30 to-muted/10" />
        
        {/* Nodes */}
        <div className="space-y-3">
          {visibleNodes.map((node, index) => {
            const status = getNodeStatus(node, index);
            const isClickable = status === "current" || status === "completed";
            
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Node */}
                <button
                  onClick={() => isClickable && onNodeClick?.(node)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                    "border text-left",
                    status === "completed" && "bg-card/80 border-primary/30 opacity-80",
                    status === "current" && "bg-gradient-to-r from-primary/10 to-transparent border-primary/50 shadow-lg shadow-primary/10",
                    status === "upcoming" && "bg-card/40 border-border/30 opacity-70",
                    status === "locked" && "bg-muted/20 border-border/20 opacity-40",
                    isClickable && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  {/* Icon Circle */}
                  <div className={cn(
                    "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10",
                    status === "completed" && "bg-primary/20",
                    status === "current" && node.bgColor,
                    status === "upcoming" && "bg-muted/30",
                    status === "locked" && "bg-muted/20"
                  )}>
                    {status === "locked" ? (
                      <Lock className="w-5 h-5 text-muted-foreground/50" />
                    ) : status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <node.icon className={cn(
                        "w-5 h-5",
                        status === "current" ? node.color : "text-muted-foreground"
                      )} />
                    )}
                    
                    {/* Pulse for current */}
                    {status === "current" && (
                      <motion.div
                        className={cn("absolute inset-0 rounded-xl", node.bgColor)}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[12px] font-medium",
                        status === "current" ? "text-foreground" : "text-foreground/80"
                      )}>
                        {node.name}
                      </span>
                      {node.type === "level-up" && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-semibold">
                          LEVEL UP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {node.description}
                    </p>
                  </div>
                  
                  {/* XP Badge */}
                  <div className={cn(
                    "shrink-0 text-[10px] font-medium px-2 py-1 rounded-lg",
                    status === "completed" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted/30 text-muted-foreground"
                  )}>
                    +{node.xpReward} XP
                  </div>
                  
                  {/* Play icon for current */}
                  {status === "current" && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-primary-foreground fill-current ml-0.5" />
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Progress Summary */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Next Level</p>
            <p className="text-[13px] font-semibold text-foreground">
              {LEVELS[cognitiveLevel]?.name || "Transcendent"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{Math.round(levelInfo.progress)}% complete</p>
            <p className="text-[10px] text-primary">{levelInfo.xpToNext} XP to go</p>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-2 h-2 rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
