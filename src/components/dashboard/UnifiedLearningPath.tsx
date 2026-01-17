import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Zap, Brain, Target, Lock, CheckCircle2, 
  Play, Star, Crown, Headphones, Book, FileText,
  ChevronRight
} from "lucide-react";
import { LEVELS, getLevelFromXP } from "@/lib/badges";
import { TRAINING_PLANS, TrainingPlanId, SessionType, XP_VALUES } from "@/lib/trainingPlans";
import { ContentAssignment } from "@/hooks/useMonthlyContent";

interface PathNode {
  id: string;
  type: "session" | "content" | "milestone";
  sessionType?: SessionType;
  contentType?: "podcast" | "reading" | "book";
  name: string;
  description: string;
  icon: typeof Zap;
  color: string;
  bgColor: string;
  xpReward: number;
  status: "completed" | "current" | "upcoming" | "locked";
  order: number;
}

interface UnifiedLearningPathProps {
  planId: TrainingPlanId;
  completedSessionTypes: SessionType[];
  experiencePoints: number;
  cognitiveLevel: number;
  contentAssignments: ContentAssignment[];
  onStartSession?: (sessionType: SessionType) => void;
  onStartContent?: (contentId: string) => void;
}

const SESSION_CONFIG: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  "fast-focus": { icon: Zap, color: "text-area-fast", bg: "bg-area-fast/20" },
  "mixed": { icon: Brain, color: "text-primary", bg: "bg-primary/20" },
  "consolidation": { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  "fast-control": { icon: Zap, color: "text-area-fast", bg: "bg-area-fast/20" },
  "slow-reasoning": { icon: Brain, color: "text-recovery", bg: "bg-recovery/20" },
  "dual-process": { icon: Target, color: "text-area-slow", bg: "bg-area-slow/20" },
  "heavy-slow": { icon: Brain, color: "text-area-slow", bg: "bg-area-slow/20" },
  "dual-stress": { icon: Zap, color: "text-muted-foreground", bg: "bg-muted/20" },
  "reflection": { icon: Star, color: "text-recovery", bg: "bg-recovery/20" },
};

const CONTENT_CONFIG: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  "podcast": { icon: Headphones, color: "text-area-slow", bg: "bg-area-slow/20" },
  "reading": { icon: FileText, color: "text-recovery", bg: "bg-recovery/20" },
  "book": { icon: Book, color: "text-area-fast", bg: "bg-area-fast/20" },
};

