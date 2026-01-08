import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Headphones, BookOpen, FileText, CheckCircle2, 
  Zap, Timer, ExternalLink, TrendingUp
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
import { startOfWeek, addDays, format, subDays, parseISO } from "date-fns";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

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
  podcast: { label: "Podcast", icon: Headphones, color: "text-violet-500", bgColor: "bg-violet-500/15" },
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

// Full content library for lookup (matches CognitiveInputs.tsx)
const CONTENT_LIBRARY: Record<string, CognitiveInput> = {
  "in-our-time": { id: "in-our-time", type: "podcast", title: "In Our Time", author: "BBC Radio 4", duration: "35–55 min", difficulty: 3, thinkingSystem: "S2", primaryUrl: "" },
  "partially-examined-life": { id: "partially-examined-life", type: "podcast", title: "The Partially Examined Life", author: "Mark Linsenmayer et al.", duration: "60–120 min", difficulty: 5, thinkingSystem: "S2", primaryUrl: "" },
  "very-bad-wizards": { id: "very-bad-wizards", type: "podcast", title: "Very Bad Wizards", author: "Tamler Sommers & David Pizarro", duration: "45–90 min", difficulty: 3, thinkingSystem: "S1+S2", primaryUrl: "" },
  "mindscape": { id: "mindscape", type: "podcast", title: "Sean Carroll's Mindscape", author: "Sean Carroll", duration: "60–120 min", difficulty: 4, thinkingSystem: "S2", primaryUrl: "" },
  "philosophy-bites": { id: "philosophy-bites", type: "podcast", title: "Philosophy Bites", author: "David Edmonds & Nigel Warburton", duration: "15–25 min", difficulty: 2, thinkingSystem: "S2", primaryUrl: "" },
  "econtalk": { id: "econtalk", type: "podcast", title: "EconTalk", author: "Russ Roberts", duration: "50–90 min", difficulty: 4, thinkingSystem: "S2", primaryUrl: "" },
  "conversations-with-tyler": { id: "conversations-with-tyler", type: "podcast", title: "Conversations with Tyler", author: "Tyler Cowen", duration: "45–90 min", difficulty: 4, thinkingSystem: "S2", primaryUrl: "" },
  "hbr-critical-thinking": { id: "hbr-critical-thinking", type: "article", title: "Critical Thinking Is About Asking Better Questions", author: "Harvard Business Review", duration: "10–15 min", difficulty: 2, thinkingSystem: "S2", primaryUrl: "" },
  "hbr-rush-decisions": { id: "hbr-rush-decisions", type: "article", title: "If You Rush Your Decisions, Ask Yourself Why", author: "Harvard Business Review", duration: "5–10 min", difficulty: 1, thinkingSystem: "S2", primaryUrl: "" },
  "mit-intelligent-choices": { id: "mit-intelligent-choices", type: "article", title: "Intelligent Choices Reshape Decision-Making", author: "MIT Sloan Management Review", duration: "15–20 min", difficulty: 3, thinkingSystem: "S2", primaryUrl: "" },
  "apology-plato": { id: "apology-plato", type: "book", title: "Apology", author: "Plato", duration: "1–2 hrs", difficulty: 3, thinkingSystem: "S2", primaryUrl: "" },
  "omelas-le-guin": { id: "omelas-le-guin", type: "book", title: "The Ones Who Walk Away from Omelas", author: "Ursula K. Le Guin", duration: "30–45 min", difficulty: 3, thinkingSystem: "S1+S2", primaryUrl: "" },
  "myth-sisyphus-camus": { id: "myth-sisyphus-camus", type: "book", title: "The Myth of Sisyphus", author: "Albert Camus", duration: "2–3 hrs", difficulty: 4, thinkingSystem: "S2", primaryUrl: "" },
  "meditations-aurelius": { id: "meditations-aurelius", type: "book", title: "Meditations", author: "Marcus Aurelius", duration: "10–15 min/session", difficulty: 2, thinkingSystem: "S2", primaryUrl: "" },
};

// Get tasks for specific plan based on contentPerWeek
function getTasksForPlan(planId: TrainingPlanId): CognitiveInput[] {
  const plan = TRAINING_PLANS[planId];
  if (!plan) return ALL_TASKS.slice(0, 1);
  
  // Return tasks based on plan's contentPerWeek requirement
  return ALL_TASKS.slice(0, plan.contentPerWeek);
}

// Helper to get content info from library or create a fallback
function getContentInfo(contentId: string): CognitiveInput | null {
  return CONTENT_LIBRARY[contentId] || null;
}

