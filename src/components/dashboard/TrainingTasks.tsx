import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Headphones, BookOpen, FileText, CheckCircle2, 
  Brain, Zap, Target, ChevronRight, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { XP_VALUES } from "@/lib/trainingPlans";
import { startOfWeek, format } from "date-fns";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";

type InputType = "podcast" | "book" | "article";
type ThinkingSystem = "S1" | "S2" | "S1+S2";

interface CognitiveInput {
  id: string;
  type: InputType;
  title: string;
  author?: string;
  duration: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  thinkingSystem: ThinkingSystem;
  primaryUrl: string;
}

const INPUT_TYPE_CONFIG: Record<InputType, { label: string; icon: typeof Headphones; color: string; bgColor: string }> = {
  podcast: { label: "Podcast", icon: Headphones, color: "text-primary", bgColor: "bg-primary/15" },
  book: { label: "Book", icon: BookOpen, color: "text-amber-500", bgColor: "bg-amber-500/15" },
  article: { label: "Reading", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/15" },
};

// Default active prescriptions (matching CognitiveInputs.tsx)
const ACTIVE_PRESCRIPTIONS: Record<InputType, string> = {
  podcast: "in-our-time",
  book: "apology-plato",
  article: "hbr-critical-thinking",
};

// Simplified active tasks data (only the active ones)
const ACTIVE_TASKS: CognitiveInput[] = [
  {
    id: "in-our-time",
    type: "podcast",
    title: "In Our Time",
    author: "BBC Radio 4",
    duration: "35–55 min",
    difficulty: 3,
    thinkingSystem: "S2",
    primaryUrl: "https://open.spotify.com/show/17YfG23eMbfLBaDPqucgzZ",
  },
  {
    id: "apology-plato",
    type: "book",
    title: "Apology",
    author: "Plato",
    duration: "1–2 hrs",
    difficulty: 3,
    thinkingSystem: "S2",
    primaryUrl: "https://www.amazon.it/s?k=Plato+Apology",
  },
  {
    id: "hbr-critical-thinking",
    type: "article",
    title: "Critical Thinking Is About Asking Better Questions",
    author: "Harvard Business Review",
    duration: "10–15 min",
    difficulty: 2,
    thinkingSystem: "S2",
    primaryUrl: "https://hbr.org/2022/04/critical-thinking-is-about-asking-better-questions",
  },
];

function useLoggedExposures(userId: string | undefined) {
  return useQuery({
    queryKey: ["logged-exposures", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_listened_podcasts")
        .select("podcast_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((row) => row.podcast_id);
    },
    enabled: !!userId,
  });
}

// Content XP values aligned with training plans
function calculateXP(type: InputType): number {
  switch (type) {
    case "podcast": return XP_VALUES.podcastComplete;     // 15 XP
    case "article": return XP_VALUES.readingComplete;     // 20 XP
    case "book": return XP_VALUES.bookChapterComplete;    // 30 XP
    default: return 15;
  }
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

function ThinkingSystemBadge({ system }: { system: ThinkingSystem }) {
  if (system === "S1") {
    return (
      <div className="flex items-center gap-1 text-[9px] text-amber-500">
        <Zap className="h-3 w-3" />
        <span>Fast</span>
      </div>
    );
  }
  if (system === "S2") {
    return (
      <div className="flex items-center gap-1 text-[9px] text-teal-500">
        <Brain className="h-3 w-3" />
        <span>Slow</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[9px] text-purple-500">
      <Zap className="h-2.5 w-2.5" />
      <Brain className="h-2.5 w-2.5" />
      <span>Dual</span>
    </div>
  );
}

interface TaskCardProps {
  task: CognitiveInput;
  isCompleted: boolean;
  onComplete: () => void;
  isToggling: boolean;
}

function TaskCard({ task, isCompleted, onComplete, isToggling }: TaskCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const config = INPUT_TYPE_CONFIG[task.type];
  const Icon = config.icon;
  const xp = calculateXP(task.type);

  const handleClick = () => {
    if (!isCompleted) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    onComplete();
    setShowConfirm(false);
    toast({
      title: `+${xp} XP Earned!`,
      description: `"${task.title}" completed.`,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-3 rounded-xl border transition-all ${
          isCompleted 
            ? "border-green-500/30 bg-green-500/5 opacity-60" 
            : "border-border/30 bg-card/40 hover:border-primary/40 hover:bg-card/60"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Complete button */}
          <button
            onClick={handleClick}
            disabled={isToggling || isCompleted}
            className="shrink-0 group"
          >
            {isToggling ? (
              <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded-full group-hover:border-primary/60 transition-colors" />
            )}
          </button>

          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{task.author}</span>
              <span>•</span>
              <span>{task.duration}</span>
            </div>
          </div>

          {/* Right side - XP and thinking system */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {!isCompleted && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold">
                +{xp} XP
              </Badge>
            )}
            <ThinkingSystemBadge system={task.thinkingSystem} />
          </div>

          {/* Link */}
          <a
            href={task.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary" />
          </a>
        </div>
      </motion.div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll earn <span className="text-amber-500 font-semibold">+{xp} XP</span> for completing "{task.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Complete (+{xp} XP)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function TrainingTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: completedIds = [], isLoading } = useLoggedExposures(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Get weekly progress for content XP toward plan goal
  const { weeklyContentXP, weeklyXPTarget, plan } = useWeeklyProgress();

  const toggleMutation = useMutation({
    mutationFn: async ({ taskId, taskType }: { taskId: string; taskType: InputType }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const weekStart = getCurrentWeekStart();
      const xpEarned = calculateXP(taskType);
      
      // Record completion in user_listened_podcasts (legacy tracking)
      const { error: legacyError } = await supabase
        .from("user_listened_podcasts")
        .insert({ user_id: user.id, podcast_id: taskId });
      if (legacyError) throw legacyError;
      
      // Also record in exercise_completions to count toward weekly XP
      const { error: xpError } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: `content-${taskId}`,
          gym_area: "content",
          thinking_mode: "slow",
          difficulty: taskType === "book" ? "hard" : taskType === "article" ? "medium" : "easy",
          xp_earned: xpEarned,
          score: 100,
          week_start: weekStart,
        });
      if (xpError) throw xpError;
    },
    onMutate: async ({ taskId }) => {
      setTogglingId(taskId);
      await queryClient.cancelQueries({ queryKey: ["logged-exposures", user?.id] });
      const previousData = queryClient.getQueryData<string[]>(["logged-exposures", user?.id]);
      
      queryClient.setQueryData<string[]>(["logged-exposures", user?.id], (old = []) => {
        return [...old, taskId];
      });
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["logged-exposures", user?.id], context.previousData);
      }
    },
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ["logged-exposures", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
    },
  });

  const handleComplete = (taskId: string, taskType: InputType) => {
    if (!user?.id) return;
    toggleMutation.mutate({ taskId, taskType });
  };

  // Filter active tasks (not completed)
  const activeTasks = ACTIVE_TASKS.filter(t => !completedIds.includes(t.id));
  const completedTasks = ACTIVE_TASKS.filter(t => completedIds.includes(t.id));
  
  // Calculate stats for tasks only
  const totalPossibleXP = ACTIVE_TASKS.reduce((sum, t) => sum + calculateXP(t.type), 0);
  const earnedXP = completedTasks.reduce((sum, t) => sum + calculateXP(t.type), 0);
  const completionPercent = ACTIVE_TASKS.length > 0 ? Math.round((completedTasks.length / ACTIVE_TASKS.length) * 100) : 0;
  
  // Weekly goal progress (content XP toward plan target)
  // Content contributes ~40% of weekly target typically
  const contentTarget = Math.round(weeklyXPTarget * 0.4);
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyContentXP / contentTarget) * 100));

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Weekly Goal Card - like GamesLibrary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-card/50 to-primary/5 border border-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-500" />
            <h3 className="text-[13px] font-semibold">Weekly Goal</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-teal-500">{weeklyContentXP}</span>
            <span className="text-[10px] text-muted-foreground">/{contentTarget} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weeklyGoalPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-teal-500 to-primary rounded-full"
          />
        </div>
        
        <p className="text-[10px] text-muted-foreground">
          {weeklyGoalPercent >= 100 ? "Goal reached!" : `${100 - weeklyGoalPercent}% to goal`} • {plan.name} plan
        </p>
      </div>

      {/* Tasks Progress */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/50 to-amber-500/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-[13px] font-semibold">Tasks Progress</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">{earnedXP}</span>
            <span className="text-[10px] text-muted-foreground">/{totalPossibleXP} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
          />
        </div>
        
        <p className="text-[10px] text-muted-foreground">
          {completedTasks.length}/{ACTIVE_TASKS.length} completed • {activeTasks.length} remaining
        </p>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
            Active
          </h4>
          {activeTasks.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <TaskCard
                task={task}
                isCompleted={false}
                onComplete={() => handleComplete(task.id, task.type)}
                isToggling={togglingId === task.id}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider px-1">
            Completed
          </h4>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={true}
              onComplete={() => {}}
              isToggling={false}
            />
          ))}
        </div>
      )}

      {/* All completed state */}
      {activeTasks.length === 0 && completedTasks.length > 0 && (
        <div className="text-center py-4">
          <CheckCircle2 className="h-8 w-8 text-green-500/60 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-500">All tasks completed!</p>
          <p className="text-[10px] text-muted-foreground">You earned {earnedXP} XP this week</p>
        </div>
      )}
    </motion.div>
  );
}
