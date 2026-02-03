import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Headphones, Clock, Target, ExternalLink, 
  BookOpen, FileText, ChevronDown, ChevronUp, Brain, Info, 
  Zap, CheckCircle2, Timer, StopCircle, Calendar, Library, Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useRecordContentCompletion, useRemoveContentCompletion } from "@/hooks/useExerciseXP";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useRecordIntradayOnAction } from "@/hooks/useRecordIntradayOnAction";
import { WEEKLY_GOAL_MESSAGES } from "@/lib/cognitiveFeedback";
import { PODCASTS, getApplePodcastUrl, getSpotifyShowUrl } from "@/data/podcasts";
import { READINGS } from "@/data/readings";

type InputType = "podcast" | "book" | "article";
type ThinkingSystem = "S1" | "S2" | "S1+S2";

interface PrescriptionBlock {
  whenToUse: string;
  purpose: string;
  duration: string;
  stopRule: string;
}

interface CognitiveInput {
  id: string;
  type: InputType;
  title: string;
  author?: string;
  summary: string;
  duration: string;
  cognitivePurpose: string;
  reflectionPrompt: string;
  primaryUrl: string;
  secondaryUrl?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  thinkingSystem: ThinkingSystem;
  prescription?: PrescriptionBlock;
}

const INPUT_TYPE_CONFIG: Record<InputType, { label: string; icon: typeof Headphones; color: string }> = {
  podcast: { label: "Podcast", icon: Headphones, color: "text-muted-foreground" },
  book: { label: "Book", icon: BookOpen, color: "text-muted-foreground" },
  article: { label: "Reading", icon: FileText, color: "text-muted-foreground" },
};

const THINKING_SYSTEM_CONFIG: Record<ThinkingSystem, { label: string; description: string }> = {
  "S1": { 
    label: "Fast Thinking", 
    description: "Intuition, pattern recognition, immediate judgment",
  },
  "S2": { 
    label: "Slow Thinking", 
    description: "Analysis, argumentation, rigorous reasoning",
  },
  "S1+S2": { 
    label: "Dual Process", 
    description: "Activates both intuition and analytical reasoning",
  },
};

// Default active prescriptions for each category
const ACTIVE_PRESCRIPTIONS: Record<InputType, string> = {
  podcast: "in-our-time",
  book: "apology-plato",
  article: "hbr-critical-thinking",
};

