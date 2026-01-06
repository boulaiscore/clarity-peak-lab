import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Headphones, BookOpen, FileText, CheckCircle2, 
  Zap, Timer, ExternalLink
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
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

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

// All available tasks - ordered by priority for each plan
const ALL_TASKS: CognitiveInput[] = [
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
    id: "hbr-critical-thinking",
    type: "article",
    title: "Critical Thinking Is About Asking Better Questions",
    author: "Harvard Business Review",
    duration: "10–15 min",
    difficulty: 2,
    thinkingSystem: "S2",
    primaryUrl: "https://hbr.org/2022/04/critical-thinking-is-about-asking-better-questions",
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
];

// Get tasks for specific plan based on contentPerWeek
function getTasksForPlan(planId: TrainingPlanId): CognitiveInput[] {
  const plan = TRAINING_PLANS[planId];
  if (!plan) return ALL_TASKS.slice(0, 1);
  
  // Return tasks based on plan's contentPerWeek requirement
  return ALL_TASKS.slice(0, plan.contentPerWeek);
}

// Hook to get completed content for THIS WEEK only
function useWeeklyCompletedContent(userId: string | undefined) {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["weekly-content-completions", userId, weekStart],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get exercise completions for content this week
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("exercise_id, xp_earned")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .like("exercise_id", "content-%");
      
      if (error) throw error;
      
      // Extract content IDs (remove "content-" prefix and type)
      return (data || []).map(row => ({
        contentId: row.exercise_id.replace(/^content-(podcast|book|article)-/, ""),
        xpEarned: row.xp_earned
      }));
    },
    enabled: !!userId,
  });
}

// Content XP values aligned with training plans
function calculateXP(type: InputType): number {
  switch (type) {
    case "podcast": return XP_VALUES.podcastComplete;
    case "article": return XP_VALUES.readingComplete;
    case "book": return XP_VALUES.bookChapterComplete;
    default: return 8;
  }
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

function ThinkingSystemBadge({ system }: { system: ThinkingSystem }) {
  if (system === "S1") {
    return (
      <div className="flex items-center gap-1 text-[9px] text-amber-400">
        <Zap className="h-3 w-3" />
        <span>Fast</span>
      </div>
    );
  }
  if (system === "S2") {
    return (
      <div className="flex items-center gap-1 text-[9px] text-blue-400">
        <Timer className="h-3 w-3" />
        <span>Slow</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[9px] text-purple-400">
      <Zap className="h-2.5 w-2.5" />
      <Timer className="h-2.5 w-2.5" />
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
  const { weeklyContentXP } = useWeeklyProgress();
  const { data: weeklyCompletions = [], isLoading } = useWeeklyCompletedContent(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Get user's training plan for XP target
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("training_plan")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });
  
  const userPlan = (profile?.training_plan as TrainingPlanId) || "light";
  const planXPTarget = TRAINING_PLANS[userPlan]?.weeklyXPTarget || 100;
  
  // Extract completed content IDs for this week
  const completedThisWeek = weeklyCompletions.map(c => c.contentId);
  // Calculate XP earned this week from these tasks
  const weeklyTasksXPEarned = weeklyCompletions.reduce((sum, c) => sum + c.xpEarned, 0);

  const toggleMutation = useMutation({
    mutationFn: async ({ taskId, taskType }: { taskId: string; taskType: InputType }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const weekStart = getCurrentWeekStart();
      const xpEarned = calculateXP(taskType);
      
      // Record completion in user_listened_podcasts (legacy tracking - for library)
      const { error: legacyError } = await supabase
        .from("user_listened_podcasts")
        .insert({ user_id: user.id, podcast_id: taskId });
      if (legacyError) throw legacyError;
      
      // Also record in exercise_completions to count toward weekly XP
      const { error: xpError } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: `content-${taskType}-${taskId}`,
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
      await queryClient.cancelQueries({ queryKey: ["weekly-content-completions", user?.id] });
    },
    onError: () => {
      // Error handled by toast
    },
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ["weekly-content-completions"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      queryClient.invalidateQueries({ queryKey: ["logged-exposures"] });
    },
  });

  const handleComplete = (taskId: string, taskType: InputType) => {
    if (!user?.id) return;
    toggleMutation.mutate({ taskId, taskType });
  };

  // Get tasks for the user's plan only
  const planTasks = getTasksForPlan(userPlan);
  
  // Filter active tasks (not completed THIS WEEK) - only from plan tasks
  const activeTasks = planTasks.filter(t => !completedThisWeek.includes(t.id));
  const completedTasks = planTasks.filter(t => completedThisWeek.includes(t.id));
  
  // Calculate XP target for tasks only (based on plan's content requirements)
  const planTasksXPTarget = planTasks.reduce((sum, t) => sum + calculateXP(t.type), 0);
  const earnedXP = weeklyTasksXPEarned;
  const completionPercent = planTasksXPTarget > 0 ? Math.min(100, Math.round((earnedXP / planTasksXPTarget) * 100)) : 0;
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
      {/* Tasks Progress */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/50 to-amber-500/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-[13px] font-semibold">Tasks Progress</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">{earnedXP}</span>
            <span className="text-[10px] text-muted-foreground">/{planTasksXPTarget} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
          />
        </div>
        
        {/* S1/S2 Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">S1 · Fast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">S2 · Slow</span>
          </div>
        </div>
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