// Hook to get completed content for THIS WEEK only
// Source of truth can be either:
// - monthly_content_assignments (Library-driven)
// - exercise_completions (legacy/other flows that award XP directly)
// We merge both so Training Details never shows 0 when XP exists.
function useWeeklyCompletedContent(userId: string | undefined) {
  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["weekly-content-completions", userId, weekStartStr],
    queryFn: async () => {
      if (!userId) return [] as { contentId: string; xpEarned: number }[];

      const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEndDate = addDays(weekStartDate, 7);

      const [assignmentsRes, completionsRes] = await Promise.all([
        supabase
          .from("monthly_content_assignments")
          .select("content_id, content_type, completed_at, status")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", weekStartDate.toISOString())
          .lt("completed_at", weekEndDate.toISOString()),

        supabase
          .from("exercise_completions")
          .select("exercise_id, xp_earned, week_start")
          .eq("user_id", userId)
          .eq("week_start", weekStartStr)
          .like("exercise_id", "content-%"),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (completionsRes.error) throw completionsRes.error;

      const fromAssignments = (assignmentsRes.data || []).map((row: any) => {
        const t = (row.content_type as string | null) ?? "reading";
        const normalized: InputType = t === "reading" ? "article" : t === "book" ? "book" : "podcast";
        return {
          contentId: row.content_id as string,
          xpEarned: calculateXP(normalized),
        };
      });

      const fromCompletions = (completionsRes.data || [])
        .map((row: any) => {
          const exerciseId = String(row.exercise_id || "");
          // Expected: content-{type}-{contentId}
          const parts = exerciseId.split("-");
          const typePart = parts[1] as InputType | undefined;
          const contentId = parts.slice(2).join("-");
          if (!contentId) return null;
          return {
            contentId,
            xpEarned: Number(row.xp_earned || 0) || (typePart ? calculateXP(typePart) : 0),
          };
        })
        .filter(Boolean) as { contentId: string; xpEarned: number }[];

      // Merge + dedupe by contentId (prefer exercise_completions XP if present)
      const byId = new Map<string, { contentId: string; xpEarned: number }>();
      for (const row of fromAssignments) byId.set(row.contentId, row);
      for (const row of fromCompletions) byId.set(row.contentId, row);

      return Array.from(byId.values());
    },
    enabled: !!userId,
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  });
}