const COGNITIVE_INPUTS: CognitiveInput[] = [
  // PODCASTS
  {
    id: "in-our-time",
    type: "podcast",
    title: "In Our Time",
    author: "BBC Radio 4",
    summary: "Dense, well-moderated conversations on historical/scientific/philosophical ideas; excellent for attention training and argument tracking.",
    duration: "35–55 min",
    cognitivePurpose: "Attention and argument tracking",
    reflectionPrompt: "What is the main thesis? What evidence supports it?",
    primaryUrl: "https://open.spotify.com/show/17YfG23eMbfLBaDPqucgzZ",
    difficulty: 3,
    thinkingSystem: "S2",
    prescription: {
      whenToUse: "Before Slow-Reasoning sessions or on rest days",
      purpose: "Dense conversations on historical/scientific/philosophical ideas",
      duration: "35–55 min",
      stopRule: "Stop after 1 episode; answer 1 reflection prompt",
    },
  },
  {
    id: "partially-examined-life",
    type: "podcast",
    title: "The Partially Examined Life",
    author: "Mark Linsenmayer et al.",
    summary: "Reading and analysis of texts and concepts; trains thesis and counter-thesis reconstruction without oversimplification.",
    duration: "60–120 min",
    cognitivePurpose: "Thesis and counter-thesis reconstruction",
    reflectionPrompt: "Can I reconstruct the argument in 5 sentences?",
    primaryUrl: "https://open.spotify.com/show/1APpUKebKOXJZjoCaCfoVk",
    difficulty: 5,
    thinkingSystem: "S2",
  },
  {
    id: "very-bad-wizards",
    type: "podcast",
    title: "Very Bad Wizards",
    author: "Tamler Sommers & David Pizarro",
    summary: "Philosophy + psychology with a critical edge; useful for dismantling easy intuitions and verifying assumptions.",
    duration: "45–90 min",
    cognitivePurpose: "Dismantling intuitions and verifying assumptions",
    reflectionPrompt: "What moral principle are they using?",
    primaryUrl: "https://open.spotify.com/show/4gGFerFYkDHnezTlwExEbu",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "mindscape",
    type: "podcast",
    title: "Sean Carroll's Mindscape",
    author: "Sean Carroll",
    summary: "Long, structured interviews; excellent for slow thinking and integration of complex concepts.",
    duration: "60–120 min",
    cognitivePurpose: "Slow thinking and complex concept integration",
    reflectionPrompt: "What assumptions underlie the guest's view?",
    primaryUrl: "https://open.spotify.com/show/0GuicJyEmecGjxYOfW3tdJ",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "philosophy-bites",
    type: "podcast",
    title: "Philosophy Bites",
    author: "David Edmonds & Nigel Warburton",
    summary: "Short but rigorous episodes; perfect for micro-sessions of conceptual clarity.",
    duration: "15–25 min",
    cognitivePurpose: "Micro-sessions of conceptual clarity",
    reflectionPrompt: "Define the concept and generate 1 counterexample.",
    primaryUrl: "https://open.spotify.com/show/6UmBytzR58EY4hN1jzQG2o",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/philosophy-bites/id257042117",
    difficulty: 2,
    thinkingSystem: "S2",
  },
  {
    id: "econtalk",
    type: "podcast",
    title: "EconTalk",
    author: "Russ Roberts",
    summary: "First-principles conversations on incentives, trade-offs, and systems; trains causal reasoning.",
    duration: "50–90 min",
    cognitivePurpose: "Causal reasoning on incentives and trade-offs",
    reflectionPrompt: "What is the proposed causal mechanism?",
    primaryUrl: "https://open.spotify.com/show/4M5Gb71lskQ0Rg6e08uQhi",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/econtalk/id135066958",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "conversations-with-tyler",
    type: "podcast",
    title: "Conversations with Tyler",
    author: "Tyler Cowen",
    summary: "Non-obvious questions and deep guests; excellent for mental elasticity and frame-shifting.",
    duration: "45–90 min",
    cognitivePurpose: "Mental elasticity and frame-shifting",
    reflectionPrompt: "What is the least obvious idea that emerged?",
    primaryUrl: "https://open.spotify.com/show/0Z1234tGXD2hVhjFrrhJ7g",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/conversations-with-tyler/id983795625",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  // BOOKS
  {
    id: "apology-plato",
    type: "book",
    title: "Apology",
    author: "Plato",
    summary: "Rational defense under pressure; perfect for training coherence and argumentation.",
    duration: "1–2 hrs",
    cognitivePurpose: "Coherence and argumentation under pressure",
    reflectionPrompt: "Which premise is most vulnerable?",
    primaryUrl: "https://www.amazon.it/s?k=Plato+Apology",
    difficulty: 3,
    thinkingSystem: "S2",
    prescription: {
      whenToUse: "Evening consolidation / post-training",
      purpose: "Rational defense under pressure; argumentative coherence",
      duration: "15–25 min",
      stopRule: "Stop after 5 pages; write a 3-sentence summary",
    },
  },
  {
    id: "omelas-le-guin",
    type: "book",
    title: "The Ones Who Walk Away from Omelas",
    author: "Ursula K. Le Guin",
    summary: "Impossible moral dilemma; trains trade-off and counterfactual thinking.",
    duration: "30–45 min",
    cognitivePurpose: "Trade-off and counterfactual thinking",
    reflectionPrompt: "What cost am I willing to accept?",
    primaryUrl: "https://www.amazon.it/s?k=The+Ones+Who+Walk+Away+from+Omelas+Le+Guin",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "myth-sisyphus-camus",
    type: "book",
    title: "The Myth of Sisyphus",
    author: "Albert Camus",
    summary: "Tight existential reasoning; trains sustained attention on abstract concepts.",
    duration: "2–3 hrs",
    cognitivePurpose: "Sustained attention on abstract concepts",
    reflectionPrompt: "What is the core of the existential argument?",
    primaryUrl: "https://www.amazon.it/s?k=Camus+The+Myth+of+Sisyphus",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "on-liberty-mill",
    type: "book",
    title: "On Liberty",
    author: "John Stuart Mill",
    summary: "Principles, limits, and consequences; excellent for thinking in rules + exceptions.",
    duration: "3–4 hrs",
    cognitivePurpose: "Thinking in rules + exceptions",
    reflectionPrompt: "What are the limits of the proposed principle?",
    primaryUrl: "https://www.amazon.it/s?k=John+Stuart+Mill+On+Liberty",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "politics-english-orwell",
    type: "book",
    title: "Politics and the English Language",
    author: "George Orwell",
    summary: "Dismantles linguistic manipulation; trains precision and anti-rationalization.",
    duration: "30–45 min",
    cognitivePurpose: "Precision and anti-rationalization",
    reflectionPrompt: "What words are masking the argument?",
    primaryUrl: "https://www.amazon.it/s?k=Orwell+Politics+and+the+English+Language",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "meditations-aurelius",
    type: "book",
    title: "Meditations",
    author: "Marcus Aurelius",
    summary: "Discipline of judgment; excellent for reducing reactivity and improving metacognition.",
    duration: "10–15 min/session",
    cognitivePurpose: "Reducing reactivity and improving metacognition",
    reflectionPrompt: "What judgment am I adding to the facts?",
    primaryUrl: "https://www.amazon.it/s?k=Marcus+Aurelius+Meditations",
    difficulty: 2,
    thinkingSystem: "S2",
  },
  {
    id: "notes-from-underground",
    type: "book",
    title: "Notes from Underground",
    author: "Fyodor Dostoevsky",
    summary: "Self-deception and rationalization; excellent for recognizing internal biases.",
    duration: "2–3 hrs",
    cognitivePurpose: "Recognizing self-deception and internal biases",
    reflectionPrompt: "Where does the argument become self-justification?",
    primaryUrl: "https://www.amazon.it/s?k=Dostoevsky+Notes+from+Underground",
    difficulty: 4,
    thinkingSystem: "S1+S2",
  },
  // ARTICLES (HBR / MIT SMR / Science / Nature only)
  {
    id: "hbr-critical-thinking",
    type: "article",
    title: "Critical Thinking Is About Asking Better Questions",
    author: "Harvard Business Review",
    summary: "Shifts focus from quick answers to quality questions for better decisions and diagnosis.",
    duration: "10–15 min",
    cognitivePurpose: "Focus on quality questions for better decisions",
    reflectionPrompt: "What question would improve this decision?",
    primaryUrl: "https://hbr.org/2022/04/critical-thinking-is-about-asking-better-questions",
    difficulty: 2,
    thinkingSystem: "S2",
    prescription: {
      whenToUse: "Before important decisions",
      purpose: "Shift focus from quick answers to quality questions",
      duration: "10–15 min",
      stopRule: "Stop after reading; formulate 3 better questions",
    },
  },
  {
    id: "hbr-rush-decisions",
    type: "article",
    title: "If You Rush Your Decisions, Ask Yourself Why",
    author: "Harvard Business Review",
    summary: "Micro-protocol for slowing down when urgency kicks in (anti-impulsivity in decision-making).",
    duration: "5–10 min",
    cognitivePurpose: "Anti-impulsivity in decision-making",
    reflectionPrompt: "Why do I feel urgency in this decision?",
    primaryUrl: "https://hbr.org/tip/2017/09/if-you-rush-your-decisions-ask-yourself-why",
    difficulty: 1,
    thinkingSystem: "S2",
  },
  {
    id: "mit-intelligent-choices",
    type: "article",
    title: "Intelligent Choices Reshape Decision-Making",
    author: "MIT Sloan Management Review",
    summary: "Better decisions require better choices first (option quality), not just better processes.",
    duration: "15–20 min",
    cognitivePurpose: "Option quality before processes",
    reflectionPrompt: "Am I optimizing options or just the process?",
    primaryUrl: "https://mitsmr.com/4fjtHWT",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "mit-scenario-planning",
    type: "article",
    title: "Scenario Planning: A Tool for Strategic Thinking",
    author: "MIT Sloan Management Review",
    summary: "Disciplined method for thinking multiple futures without falling in love with one prediction.",
    duration: "20–25 min",
    cognitivePurpose: "Thinking multiple futures without confirmation bias",
    reflectionPrompt: "What scenarios am I ignoring?",
    primaryUrl: "https://mitsmr.com/1nJI6Qi",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "science-teaching-thinking",
    type: "article",
    title: "Teaching science students how to think",
    author: "Science",
    summary: "Why knowing is not enough: reasoning must be taught explicitly.",
    duration: "10–15 min",
    cognitivePurpose: "Explicitly teaching how to reason",
    reflectionPrompt: "What do I know vs how do I know it?",
    primaryUrl: "https://www.science.org/content/article/teaching-science-students-how-think-first-time",
    difficulty: 2,
    thinkingSystem: "S2",
  },
  {
    id: "nature-career-experiment",
    type: "article",
    title: "Before making a career move, try an experiment",
    author: "Nature Careers",
    summary: "Tiny experiments applied to choices: test hypotheses before committing to radical changes.",
    duration: "10–15 min",
    cognitivePurpose: "Test hypotheses before committing",
    reflectionPrompt: "What small experiment can I run first?",
    primaryUrl: "https://www.nature.com/articles/d41586-025-02437-6",
    difficulty: 2,
    thinkingSystem: "S1+S2",
  },
  {
    id: "nature-ai-peer-review",
    type: "article",
    title: "AI, peer review and the human activity of science",
    author: "Nature Careers",
    summary: "Defends human judgment as a critical skill: evaluating, triaging, prioritizing.",
    duration: "10–15 min",
    cognitivePurpose: "Human judgment as a critical skill",
    reflectionPrompt: "What can I not delegate to automatic thinking?",
    primaryUrl: "https://www.nature.com/articles/d41586-025-01839-w",
    difficulty: 3,
    thinkingSystem: "S2",
  },
];

interface LoggedExposure {
  id: string;          // prefixed ID (content-podcast-xyz)
  rawId: string;       // base ID (xyz)
  completedAt: Date | null;
  type: "podcast" | "book" | "article";
}

function useLoggedExposuresData(userId: string | undefined) {
  return useQuery({
    queryKey: ["logged-exposures", userId],
    queryFn: async (): Promise<LoggedExposure[]> => {
      if (!userId) return [];

      const toBaseId = (exerciseId: string): { baseId: string; type: "podcast" | "book" | "article" } | null => {
        const match = exerciseId.match(/^content-(podcast|book|article)-(.+)$/);
        if (!match) return null;
        return { type: match[1] as "podcast" | "book" | "article", baseId: match[2] };
      };
      
      // Fetch from new system WITH completed_at
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercise_completions")
        .select("exercise_id, completed_at")
        .eq("user_id", userId)
        .like("exercise_id", "content-%");
      
      if (exerciseError) throw exerciseError;
      
      const newSystemExposures: LoggedExposure[] = (exerciseData || []).map(row => {
        const parsed = toBaseId(row.exercise_id);
        return {
          id: row.exercise_id,
          rawId: parsed?.baseId || row.exercise_id,
          completedAt: row.completed_at ? new Date(row.completed_at) : null,
          type: parsed?.type || "article",
        };
      });

      // Fetch from legacy user_listened_podcasts
      const { data: legacyData, error: legacyError } = await supabase
        .from("user_listened_podcasts")
        .select("podcast_id, listened_at")
        .eq("user_id", userId);

      if (legacyError) throw legacyError;

      const legacyExposures: LoggedExposure[] = (legacyData || []).map(row => ({
        id: `content-podcast-${row.podcast_id}`,
        rawId: row.podcast_id,
        completedAt: row.listened_at ? new Date(row.listened_at) : null,
        type: "podcast" as const,
      }));

      // Deduplicate by prefixed ID (prefer new system which has accurate timestamps)
      const byId = new Map<string, LoggedExposure>();
      legacyExposures.forEach(e => byId.set(e.id, e));
      newSystemExposures.forEach(e => byId.set(e.id, e)); // Overwrites legacy if both exist
      
      return Array.from(byId.values());
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// Helper hook for backwards compatibility - returns string[] of IDs
function useLoggedExposures(userId: string | undefined) {
  const { data: exposures = [], isLoading, error } = useLoggedExposuresData(userId);
  
  // Extract all ID forms for filtering: prefixed + raw
  const loggedIds = useMemo(() => {
    const ids = new Set<string>();
    exposures.forEach(e => {
      ids.add(e.id);
      ids.add(e.rawId);
    });
    return Array.from(ids);
  }, [exposures]);
  
  return { data: loggedIds, isLoading, error, exposures };
}

// Difficulty indicator component - muted tones
function DifficultyIndicator({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" title={`Cognitive load: ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level 
              ? "bg-foreground/40"
              : "bg-muted/30"
          }`}
        />
      ))}
    </div>
  );
}

// Thinking System Icon component - muted elegant tones
function ThinkingSystemIcon({ system }: { system: ThinkingSystem }) {
  if (system === "S1") {
    return <Zap className="h-3.5 w-3.5 text-foreground/50" />;
  }
  if (system === "S2") {
    return <Timer className="h-3.5 w-3.5 text-foreground/50" />;
  }
  return (
    <div className="flex items-center -space-x-1">
      <Zap className="h-3 w-3 text-foreground/40" />
      <Timer className="h-3 w-3 text-foreground/40" />
    </div>
  );
}

// Prescription block for active items - muted version
function PrescriptionBlockDisplay({ prescription }: { prescription: PrescriptionBlock }) {
  return (
    <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/20 rounded-md px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3 w-3 text-muted-foreground/60" />
        <span>{prescription.whenToUse}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StopCircle className="h-3 w-3 text-muted-foreground/60" />
        <span>{prescription.stopRule}</span>
      </div>
    </div>
  );
}

// Reflection prompt after logging exposure
function ReflectionPrompt({ 
  onRespond, 
  onDismiss 
}: { 
  onRespond: (response: "yes" | "no" | "not_sure") => void;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-card/50 border border-border/30 rounded-md p-3 space-y-2 mt-2">
      <p className="text-xs text-foreground/80">
        Did this input change how you approached today's training?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRespond("yes")}
          className="px-3 py-1 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary/70 rounded-md transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => onRespond("no")}
          className="px-3 py-1 text-[10px] bg-muted/50 hover:bg-muted text-muted-foreground rounded-md transition-colors"
        >
          No
        </button>
        <button
          onClick={() => onRespond("not_sure")}
          className="px-3 py-1 text-[10px] bg-muted/50 hover:bg-muted text-muted-foreground rounded-md transition-colors"
        >
          Not sure
        </button>
        <button
          onClick={onDismiss}
          className="ml-auto text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// Prescription card (active item)
function PrescriptionCard({ 
  input, 
  isLogged, 
  onToggleLogged,
  isToggling,
  isLoggedIn
}: { 
  input: CognitiveInput; 
  isLogged: boolean;
  onToggleLogged: () => void;
  isToggling: boolean;
  isLoggedIn: boolean;
}) {
  const config = INPUT_TYPE_CONFIG[input.type];
  const thinkingConfig = THINKING_SYSTEM_CONFIG[input.thinkingSystem];
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleToggle = () => {
    if (!isLogged) {
      // Show confirmation dialog before marking as completed
      setShowConfirmDialog(true);
    } else {
      // If already logged, just toggle (remove from library)
      onToggleLogged();
    }
  };

  const handleConfirmComplete = () => {
    onToggleLogged();
    setShowConfirmDialog(false);
    toast({
      title: "Added to Library",
      description: `"${input.title}" moved to your library shelf.`,
    });
  };

  return (
    <>
      <div className={`border rounded-xl overflow-hidden transition-all ${
        isLogged 
          ? "border-border/40 bg-muted/10" 
          : "border-border/50 bg-card/50"
      }`}>
        {/* Header row - compact */}
        <div className="flex items-start gap-3 p-3">
          {/* Checkbox */}
          <button 
            onClick={handleToggle}
            disabled={isToggling || !isLoggedIn}
            className="shrink-0 disabled:opacity-50 group mt-1"
            aria-label={isLogged ? "Mark as incomplete" : "Mark as completed"}
            title={isLogged ? "Completed" : "Mark as completed"}
          >
            {isToggling ? (
              <div className="h-5 w-5 border-2 border-muted-foreground/30 border-t-foreground/50 rounded-full animate-spin" />
            ) : isLogged ? (
              <CheckCircle2 className="h-5 w-5 text-foreground/60" />
            ) : (
              <div className="h-5 w-5 border-2 border-muted-foreground/40 rounded-full group-hover:border-foreground/50 transition-colors flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-transparent group-hover:bg-foreground/30 transition-colors" />
              </div>
            )}
          </button>
          
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted/30">
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title line */}
            <p className={`text-sm font-medium leading-snug line-clamp-2 ${isLogged ? 'text-muted-foreground' : 'text-foreground'}`}>
              {input.title}
            </p>
            
            {/* Author */}
            {input.author && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{input.author}</p>
            )}
            
            {/* Badges row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {isLogged ? (
                <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-5 bg-muted/20 border-border/40 text-muted-foreground">
                  Completed
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-5 bg-primary/5 border-primary/20 text-primary/70">
                    Active
                  </Badge>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/30 text-foreground/60 font-medium">
                    +{calculateItemRawPoints(input)} XP
                  </span>
                </>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <ThinkingSystemIcon system={input.thinkingSystem} />
                <DifficultyIndicator level={input.difficulty} />
              </div>
            </div>
          </div>
          
          {/* Expand button */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        
        {/* Expanded details with prescription */}
        {expanded && (
          <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border/20 mt-0">
            {/* Meta row */}
            <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {input.duration}
              </span>
              <span className="flex items-center gap-1">
                <ThinkingSystemIcon system={input.thinkingSystem} />
                <span>{thinkingConfig.label}</span>
              </span>
            </div>
            
            {/* Summary */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {input.summary}
            </p>
            
            {/* Prescription block */}
            {input.prescription && (
              <PrescriptionBlockDisplay prescription={input.prescription} />
            )}

            {/* Reflection prompt */}
            <div className="flex items-start gap-2 bg-muted/15 rounded-md p-2">
              <Zap className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
              <span className="text-[11px] text-muted-foreground italic">
                "{input.reflectionPrompt}"
              </span>
            </div>

            {/* Platform links */}
            <div className="flex items-center gap-3 pt-1">
              {input.type === "podcast" ? (
                <>
                  <a
                    href={input.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in Spotify
                  </a>
                  {input.secondaryUrl && (
                    <a
                      href={input.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Apple Podcasts
                    </a>
                  )}
                </>
              ) : (
                <a
                  href={input.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Read
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Move "{input.title}" to your Library shelf? This will remove it from your active tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Add to Library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact swipeable alternative card (IG-style)
function SwipeableAlternativeCard({ 
  input, 
  isLogged, 
  onToggleLogged,
  isToggling,
  isLoggedIn,
  onSelect
}: { 
  input: CognitiveInput; 
  isLogged: boolean;
  onToggleLogged: () => void;
  isToggling: boolean;
  isLoggedIn: boolean;
  onSelect: () => void;
}) {
  const config = INPUT_TYPE_CONFIG[input.type];
  const thinkingConfig = THINKING_SYSTEM_CONFIG[input.thinkingSystem];
  const Icon = config.icon;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLogged) {
      setShowConfirmDialog(true);
    } else {
      onToggleLogged();
    }
  };

  const handleConfirmComplete = () => {
    onToggleLogged();
    setShowConfirmDialog(false);
    toast({
      title: "Added to Library",
      description: `"${input.title}" moved to your library shelf.`,
    });
  };

  return (
    <>
      <button
        onClick={onSelect}
        className={`flex-shrink-0 w-36 p-2.5 border border-border/20 bg-card/30 rounded-xl 
          transition-all hover:bg-card/50 hover:border-border/50 active:scale-95 text-left
          ${isLogged ? 'opacity-40' : 'opacity-80 hover:opacity-100'}`}
      >
        {/* Icon + log button */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/30">
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          </div>
          <div 
            onClick={handleToggleClick}
            className={`shrink-0 ${(!isLoggedIn || isToggling) ? 'opacity-50' : 'cursor-pointer'}`}
            role="button"
            aria-label={isLogged ? "Mark as incomplete" : "Mark as completed"}
          >
            {isToggling ? (
              <div className="h-3.5 w-3.5 border border-muted/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : isLogged ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-foreground/50" />
            ) : (
              <div className="h-3.5 w-3.5 border border-muted-foreground/30 rounded-full" />
            )}
          </div>
        </div>
        
        {/* Title - single line truncated */}
        <p className={`text-[11px] font-medium truncate mb-1 ${
          isLogged ? 'text-muted-foreground/50' : 'text-foreground/80'
        }`}>
          {input.title}
        </p>
        
        {/* Author - if available */}
        {input.author && (
          <p className="text-[9px] text-muted-foreground/50 truncate mb-1.5">
            {input.author}
          </p>
        )}
        
        {/* Meta + XP */}
        <div className="flex items-center justify-between">
          <div title={thinkingConfig.description} className="opacity-70">
            <ThinkingSystemIcon system={input.thinkingSystem} />
          </div>
          <span className="text-[8px] px-1 py-0.5 rounded bg-muted/30 text-foreground/60 font-medium">
            +{calculateItemRawPoints(input)}
          </span>
        </div>
      </button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Move "{input.title}" to your Library shelf? This will remove it from your active tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Add to Library
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PrescriptionSectionProps {
  type: InputType;
  title: string;
  compact?: boolean;
}

export function CognitiveTasksSection({ type, title, compact = false }: PrescriptionSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: loggedIds = [], isLoading } = useLoggedExposures(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>(ACTIVE_PRESCRIPTIONS[type]);
  
  // Target exceeded dialog state
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  const [pendingInputId, setPendingInputId] = useState<string | null>(null);
  
  // Weekly target check
  const { tasksComplete } = useCappedWeeklyProgress();
  
  // XP tracking hooks
  const recordContentCompletion = useRecordContentCompletion();
  const removeContentCompletion = useRemoveContentCompletion();
  const { recordMetricsSnapshot } = useRecordIntradayOnAction();

  const toggleMutation = useMutation({
    mutationFn: async ({ inputId, isCurrentlyLogged, xpEarned }: { inputId: string; isCurrentlyLogged: boolean; xpEarned: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      if (isCurrentlyLogged) {
        // Remove from logged podcasts
        const { error } = await supabase
          .from("user_listened_podcasts")
          .delete()
          .eq("user_id", user.id)
          .eq("podcast_id", inputId);
        if (error) throw error;
        
        // Remove XP record
        await removeContentCompletion.mutateAsync({ contentId: inputId, contentType: type });
      } else {
        // Add to logged podcasts
        const { error } = await supabase
          .from("user_listened_podcasts")
          .insert({ user_id: user.id, podcast_id: inputId });
        if (error) throw error;
        
        // Record XP earned
        await recordContentCompletion.mutateAsync({ contentId: inputId, contentType: type, xpEarned });
      }
      
      // Return action details for onSuccess
      return { inputId, wasLogged: isCurrentlyLogged };
    },
    onSuccess: (data) => {
      console.log("[CognitiveInputs] 🎯 onSuccess called:", data);
      // v2.0: Record intraday event AFTER mutation success and cache updates
      // Only record when adding (not removing)
      if (!data.wasLogged) {
        console.log("[CognitiveInputs] 📝 Recording intraday event for task...");
        // Small delay to ensure cache invalidations propagate
        setTimeout(() => {
          console.log("[CognitiveInputs] ⏰ Timeout fired, calling recordMetricsSnapshot");
          recordMetricsSnapshot('task', {
            contentType: type,
            contentId: data.inputId,
          });
        }, 200);
      } else {
        console.log("[CognitiveInputs] ⏭️ Skipping intraday event - wasLogged is true (removing)");
      }
    },
    onMutate: async ({ inputId, isCurrentlyLogged }) => {
      setTogglingId(inputId);
      await queryClient.cancelQueries({ queryKey: ["logged-exposures", user?.id] });
      const previousData = queryClient.getQueryData<string[]>(["logged-exposures", user?.id]);
      
      queryClient.setQueryData<string[]>(["logged-exposures", user?.id], (old = []) => {
        if (isCurrentlyLogged) {
          return old.filter(id => id !== inputId);
        } else {
          return [...old, inputId];
        }
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
    },
  });

  const handleToggle = (inputId: string) => {
    if (!user?.id) return;
    const isCurrentlyLogged = loggedIds.includes(inputId);
    
    // If trying to mark as complete (not unmark) and target is reached, show warning
    if (!isCurrentlyLogged && tasksComplete) {
      setPendingInputId(inputId);
      setShowTargetExceededDialog(true);
      return;
    }
    
    proceedWithToggle(inputId);
  };
  
  const proceedWithToggle = (inputId: string) => {
    setShowTargetExceededDialog(false);
    setPendingInputId(null);
    
    const isCurrentlyLogged = loggedIds.includes(inputId);
    const input = COGNITIVE_INPUTS.find(i => i.id === inputId);
    const xpEarned = input ? calculateItemRawPoints(input) : 8;
    toggleMutation.mutate({ inputId, isCurrentlyLogged, xpEarned });
  };
  
  const handleConfirmExcessTask = () => {
    if (pendingInputId) {
      proceedWithToggle(pendingInputId);
    }
  };

  // Filter out completed items - they only appear in Library
  const allInputs = COGNITIVE_INPUTS.filter(i => i.type === type && !loggedIds.includes(i.id));
  const activeInput = allInputs.find(i => i.id === activeId) || allInputs[0];
  const alternatives = allInputs.filter(i => i.id !== activeInput?.id);
  const config = INPUT_TYPE_CONFIG[type];
  const Icon = config.icon;
  const completedCount = COGNITIVE_INPUTS.filter(i => i.type === type && loggedIds.includes(i.id)).length;
  const totalCount = COGNITIVE_INPUTS.filter(i => i.type === type).length;

  const handleSelectAlternative = (newActiveId: string) => {
    setActiveId(newActiveId);
  };

  // Compact mode for horizontal grid layout
  if (compact) {
    // If all items are completed, show compact empty state
    if (allInputs.length === 0) {
      return (
        <div className="flex flex-col">
          {/* Compact Header */}
          <div className="flex flex-col items-center gap-1.5 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/30">
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <h4 className="text-xs font-medium text-center">{title}</h4>
            <p className="text-[9px] text-muted-foreground">All done ✓</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-3 rounded-xl border border-border/20 bg-muted/10">
            <CheckCircle2 className="h-5 w-5 text-violet-500/40" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {/* Compact Header */}
        <div className="flex flex-col items-center gap-1 mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            type === "podcast" ? "bg-violet-500/10" : 
            type === "book" ? "bg-amber-500/10" : 
            "bg-blue-500/10"
          }`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <h4 className="text-xs font-medium text-center">{title}</h4>
          <p className="text-[9px] text-muted-foreground">
            {completedCount}/{totalCount}
          </p>
        </div>

        {/* Vertical stack of items in this column */}
        <div className="flex flex-col gap-2">
          {allInputs.slice(0, 3).map((input) => {
            const isLogged = loggedIds.includes(input.id);
            const thinkingConfig = THINKING_SYSTEM_CONFIG[input.thinkingSystem];
            
            return (
              <button
                key={input.id}
                onClick={() => handleSelectAlternative(input.id)}
                className={`p-2.5 border border-border/20 bg-card/30 rounded-xl 
                  transition-all hover:bg-card/50 hover:border-primary/30 active:scale-[0.98] text-left
                  ${input.id === activeInput?.id ? 'ring-1 ring-primary/40 bg-primary/5' : ''}`}
              >
                {/* Title + complete button */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <p className="text-[10px] font-medium line-clamp-2 leading-tight text-foreground/90">
                    {input.title}
                  </p>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(input.id);
                    }}
                    className={`shrink-0 ${(!user || togglingId === input.id) ? 'opacity-50' : 'cursor-pointer'}`}
                    role="button"
                    aria-label="Mark as completed"
                  >
                    {togglingId === input.id ? (
                      <div className="h-3.5 w-3.5 border border-muted/30 border-t-muted-foreground rounded-full animate-spin" />
                    ) : isLogged ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/50" />
                    ) : (
                      <div className="h-3.5 w-3.5 border border-muted-foreground/30 rounded-full hover:border-primary/50 transition-colors" />
                    )}
                  </div>
                </div>
                
                {/* Author */}
                {input.author && (
                  <p className="text-[8px] text-muted-foreground/60 truncate mb-1.5">
                    {input.author}
                  </p>
                )}
                
                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div title={thinkingConfig.description}>
                      <ThinkingSystemIcon system={input.thinkingSystem} />
                    </div>
                    <DifficultyIndicator level={input.difficulty} />
                  </div>
                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                    +{calculateItemRawPoints(input)}
                  </span>
                </div>
              </button>
            );
          })}
          
          {/* Show more indicator */}
          {allInputs.length > 3 && (
            <p className="text-[8px] text-muted-foreground/50 text-center">
              +{allInputs.length - 3} more
            </p>
          )}
        </div>
        
        {/* Target Exceeded Warning Dialog */}
        <AlertDialog open={showTargetExceededDialog} onOpenChange={setShowTargetExceededDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary/60" />
                </div>
                <AlertDialogTitle className="text-base">
                  Tasks {WEEKLY_GOAL_MESSAGES.targetExceededWarning.title}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                {WEEKLY_GOAL_MESSAGES.targetExceededWarning.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="text-sm">
                {WEEKLY_GOAL_MESSAGES.targetExceededWarning.cancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmExcessTask}
                className="text-sm bg-muted hover:bg-muted/80 text-foreground"
              >
                {WEEKLY_GOAL_MESSAGES.targetExceededWarning.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Original full-width layout (non-compact)
  // If all items are completed, show empty state
  if (allInputs.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30">
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <h4 className="text-sm font-medium">{title}</h4>
              <p className="text-[10px] text-muted-foreground">
                All {completedCount} completed ✓
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border/20 bg-muted/20 text-center">
          <CheckCircle2 className="h-6 w-6 text-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">All items moved to Library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30">
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-[10px] text-muted-foreground">
              {isLoading ? "..." : `${allInputs.length} remaining`}
              {completedCount > 0 && <span className="text-foreground/50 ml-1">({completedCount} in library)</span>}
            </p>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/50">
          {alternatives.length} alternatives
        </div>
      </div>

      {/* Active prescription */}
      {activeInput && (
        <PrescriptionCard 
          input={activeInput}
          isLogged={loggedIds.includes(activeInput.id)}
          onToggleLogged={() => handleToggle(activeInput.id)}
          isToggling={togglingId === activeInput.id}
          isLoggedIn={!!user}
        />
      )}

      {/* Alternatives - horizontal swipe carousel */}
      {alternatives.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground/40">
            Tap to switch
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide"
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {alternatives.map((input) => (
              <SwipeableAlternativeCard 
                key={input.id} 
                input={input} 
                isLogged={loggedIds.includes(input.id)}
                onToggleLogged={() => handleToggle(input.id)}
                isToggling={togglingId === input.id}
                isLoggedIn={!!user}
                onSelect={() => handleSelectAlternative(input.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Target Exceeded Warning Dialog */}
      <AlertDialog open={showTargetExceededDialog} onOpenChange={setShowTargetExceededDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <AlertDialogTitle className="text-base">
                Tasks {WEEKLY_GOAL_MESSAGES.targetExceededWarning.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {WEEKLY_GOAL_MESSAGES.targetExceededWarning.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-sm">
              {WEEKLY_GOAL_MESSAGES.targetExceededWarning.cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcessTask}
              className="text-sm bg-muted hover:bg-muted/80 text-foreground"
            >
              {WEEKLY_GOAL_MESSAGES.targetExceededWarning.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Legend component
export function CognitiveTasksLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <Info className="h-3 w-3" />
          Legend
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold">Thinking Systems</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-xs font-medium">Fast Thinking (S1)</p>
                <p className="text-[10px] text-muted-foreground">Intuition, pattern recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-teal-400" />
              <div>
                <p className="text-xs font-medium">Slow Thinking (S2)</p>
                <p className="text-[10px] text-muted-foreground">Analysis, argumentation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <Brain className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-medium">Dual Process (S1+S2)</p>
                <p className="text-[10px] text-muted-foreground">Both systems activated</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/30 pt-3">
            <h4 className="text-xs font-semibold mb-2">Cognitive Load</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500/70" />)}
                  {[3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted/30" />)}
                </div>
                <span className="text-[10px] text-muted-foreground">Light (1-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />)}
                  {[4, 5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted/30" />)}
                </div>
                <span className="text-[10px] text-muted-foreground">Moderate (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-500/70" />)}
                </div>
                <span className="text-[10px] text-muted-foreground">Dense (4-5)</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Main export - now a prescription-based cognitive conditioning module
export function CognitiveInputs() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Training Prescriptions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            This week: 3 prescribed inputs
          </p>
        </div>
        <CognitiveTasksLegend />
      </div>

      <CognitiveTasksSection 
        type="podcast" 
        title="Podcast"
      />
      
      <CognitiveTasksSection 
        type="book" 
        title="Book"
      />
      
      <CognitiveTasksSection 
        type="article" 
        title="Reading"
      />

      <p className="text-[10px] text-muted-foreground/40 text-center pt-2">
        {user ? "Exposure logs synced" : "Login to log exposures"}
      </p>
    </div>
  );
}

// Calculate raw points for a completed item based on type and difficulty
// Aligned with XP_VALUES from trainingPlans: podcast=8, reading=10, book=12
function calculateItemRawPoints(item: CognitiveInput): number {
  // Base XP by content type (matches XP_VALUES)
  const baseByType: Record<InputType, number> = {
    podcast: 8,
    article: 10,
    book: 12,
  };
  
  // Small difficulty bonus: +1 for each level above 1
  const difficultyBonus = Math.max(0, item.difficulty - 1);
  
  return baseByType[item.type] + difficultyBonus;
}

// Calculate max possible points for an item (book difficulty 5 = 12 + 4 = 16)
const MAX_ITEM_POINTS = 16;

// Get total max points for all available items
function getTotalMaxPoints(): { total: number; s1Max: number; s2Max: number } {
  let total = 0;
  let s1Max = 0;
  let s2Max = 0;
  
  COGNITIVE_INPUTS.forEach(item => {
    const maxPoints = calculateItemRawPoints(item);
    total += maxPoints;
    
    if (item.thinkingSystem === "S1") {
      s1Max += maxPoints;
    } else if (item.thinkingSystem === "S2") {
      s2Max += maxPoints;
    } else {
      // S1+S2 contributes to both
      s1Max += Math.floor(maxPoints / 2);
      s2Max += Math.floor(maxPoints / 2);
    }
  });
  
  return { total, s1Max, s2Max };
}

// Calculate normalized stats (0-100 scale) from completed items
function calculateLibraryStats(items: CognitiveInput[]) {
  let rawTotal = 0;
  let rawS1 = 0;
  let rawS2 = 0;
  let s1Items = 0;
  let s2Items = 0;
  let dualItems = 0;

  items.forEach(item => {
    const points = calculateItemRawPoints(item);
    rawTotal += points;

    if (item.thinkingSystem === "S1") {
      rawS1 += points;
      s1Items++;
    } else if (item.thinkingSystem === "S2") {
      rawS2 += points;
      s2Items++;
    } else {
      // S1+S2 contributes to both
      rawS1 += Math.floor(points / 2);
      rawS2 += Math.floor(points / 2);
      dualItems++;
    }
  });

  const maxPoints = getTotalMaxPoints();
  
  // Normalize to 0-100 scale
  const totalScore = maxPoints.total > 0 ? Math.round((rawTotal / maxPoints.total) * 100) : 0;
  const s1Score = maxPoints.s1Max > 0 ? Math.round((rawS1 / maxPoints.s1Max) * 100) : 0;
  const s2Score = maxPoints.s2Max > 0 ? Math.round((rawS2 / maxPoints.s2Max) * 100) : 0;

  // Progress percentage (items completed)
  const totalItems = COGNITIVE_INPUTS.length;
  const completedCount = items.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return { 
    totalScore, 
    s1Score, 
    s2Score, 
    s1Items, 
    s2Items, 
    dualItems, 
    completedCount,
    totalItems,
    progressPercent,
    rawTotal,
    rawS1,
    rawS2
  };
}

// Get normalized score for a single item (0-100 based on difficulty)
function getItemNormalizedScore(item: CognitiveInput): number {
  const raw = calculateItemRawPoints(item);
  return Math.round((raw / MAX_ITEM_POINTS) * 100);
}

// Animated counter hook for smooth number transitions
function useAnimatedCounter(target: number, duration: number = 1000): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  
  useEffect(() => {
    if (target === prevTarget.current) return;
    
    const startValue = prevTarget.current;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;
      
      setValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);
  
  return value;
}

// Library component - shows all completed items
export function CognitiveLibrary() {
  const { user } = useAuth();
  const { data: completedIds = [], isLoading, exposures = [] } = useLoggedExposures(user?.id);
  
  // All hooks MUST be called before any early returns
  const removeCompletion = useRemoveContentCompletion();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<CognitiveInput | null>(null);

  // Merge legacy catalog (COGNITIVE_INPUTS) with the newer Tasks catalogs (PODCASTS/READINGS)
  // DB stores IDs like "content-podcast-hidden-brain", so we map with that prefix.
  const libraryCatalog: CognitiveInput[] = useMemo(() => {
    const fromPodcasts: CognitiveInput[] = PODCASTS.map(p => ({
      id: `content-podcast-${p.id}`,
      type: "podcast",
      title: p.title,
      author: "",
      summary: p.intent,
      duration: "",
      cognitivePurpose: "",
      reflectionPrompt: "",
      primaryUrl: getSpotifyShowUrl(p.spotifyShowId),
      secondaryUrl: getApplePodcastUrl(p.applePodcastId),
      difficulty: p.demand === "LOW" ? 1 : p.demand === "MEDIUM" ? 2 : p.demand === "HIGH" ? 3 : 4,
      thinkingSystem: "S2",
    }));

    const fromReadings: CognitiveInput[] = READINGS.map(r => ({
      id: `content-${r.readingType === "BOOK" ? "book" : "article"}-${r.id}`,
      type: r.readingType === "BOOK" ? "book" : "article",
      title: r.title,
      author: r.author,
      summary: r.description,
      duration: `${r.durationMinutes} min`,
      cognitivePurpose: "",
      reflectionPrompt: "",
      primaryUrl: r.url || `https://www.google.com/search?q=${encodeURIComponent(r.title)}`,
      secondaryUrl: undefined,
      difficulty: r.demand === "LOW" ? 1 : r.demand === "MEDIUM" ? 2 : r.demand === "HIGH" ? 3 : 4,
      thinkingSystem: r.readingType === "RECOVERY_SAFE" ? "S1" : "S2",
    }));

    // Deduplicate by id (prefer existing COGNITIVE_INPUTS when there is overlap)
    const byId = new Map<string, CognitiveInput>();
    [...fromPodcasts, ...fromReadings].forEach(item => byId.set(item.id, item));
    COGNITIVE_INPUTS.forEach(item => byId.set(item.id, item));
    return Array.from(byId.values());
  }, []);

  const completedItems = libraryCatalog.filter(input => completedIds.includes(input.id));
  
  const podcastsCompleted = completedItems.filter(i => i.type === "podcast");
  const booksCompleted = completedItems.filter(i => i.type === "book");
  const articlesCompleted = completedItems.filter(i => i.type === "article");

  // RQ contribution weights per type
  const RQ_WEIGHTS = { podcast: 2.4, article: 3, book: 4 };

  // Calculate RQ: Active (last 7 days) vs Historical (total)
  const { activeRQ, historicalRQ } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let activeTotal = 0;
    let historicalTotal = 0;
    
    exposures.forEach(exp => {
      const weight = RQ_WEIGHTS[exp.type] || 0;
      historicalTotal += weight;
      
      if (exp.completedAt && exp.completedAt >= sevenDaysAgo) {
        activeTotal += weight;
      }
    });
    
    return {
      activeRQ: Math.round(activeTotal * 10) / 10,
      historicalRQ: Math.round(historicalTotal * 10) / 10,
    };
  }, [exposures]);

  // Animated counters for RQ display
  const animatedActiveRQ = useAnimatedCounter(activeRQ, 800);
  const animatedHistoricalRQ = useAnimatedCounter(historicalRQ, 800);

  const stats = calculateLibraryStats(completedItems);

  // Early returns AFTER all hooks
  if (!user) {
    return (
      <div className="text-center py-12">
        <Library className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Login to see your library</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="h-6 w-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading library...</p>
      </div>
    );
  }

  if (completedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Library className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">Your library is empty</p>
        <p className="text-xs text-muted-foreground/60">Mark content as completed to add it here</p>
      </div>
    );
  }

  const handleRemoveConfirm = async () => {
    if (!itemToRemove) return;

    // Support BOTH id formats:
    // - new: "content-podcast-very-bad-wizards" (preferred)
    // - legacy: "very-bad-wizards" (raw)
    let contentType: "podcast" | "book" | "article";
    let baseId: string;

    if (itemToRemove.id.startsWith("content-")) {
      // Extract base ID from prefixed ID: content-podcast-hidden-brain → hidden-brain
      const match = itemToRemove.id.match(/^content-(podcast|book|article)-(.+)$/);
      if (!match) {
        throw new Error(`Invalid content id: ${itemToRemove.id}`);
      }
      contentType = match[1] as "podcast" | "book" | "article";
      baseId = match[2];
    } else {
      // Legacy raw IDs
      contentType = itemToRemove.type;
      baseId = itemToRemove.id;
    }
    
    setRemovingId(itemToRemove.id);
    setItemToRemove(null);
    
    try {
      await removeCompletion.mutateAsync({ contentId: baseId, contentType });
      toast({
        title: "Removed from Library",
        description: `${itemToRemove.title} is back in your task list.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveRequest = (item: CognitiveInput) => {
    setItemToRemove(item);
  };

  return (
    <div className="space-y-6">
      {/* Library Description */}
      <p className="text-xs text-muted-foreground text-center">
        Your completed cognitive inputs: podcasts listened, books and articles read.
      </p>

      {/* RQ Contribution - Active (7d) + Historical */}
      <div className="space-y-2">
        {/* Active RQ - prominently displayed */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div>
            <span className="text-xs font-medium text-primary">Active RQ (last 7 days)</span>
            <p className="text-[10px] text-muted-foreground">Contributing to your current score</p>
          </div>
          <span className="text-lg font-bold text-primary tabular-nums">
            +{animatedActiveRQ.toFixed(1)}
          </span>
        </div>
        
        {/* Historical RQ - subdued */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2">
            <Library className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Total library value</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {animatedHistoricalRQ.toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-area-slow/5 border border-area-slow/20 text-center">
          <Headphones className="h-4 w-4 text-area-slow mx-auto mb-1" />
          <p className="text-lg font-semibold">{podcastsCompleted.length}</p>
          <p className="text-[10px] text-muted-foreground">Podcasts</p>
        </div>
        <div className="p-3 rounded-xl bg-area-fast/5 border border-area-fast/20 text-center">
          <BookOpen className="h-4 w-4 text-area-fast mx-auto mb-1" />
          <p className="text-lg font-semibold">{booksCompleted.length}</p>
          <p className="text-[10px] text-muted-foreground">Books</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <FileText className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-semibold">{articlesCompleted.length}</p>
          <p className="text-[10px] text-muted-foreground">Articles</p>
        </div>
      </div>

      {/* Podcasts Section */}
      {podcastsCompleted.length > 0 && (
        <LibrarySection 
          title="Podcasts" 
          icon={Headphones}
          items={podcastsCompleted}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
          onRemove={handleRemoveRequest}
          removingId={removingId}
        />
      )}

      {/* Books Section */}
      {booksCompleted.length > 0 && (
        <LibrarySection 
          title="Books" 
          icon={BookOpen}
          items={booksCompleted}
          iconColor="text-amber-500"
          bgColor="bg-amber-500/10"
          onRemove={handleRemoveRequest}
          removingId={removingId}
        />
      )}

      {/* Articles Section */}
      {articlesCompleted.length > 0 && (
        <LibrarySection 
          title="Articles" 
          icon={FileText}
          items={articlesCompleted}
          iconColor="text-blue-500"
          bgColor="bg-blue-500/10"
          onRemove={handleRemoveRequest}
          removingId={removingId}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
            <AlertDialogDescription>
              "{itemToRemove?.title}" will be moved back to your task list. You can complete it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Library section component
function LibrarySection({ 
  title, 
  icon: Icon, 
  items,
  iconColor,
  bgColor,
  onRemove,
  removingId,
}: { 
  title: string; 
  icon: React.ElementType;
  items: CognitiveInput[];
  iconColor: string;
  bgColor: string;
  onRemove: (item: CognitiveInput) => void;
  removingId: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <h4 className="text-sm font-medium">{title}</h4>
        <span className="text-[10px] text-muted-foreground">({items.length})</span>
      </div>

      <div className="space-y-2">
        {items.map(item => {
          const isRemoving = removingId === item.id;
          return (
            <div
              key={item.id}
              className="block p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <a
                    href={item.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </a>
                  {item.author && (
                    <p className="text-[10px] text-muted-foreground/60">{item.author}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground/50">
                      Difficulty: {item.difficulty}/5
                    </span>
                    <ThinkingSystemIcon system={item.thinkingSystem} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={item.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </a>
                  <button
                    onClick={() => onRemove(item)}
                    disabled={isRemoving}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground/40 hover:text-destructive disabled:opacity-50"
                    title="Remove from Library"
                  >
                    {isRemoving ? (
                      <div className="h-3.5 w-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <StopCircle className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
