/**
 * Spotify-Style Tasks View v1.2
 * 
 * Horizontal scrollable sections for cognitive content:
 * - Suggested For You (based on cognitive state)
 * - Podcasts
 * - Books
 * - Articles
 * 
 * v1.2: Track "In Progress" when user opens external links,
 *       show badge on cards, completed items go to Library only
 * 
 * Spotify-inspired design: horizontal carousels, large cards, minimal UI
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, 
  BookOpen, 
  FileText,
  Leaf,
  ChevronRight,
  Play,
  Clock,
  Sparkles,
  Library,
  BookMarked,
  Check,
  ExternalLink,
  Loader2
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePodcastPermissioning, PodcastEligibility } from "@/hooks/usePodcastPermissioning";
import { useReadingPermissioning, ReadingEligibility } from "@/hooks/useReadingPermissioning";
import { CognitiveLibrary } from "@/components/dashboard/CognitiveInputs";
import { 
  getApplePodcastUrl, 
  getSpotifySearchUrl, 
  PodcastDemand 
} from "@/data/podcasts";
import { ReadingType, ReadingDemand, getReadingTypeCopy } from "@/data/readings";
import { calculateSingleTaskRQContribution } from "@/lib/reasoningQuality";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useInProgressTasks } from "@/hooks/useInProgressTasks";
import { useRecordIntradayOnAction } from "@/hooks/useRecordIntradayOnAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, subDays } from "date-fns";

// Status type for tracking task progress
type TaskStatus = "not_started" | "in_progress" | "completed";

// Gradient backgrounds for cards - Spotify-inspired
const PODCAST_GRADIENTS = [
  "from-violet-600/80 to-indigo-800/80",
  "from-emerald-600/80 to-teal-800/80",
  "from-rose-600/80 to-pink-800/80",
  "from-amber-600/80 to-orange-800/80",
  "from-sky-600/80 to-blue-800/80",
];

const BOOK_GRADIENTS = [
  "from-purple-700/80 to-violet-900/80",
  "from-slate-600/80 to-slate-800/80",
  "from-stone-600/80 to-stone-800/80",
];

const ARTICLE_GRADIENTS = [
  "from-cyan-600/80 to-teal-800/80",
  "from-lime-600/80 to-green-800/80",
  "from-fuchsia-600/80 to-purple-800/80",
];

// Get gradient by index
function getGradient(index: number, type: "podcast" | "book" | "article"): string {
  const gradients = type === "podcast" ? PODCAST_GRADIENTS : type === "book" ? BOOK_GRADIENTS : ARTICLE_GRADIENTS;
  return gradients[index % gradients.length];
}

// Demand badge - minimal style
function DemandPill({ demand }: { demand: string }) {
  return (
    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
      {demand.replace("_", " ")}
    </span>
  );
}

// RQ Contribution badge - shows potential RQ contribution for this item type
// Note: This is the potential contribution to Task Priming, not a guaranteed delta to total RQ
const TASK_PRIMING_WEIGHT = 0.20;
function RQContributionBadge({ type }: { type: "podcast" | "article" | "book" }) {
  const baseContribution = calculateSingleTaskRQContribution(type, null);
  // Potential RQ impact = base contribution × Task Priming weight (0.20)
  const potentialRQContribution = Math.round(baseContribution * TASK_PRIMING_WEIGHT * 10) / 10;
  return (
    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-black/40 text-white/90 backdrop-blur-sm">
      +{potentialRQContribution} RQ potential
    </span>
  );
}

// Badge for suggested items
function SuggestedBadge() {
  return (
    <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground">
      Suggested
    </span>
  );
}

// Section header component
function SectionHeader({ 
  title, 
  subtitle,
  icon: Icon,
  onSeeAll 
}: { 
  title: string; 
  subtitle?: string;
  icon?: typeof Headphones;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {onSeeAll && (
        <button 
          onClick={onSeeAll}
          className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          See all
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Podcast Card - Spotify Album Style with Status Badge
function PodcastCard({ 
  podcast, 
  index,
  onClick,
  status,
  isSuggested = false
}: { 
  podcast: PodcastEligibility;
  index: number;
  onClick: () => void;
  status: TaskStatus;
  isSuggested?: boolean;
}) {
  const gradient = getGradient(index, "podcast");
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group flex-shrink-0 w-[140px] text-left relative"
    >
      {/* Album Art Style Cover */}
      <div className={cn(
        "w-[140px] h-[140px] rounded-xl bg-gradient-to-br relative overflow-hidden mb-2 shadow-lg group-hover:shadow-xl transition-all",
        gradient
      )}>
        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Headphones className="w-12 h-12 text-white/40" />
        </div>
        
        {/* Status badge - In Progress or Suggested */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {status === "in_progress" && (
            <Badge variant="secondary" className="bg-amber-500/90 text-white border-0 text-[9px] px-1.5 py-0.5 gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              In Progress
            </Badge>
          )}
          {isSuggested && status !== "in_progress" && (
            <SuggestedBadge />
          )}
        </div>
        
        {/* Demand and RQ badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <DemandPill demand={podcast.podcast.demand} />
          <RQContributionBadge type="podcast" />
        </div>
        
        {/* Play button on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <div className="w-10 h-10 rounded-full bg-primary shadow-xl flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Title */}
      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
        {podcast.podcast.title}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        {podcast.podcast.intent.split('.')[0]}
      </p>
    </motion.button>
  );
}