export function UnifiedLearningPath({
  planId,
  completedSessionTypes,
  experiencePoints,
  cognitiveLevel,
  contentAssignments,
  onStartSession,
  onStartContent,
}: UnifiedLearningPathProps) {
  const plan = TRAINING_PLANS[planId];
  const levelInfo = getLevelFromXP(experiencePoints);
  
  // Build unified path nodes for THIS WEEK
  const pathNodes: PathNode[] = [];
  let order = 0;
  
  // Add session nodes
  plan.sessions.forEach((session, idx) => {
    const isCompleted = completedSessionTypes.includes(session.id);
    const config = SESSION_CONFIG[session.id] || SESSION_CONFIG["mixed"];
    
    // Determine status
    let status: PathNode["status"] = "upcoming";
    if (isCompleted) {
      status = "completed";
    } else if (idx === 0 || completedSessionTypes.length >= idx) {
      status = "current";
    }
    
    pathNodes.push({
      id: `session-${session.id}`,
      type: "session",
      sessionType: session.id,
      name: session.name,
      description: `${session.duration} • ${session.thinkingSystems.join(" + ")} Training`,
      icon: config.icon,
      color: config.color,
      bgColor: config.bg,
      xpReward: XP_VALUES.gameComplete,
      status,
      order: order++,
    });
    
    // If this session has required content, add it after the session
    if (session.content?.required && idx < 2) {
      const contentType = session.content.type === "book-extract" ? "book" : session.content.type;
      if (contentType !== "none") {
        const matchingContent = contentAssignments.find(
          a => a.content_type === contentType && a.status !== "completed"
        );
        const contentConfig = CONTENT_CONFIG[contentType] || CONTENT_CONFIG["reading"];
        
        // v1.3: Tasks don't give XP - they are cognitive inputs
        const contentXP = 0;

        pathNodes.push({
          id: matchingContent?.id || `content-${idx}`,
          type: "content",
          contentType: contentType as any,
          name: matchingContent?.title || `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
          description: session.content.description,
          icon: contentConfig.icon,
          color: contentConfig.color,
          bgColor: contentConfig.bg,
          xpReward: contentXP,
          status: matchingContent?.status === "completed" ? "completed" : (isCompleted ? "current" : "upcoming"),
          order: order++,
        });
      }
    }
  });
  
  // Add a milestone at the end of the week
  pathNodes.push({
    id: "weekly-milestone",
    type: "milestone",
    name: "Weekly Goal",
    description: `Complete ${plan.sessionsPerWeek} sessions to level up`,
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-primary/20",
    xpReward: 50,
    status: completedSessionTypes.length >= plan.sessionsPerWeek ? "completed" : "locked",
    order: order++,
  });
  
  // Find the first "current" node
  const currentIndex = pathNodes.findIndex(n => n.status === "current");
  
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">This Week's Path</h3>
          <p className="text-[11px] text-muted-foreground">
            {completedSessionTypes.length}/{plan.sessionsPerWeek} sessions • Level {cognitiveLevel}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium",
          "bg-primary/10 text-primary"
        )}>
          <Star className="w-3 h-3" />
          {experiencePoints} XP
        </div>
      </div>

      {/* Path Nodes */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-border/30 to-border/10 rounded-full" />
        
        <div className="space-y-2">
          {pathNodes.map((node, index) => {
            const isClickable = node.status === "current";
            const showPlayButton = isClickable && node.type === "session";
            
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => {
                    if (node.type === "session" && node.sessionType && onStartSession) {
                      onStartSession(node.sessionType);
                    } else if (node.type === "content" && onStartContent) {
                      onStartContent(node.id);
                    }
                  }}
                  disabled={!isClickable}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    "border text-left relative",
                    node.status === "completed" && "bg-card/60 border-border/20 opacity-75",
                    node.status === "current" && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/40 shadow-md shadow-primary/5",
                    node.status === "upcoming" && "bg-card/30 border-border/20 opacity-60",
                    node.status === "locked" && "bg-muted/10 border-border/10 opacity-40",
                    isClickable && "cursor-pointer hover:border-primary/60 active:scale-[0.98]",
                    !isClickable && "cursor-default"
                  )}
                >
                  {/* Node Icon */}
                  <div className={cn(
                    "relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10",
                    node.status === "completed" && "bg-emerald-500/20",
                    node.status === "current" && node.bgColor,
                    node.status === "upcoming" && "bg-muted/20",
                    node.status === "locked" && "bg-muted/10"
                  )}>
                    {node.status === "locked" ? (
                      <Lock className="w-4 h-4 text-muted-foreground/40" />
                    ) : node.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <node.icon className={cn(
                        "w-4 h-4",
                        node.status === "current" ? node.color : "text-muted-foreground"
                      )} />
                    )}
                    
                    {/* Pulse for current */}
                    {node.status === "current" && (
                      <motion.div
                        className={cn("absolute inset-0 rounded-xl", node.bgColor)}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[12px] font-medium",
                        node.status === "current" ? "text-foreground" : "text-foreground/70"
                      )}>
                        {node.name}
                      </span>
                      {node.type === "milestone" && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[8px] font-semibold uppercase">
                          Goal
                        </span>
                      )}
                      {node.type === "content" && (
                        <span className="px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground text-[8px] font-medium uppercase">
                          {node.contentType}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {node.description}
                    </p>
                  </div>
                  
                  {/* Right side */}
                  {showPlayButton ? (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Play className="w-3.5 h-3.5 text-primary-foreground fill-current ml-0.5" />
                    </div>
                  ) : node.status === "current" && node.type === "content" ? (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <span className={cn(
                      "shrink-0 text-[9px] font-medium px-2 py-1 rounded-md",
                      node.status === "completed" 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-muted/20 text-muted-foreground/60"
                    )}>
                      {node.status === "completed" ? "Done" : "—"}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Level Progress */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-border/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">
            Level {cognitiveLevel} → {LEVELS[cognitiveLevel]?.name || "Max"}
          </span>
          <span className="text-[10px] text-primary font-medium">
            {levelInfo.xpToNext} XP to next level
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}