// Hook to get 14-day tasks history for trend chart
function useTasksHistory(days: number = 14) {
  const { user } = useAuth();
  
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["tasks-history-14d", stableUserId, days],
    queryFn: async () => {
      if (!stableUserId) return [];

      const startDate = subDays(new Date(), days);

      const { data, error } = await supabase
        .from("exercise_completions")
        .select("xp_earned, completed_at, exercise_id")
        .eq("user_id", stableUserId)
        .gte("completed_at", startDate.toISOString())
        .like("exercise_id", "content-%"); // Only content tasks

      if (error) throw error;

      // Group by date with breakdown by type
      const byDate: Record<string, { podcast: number; book: number; article: number }> = {};
      (data || []).forEach((row) => {
        const date = format(parseISO(row.completed_at), "yyyy-MM-dd");
        if (!byDate[date]) byDate[date] = { podcast: 0, book: 0, article: 0 };
        
        const xp = row.xp_earned || 0;
        // exercise_id format: "content-{type}-{id}" e.g. "content-podcast-in-our-time"
        const match = (row.exercise_id || "").match(/^content-(podcast|book|article)-/);
        const contentType = (match?.[1] as "podcast" | "book" | "article" | undefined) ?? "article";

        byDate[date][contentType] += xp;
      });

      // Build 14-day array with dd/MM format and type breakdown
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayData = byDate[dateStr] || { podcast: 0, book: 0, article: 0 };
        result.push({
          date: dateStr,
          dateLabel: format(date, "d/M"),
          xp: dayData.podcast + dayData.book + dayData.article,
          podcast: dayData.podcast,
          book: dayData.book,
          article: dayData.article,
        });
      }
      return result;
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
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

  // Auth context can be transiently null during tab/route transitions.
  // Keep a stable userId to prevent queries from disabling and flashing to 0.
  const stableUserId = user?.id ?? (() => {
    try {
      return localStorage.getItem("nl:lastUserId") || undefined;
    } catch {
      return undefined;
    }
  })();

  const { weeklyContentXP } = useWeeklyProgress();
  const { data: weeklyCompletions = [], isLoading } = useWeeklyCompletedContent(stableUserId);
  const { data: tasksHistoryData } = useTasksHistory(14);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const tasksTrendMax = useMemo(() => {
    const max = Math.max(0, ...(tasksHistoryData ?? []).map((d) => Number(d.xp) || 0));
    return Number.isFinite(max) ? max : 0;
  }, [tasksHistoryData]);

  const tasksTrendTicks = useMemo(() => {
    if (tasksTrendMax <= 0) return [0];

    // “Nice” integer steps so the axis reads cleanly (no 0,3,6,10 weirdness).
    const step =
      tasksTrendMax <= 10 ? 1 :
      tasksTrendMax <= 25 ? 5 :
      tasksTrendMax <= 50 ? 10 :
      tasksTrendMax <= 100 ? 20 :
      50;

    const ticks: number[] = [];
    for (let t = 0; t < tasksTrendMax; t += step) ticks.push(t);
    if (ticks[ticks.length - 1] !== tasksTrendMax) ticks.push(tasksTrendMax);
    return ticks;
  }, [tasksTrendMax]);

  // Get user's training plan for XP target
  const { data: profile } = useQuery({
    queryKey: ["profile", stableUserId],
    queryFn: async () => {
      if (!stableUserId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("training_plan")
        .eq("user_id", stableUserId)
        .single();
      return data;
    },
    enabled: !!stableUserId,
  });
  
  const userPlan = (profile?.training_plan as TrainingPlanId) || "light";
  const plan = TRAINING_PLANS[userPlan];
  
  // Extract completed content IDs for this week
  const completedThisWeek = weeklyCompletions.map(c => c.contentId);
  // Calculate XP earned this week from these tasks
  const weeklyTasksXPEarned = weeklyCompletions.reduce((sum, c) => sum + c.xpEarned, 0);

  const toggleMutation = useMutation({
    mutationFn: async ({ taskId, taskType }: { taskId: string; taskType: InputType }) => {
      // Use stableUserId (never undefined during tab switches)
      const uid = stableUserId;
      if (!uid) throw new Error("Not authenticated");
      
      const weekStart = getCurrentWeekStart();
      const xpEarned = calculateXP(taskType);
      
      // Check if already in user_listened_podcasts (to prevent duplicates)
      const { data: existing } = await supabase
        .from("user_listened_podcasts")
        .select("id")
        .eq("user_id", uid)
        .eq("podcast_id", taskId)
        .maybeSingle();
      
      // Only insert to user_listened_podcasts if not already there
      if (!existing) {
        const { error: legacyError } = await supabase
          .from("user_listened_podcasts")
          .insert({ user_id: uid, podcast_id: taskId });
        if (legacyError) throw legacyError;
      }
      
      // Check if XP already recorded for this week
      const exerciseId = `content-${taskType}-${taskId}`;
      const { data: existingXP } = await supabase
        .from("exercise_completions")
        .select("id")
        .eq("user_id", uid)
        .eq("exercise_id", exerciseId)
        .eq("week_start", weekStart)
        .maybeSingle();
      
      // Only record XP if not already recorded this week
      if (!existingXP) {
        const { error: xpError } = await supabase
          .from("exercise_completions")
          .insert({
            user_id: uid,
            exercise_id: exerciseId,
            gym_area: "content",
            thinking_mode: "slow",
            difficulty: taskType === "book" ? "hard" : taskType === "article" ? "medium" : "easy",
            xp_earned: xpEarned,
            score: 100,
            week_start: weekStart,
          });
        if (xpError) throw xpError;
      }
    },
    onMutate: async ({ taskId }) => {
      setTogglingId(taskId);
      await queryClient.cancelQueries({ queryKey: ["weekly-content-completions", stableUserId] });
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
    if (!stableUserId) return;
    toggleMutation.mutate({ taskId, taskType });
  };

  // Get tasks for the user's plan only
  const planTasks = getTasksForPlan(userPlan);
  
  // Filter active tasks (not completed) - only from plan tasks
  const activeTasks = planTasks.filter(t => !completedThisWeek.includes(t.id));
  
  // Get ALL completed content (from plan + from CognitiveInputs library)
  // This ensures any content completed shows up in the completed list
  const completedTasks: CognitiveInput[] = completedThisWeek
    .map(contentId => {
      // First check if it's in planTasks
      const planTask = planTasks.find(t => t.id === contentId);
      if (planTask) return planTask;
      // Otherwise look it up in the full content library
      return getContentInfo(contentId);
    })
    .filter((t): t is CognitiveInput => t !== null);
  
  // Use plan's explicit contentXPTarget for tasks progress
  const planTasksXPTarget = plan?.contentXPTarget || 24;
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

      {/* 14-Day Trend Chart */}
      {tasksHistoryData && tasksHistoryData.some(d => d.xp > 0) && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-foreground">14-Day Trend</span>
            <span className="text-[9px] text-muted-foreground ml-auto">XP / day</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  allowDecimals={false}
                  domain={[0, tasksTrendMax]}
                  ticks={tasksTrendTicks}
                  tickFormatter={(value) => `${Math.round(value)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelFormatter={(label) => label}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      podcast: '🎧 Podcast',
                      book: '📖 Book',
                      article: '📄 Reading'
                    };
                    return [`${value} XP`, labels[name] || name];
                  }}
                  cursor={false}
                />
                <Bar 
                  dataKey="podcast" 
                  stackId="tasks"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill="#8b5cf6"
                  name="podcast"
                />
                <Bar 
                  dataKey="book" 
                  stackId="tasks"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill="#f59e0b"
                  name="book"
                />
                <Bar 
                  dataKey="article" 
                  stackId="tasks"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  fill="#3b82f6"
                  name="article"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {false && activeTasks.length > 0 && (
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

      {/* Goal reached state */}
      {earnedXP >= planTasksXPTarget && planTasksXPTarget > 0 && (
        <div className="text-center py-4">
          <CheckCircle2 className="h-8 w-8 text-green-500/60 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-500">All tasks completed!</p>
          <p className="text-[10px] text-muted-foreground">You earned {earnedXP} XP this week</p>
        </div>
      )}
    </motion.div>
  );
}