// Reading Card - Spotify Album Style (for Books and Articles) with Status Badge
function ReadingCard({ 
  reading, 
  index,
  type,
  onClick,
  status,
  isSuggested = false
}: { 
  reading: ReadingEligibility;
  index: number;
  type: "book" | "article";
  onClick: () => void;
  status: TaskStatus;
  isSuggested?: boolean;
}) {
  const gradient = getGradient(index, type);
  const Icon = type === "book" ? BookOpen : reading.reading.readingType === "RECOVERY_SAFE" ? Leaf : FileText;
  const copy = getReadingTypeCopy(reading.reading.readingType);
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group flex-shrink-0 w-[140px] text-left relative"
    >
      {/* Album Art Style Cover */}
      <div className={cn(
        "w-[140px] h-[140px] rounded-xl bg-gradient-to-br relative overflow-hidden mb-2 shadow-lg group-hover:shadow-xl transition-all",
        gradient
      )}>
        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-12 h-12 text-white/40" />
        </div>
        
        {/* Status badge - In Progress or Suggested */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {status === "in_progress" && (
            <Badge variant="secondary" className="bg-amber-500/90 text-white border-0 text-[9px] px-1.5 py-0.5 gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              In Progress
            </Badge>
          )}
          {isSuggested && status !== "in_progress" && (
            <SuggestedBadge />
          )}
        </div>
        
        {/* Demand and RQ badges only - removed category label */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <DemandPill demand={reading.reading.demand} />
          <RQContributionBadge type={type} />
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/80">
          <Clock className="w-3 h-3" />
          {reading.reading.durationMinutes} min
        </div>
        
        {/* Play button on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <div className="w-10 h-10 rounded-full bg-primary shadow-xl flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Title */}
      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
        {reading.reading.title}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        {reading.reading.author || reading.reading.source || ""}
      </p>
    </motion.button>
  );
}

// SuggestedHeroCard removed - using badges on cards instead

// Details Dialog for Podcasts with Mark Complete
function PodcastDetailsDialog({
  podcast,
  open,
  onClose,
  onMarkComplete,
  onOpenExternal,
  isCompleted,
  isInProgress,
  isMarking,
}: {
  podcast: PodcastEligibility | null;
  open: boolean;
  onClose: () => void;
  onMarkComplete: (podcastId: string) => void;
  onOpenExternal: (podcastId: string, contentType: "podcast" | "book" | "article") => void;
  isCompleted: boolean;
  isInProgress: boolean;
  isMarking: boolean;
}) {
  if (!podcast) return null;
  
  const appleUrl = getApplePodcastUrl(podcast.podcast.applePodcastId);
  const spotifyUrl = getSpotifySearchUrl(podcast.podcast.spotifyQuery);
  
  const handleExternalOpen = (url: string) => {
    onOpenExternal(podcast.podcast.id, "podcast");
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            {podcast.podcast.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {podcast.podcast.intent}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          {/* In Progress indicator */}
          {isInProgress && !isCompleted && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                In Progress — Mark complete when finished
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => handleExternalOpen(appleUrl)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Apple Podcasts
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => handleExternalOpen(spotifyUrl)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Spotify
            </Button>
          </div>
          
          {/* Mark Complete Button */}
          <Button
            variant={isCompleted ? "secondary" : "default"}
            size="sm"
            className="w-full gap-2"
            onClick={() => onMarkComplete(podcast.podcast.id)}
            disabled={isCompleted || isMarking}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4" />
                Completed
              </>
            ) : isMarking ? (
              "Saving..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Details Dialog for Readings with Mark Complete
function ReadingDetailsDialog({
  reading,
  open,
  onClose,
  onMarkComplete,
  onOpenExternal,
  isCompleted,
  isInProgress,
  isMarking,
}: {
  reading: ReadingEligibility | null;
  open: boolean;
  onClose: () => void;
  onMarkComplete: (readingId: string) => void;
  onOpenExternal: (readingId: string, contentType: "podcast" | "book" | "article") => void;
  isCompleted: boolean;
  isInProgress: boolean;
  isMarking: boolean;
}) {
  if (!reading) return null;
  
  const contentType = reading.reading.readingType === "BOOK" ? "book" : "article";
  
  const handleExternalOpen = () => {
    if (reading.reading.url) {
      onOpenExternal(reading.reading.id, contentType);
      window.open(reading.reading.url, "_blank", "noopener,noreferrer");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {reading.reading.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {reading.reading.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          {/* In Progress indicator */}
          {isInProgress && !isCompleted && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                In Progress — Mark complete when finished
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {reading.reading.author && <span>{reading.reading.author}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {reading.reading.durationMinutes} min
            </span>
          </div>
          
          {reading.reading.url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={handleExternalOpen}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Reading
            </Button>
          )}
          
          {/* Mark Complete Button */}
          <Button
            variant={isCompleted ? "secondary" : "default"}
            size="sm"
            className="w-full gap-2"
            onClick={() => onMarkComplete(reading.reading.id)}
            disabled={isCompleted || isMarking}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4" />
                Completed
              </>
            ) : isMarking ? (
              "Saving..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function SpotifyTasksView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { recordMetricsSnapshot } = useRecordIntradayOnAction();
  const [viewMode, setViewMode] = useState<"browse" | "library">("browse");
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastEligibility | null>(null);
  const [selectedReading, setSelectedReading] = useState<ReadingEligibility | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [showAddedToLibrary, setShowAddedToLibrary] = useState(false);
  const [addedContentType, setAddedContentType] = useState<"podcast" | "book" | "article" | null>(null);
  
  // Get permissioning data
  const {
    enabledPodcasts,
    withheldPodcasts,
    isRecoveryMode: podcastRecoveryMode,
    isLoading: podcastLoading,
  } = usePodcastPermissioning();
  
  const {
    enabledReadings,
    withheldReadings,
    isRecoveryMode: readingRecoveryMode,
    isLoading: readingLoading,
  } = useReadingPermissioning();
  
  const isLoading = podcastLoading || readingLoading;
  const isRecoveryMode = podcastRecoveryMode || readingRecoveryMode;
  
  // Fetch completed content IDs
  const { data: completedIds = [] } = useQuery({
    queryKey: ["completed-content-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get from exercise_completions with content- prefix
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("exercise_id")
        .eq("user_id", user.id)
        .like("exercise_id", "content-%");
      
      if (error) throw error;
      
      // Extract the content ID from exercise_id format: content-{type}-{id}
      return (data || []).map(c => {
        const parts = c.exercise_id.split("-");
        return parts.slice(2).join("-"); // Get everything after "content-{type}-"
      });
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
  
  // Use shared hook for in-progress items (synced with Home page, auto-filters completed)
  const { 
    inProgressIds, 
    markAsInProgress, 
    removeFromInProgress 
  } = useInProgressTasks(completedIds);
  
  // Mark item as in-progress when external link is clicked
  const handleOpenExternal = useCallback((contentId: string, contentType?: "podcast" | "book" | "article") => {
    if (!inProgressIds.includes(contentId) && !completedIds.includes(contentId)) {
      markAsInProgress(contentId, contentType || "podcast");
      toast.info("Task started! Remember to mark complete when finished.", { 
        icon: "📖",
        duration: 3000 
      });
    }
  }, [inProgressIds, completedIds, markAsInProgress]);
  
  // Get status for a content item
  const getTaskStatus = useCallback((contentId: string): TaskStatus => {
    if (completedIds.includes(contentId)) return "completed";
    if (inProgressIds.includes(contentId)) return "in_progress";
    return "not_started";
  }, [completedIds, inProgressIds]);
  
  // Mutation to mark content as complete
  const markCompleteMutation = useMutation({
    mutationFn: async ({ contentId, contentType }: { contentId: string; contentType: "podcast" | "book" | "article" }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const exerciseId = `content-${contentType}-${contentId}`;
      
      // Insert into exercise_completions for tracking
      const { error } = await supabase
        .from("exercise_completions")
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          gym_area: "reasoning", // Tasks are reasoning-related
          thinking_mode: "slow",
          difficulty: "medium",
          xp_earned: 0, // Tasks don't give XP
          score: 100,
          week_start: weekStart,
        });
      
      if (error) throw error;
      
      return { contentId, contentType };
    },
    onMutate: async ({ contentId }) => {
      setMarkingId(contentId);
    },
    onSuccess: ({ contentId, contentType }) => {
      // Remove from in-progress using shared hook
      removeFromInProgress(contentId);

      // Show animated overlay
      setAddedContentType(contentType);
      setShowAddedToLibrary(true);
      setTimeout(() => setShowAddedToLibrary(false), 2000);

      // IMPORTANT: include userId in invalidations to guarantee correct refresh across sessions
      queryClient.invalidateQueries({ queryKey: ["completed-content-ids", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["weekly-content-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["in-progress-content-ids", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["logged-exposures", user?.id] }); // For CognitiveLibrary
      // RQ depends on the 7d task window
      queryClient.invalidateQueries({ queryKey: ["task-completions-7d", user?.id] });
      // Home reads live RQ but uses persisted timestamps; invalidate to refetch immediately
      queryClient.invalidateQueries({ queryKey: ["reasoning-quality-persisted", user?.id] });
      // Analytics 1d uses intraday events + "now" point
      queryClient.invalidateQueries({ queryKey: ["intraday-events", user?.id] });

      // CRITICAL: create an intraday event point so Analytics (1d) can show intermediate values.
      // Small delay ensures the just-inserted completion is included in the 7d task window.
      recordMetricsSnapshot(
        "task",
        { contentType, contentId, source: "spotify_tasks_view" },
        250
      );
      setSelectedPodcast(null);
      setSelectedReading(null);
    },
    onError: (error) => {
      console.error("Failed to mark complete:", error);
      toast.error("Failed to save completion");
    },
    onSettled: () => {
      setMarkingId(null);
    },
  });
  
  const handleMarkPodcastComplete = (podcastId: string) => {
    markCompleteMutation.mutate({ contentId: podcastId, contentType: "podcast" });
  };
  
  const handleMarkReadingComplete = (readingId: string) => {
    const reading = [...enabledReadings, ...withheldReadings].find(r => r.reading.id === readingId);
    const contentType = reading?.reading.readingType === "BOOK" ? "book" : "article";
    markCompleteMutation.mutate({ contentId: readingId, contentType });
  };
  
  // Filter out completed items from browse view
  const filterCompleted = <T extends PodcastEligibility | ReadingEligibility>(
    items: T[],
    getIdFn: (item: T) => string
  ) => items.filter(item => !completedIds.includes(getIdFn(item)));
  
  // Combine all enabled content for "Suggested" section (exclude completed)
  const allSuggested: Array<{ type: "podcast" | "book" | "article"; item: PodcastEligibility | ReadingEligibility }> = [
    ...filterCompleted(enabledPodcasts, p => p.podcast.id).map(p => ({ 
      type: "podcast" as const, 
      item: p as PodcastEligibility | ReadingEligibility 
    })),
    ...filterCompleted(enabledReadings, r => r.reading.id).map(r => ({ 
      type: (r.reading.readingType === "BOOK" ? "book" : "article") as "podcast" | "book" | "article", 
      item: r as PodcastEligibility | ReadingEligibility 
    })),
  ];
  
  // Create a set of suggested IDs for marking with badge
  const suggestedIds = new Set(allSuggested.map(s => {
    if (s.type === "podcast") {
      return (s.item as PodcastEligibility).podcast.id;
    }
    return (s.item as ReadingEligibility).reading.id;
  }));
  
  // Filter books and articles (exclude completed)
  const books = filterCompleted(
    [...enabledReadings, ...withheldReadings].filter(r => r.reading.readingType === "BOOK"),
    r => r.reading.id
  );
  const articles = filterCompleted(
    [...enabledReadings, ...withheldReadings].filter(
      r => r.reading.readingType === "NON_FICTION" || r.reading.readingType === "RECOVERY_SAFE"
    ),
    r => r.reading.id
  );
  const allPodcasts = filterCompleted(
    [...enabledPodcasts, ...withheldPodcasts],
    p => p.podcast.id
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-4 relative">
      {/* Added to Library Animation Overlay */}
      <AnimatePresence>
        {showAddedToLibrary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-2xl"
            >
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                >
                  <Library className="w-8 h-8 text-primary" />
                </motion.div>
              </motion.div>
              
              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <p className="text-lg font-semibold">Added to Library!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {addedContentType && (() => {
                    const baseContribution = calculateSingleTaskRQContribution(addedContentType, null);
                    const realRQDelta = Math.round(baseContribution * TASK_PRIMING_WEIGHT * 10) / 10;
                    return `+${realRQDelta} RQ`;
                  })()}
                </p>
              </motion.div>
              
              {/* Checkmark animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-0.5 bg-muted/30 border border-border/40 rounded-lg">
        <button
          onClick={() => setViewMode("browse")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all",
            viewMode === "browse" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookMarked className="w-3 h-3" />
          Browse
        </button>
        <button
          onClick={() => setViewMode("library")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all",
            viewMode === "library" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Library className="w-3 h-3" />
          Your Library
        </button>
      </div>
      
      {viewMode === "library" ? (
        <CognitiveLibrary />
      ) : (
        <>
          {/* Recovery Mode Message */}
          {isRecoveryMode && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-primary/5 border border-primary/20"
            >
              <p className="text-xs text-center text-muted-foreground">
                <span className="font-medium text-primary">Recovery mode active.</span>
                {" "}Light content suggested today.
              </p>
            </motion.div>
          )}
          
          
          {/* Podcasts Section */}
          {allPodcasts.length > 0 && (
            <section>
              <SectionHeader 
                title="Podcasts" 
                subtitle="Critical thinking through content"
                icon={Headphones}
              />
              <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                  {allPodcasts.slice(0, 6).map((podcast, index) => (
                    <PodcastCard
                      key={podcast.podcast.id}
                      podcast={podcast}
                      index={index}
                      onClick={() => setSelectedPodcast(podcast)}
                      status={getTaskStatus(podcast.podcast.id)}
                      isSuggested={suggestedIds.has(podcast.podcast.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </section>
          )}
          
          {/* Books Section */}
          {books.length > 0 && (
            <section>
              <SectionHeader 
                title="Books" 
                subtitle="Long-form chapters for deep thinking"
                icon={BookOpen}
              />
              <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                  {books.slice(0, 6).map((book, index) => (
                    <ReadingCard
                      key={book.reading.id}
                      reading={book}
                      index={index}
                      type="book"
                      onClick={() => setSelectedReading(book)}
                      status={getTaskStatus(book.reading.id)}
                      isSuggested={suggestedIds.has(book.reading.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </section>
          )}
          
          {/* Articles Section */}
          {articles.length > 0 && (
            <section>
              <SectionHeader 
                title="Reading" 
                subtitle="Articles and essays for concept retention"
                icon={FileText}
              />
              <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                  {articles.slice(0, 6).map((article, index) => (
                    <ReadingCard
                      key={article.reading.id}
                      reading={article}
                      index={index}
                      type="article"
                      onClick={() => setSelectedReading(article)}
                      status={getTaskStatus(article.reading.id)}
                      isSuggested={suggestedIds.has(article.reading.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </section>
          )}
        </>
      )}
      
      {/* Dialogs */}
      <PodcastDetailsDialog
        podcast={selectedPodcast}
        open={!!selectedPodcast}
        onClose={() => setSelectedPodcast(null)}
        onMarkComplete={handleMarkPodcastComplete}
        onOpenExternal={handleOpenExternal}
        isCompleted={selectedPodcast ? completedIds.includes(selectedPodcast.podcast.id) : false}
        isInProgress={selectedPodcast ? inProgressIds.includes(selectedPodcast.podcast.id) : false}
        isMarking={markingId === selectedPodcast?.podcast.id}
      />
      <ReadingDetailsDialog
        reading={selectedReading}
        open={!!selectedReading}
        onClose={() => setSelectedReading(null)}
        onMarkComplete={handleMarkReadingComplete}
        onOpenExternal={handleOpenExternal}
        isCompleted={selectedReading ? completedIds.includes(selectedReading.reading.id) : false}
        isInProgress={selectedReading ? inProgressIds.includes(selectedReading.reading.id) : false}
        isMarking={markingId === selectedReading?.reading.id}
      />
    </div>
  );
}
