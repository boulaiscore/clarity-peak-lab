import { useState } from "react";
import { 
  Headphones, Clock, Target, ExternalLink, 
  BookOpen, FileText, ChevronDown, ChevronUp, Brain, Info, 
  Zap, CheckCircle2, Timer, StopCircle, Calendar, Library
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
  podcast: { label: "Podcast", icon: Headphones, color: "text-primary/70" },
  book: { label: "Book", icon: BookOpen, color: "text-amber-500/70" },
  article: { label: "Reading", icon: FileText, color: "text-blue-500/70" },
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

// Difficulty indicator component
function DifficultyIndicator({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" title={`Cognitive load: ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level 
              ? level >= 4 
                ? "bg-red-500/70" 
                : level >= 3 
                ? "bg-amber-500/70" 
                : "bg-green-500/70"
              : "bg-muted/30"
          }`}
        />
      ))}
    </div>
  );
}

// Thinking System Icon component
function ThinkingSystemIcon({ system }: { system: ThinkingSystem }) {
  if (system === "S1") {
    return <Zap className="h-3.5 w-3.5 text-amber-400" />;
  }
  if (system === "S2") {
    return <Brain className="h-3.5 w-3.5 text-teal-400" />;
  }
  return (
    <div className="flex items-center -space-x-1">
      <Zap className="h-3 w-3 text-amber-400" />
      <Brain className="h-3 w-3 text-teal-400" />
    </div>
  );
}

// Prescription block for active items - compact version
function PrescriptionBlockDisplay({ prescription }: { prescription: PrescriptionBlock }) {
  return (
    <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-primary/5 rounded-md px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3 w-3 text-primary/60" />
        <span>{prescription.whenToUse}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StopCircle className="h-3 w-3 text-primary/60" />
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
          className="px-3 py-1 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
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
  const [expanded, setExpanded] = useState(true); // Active items default to expanded
  const [showReflection, setShowReflection] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const handleToggle = () => {
    const wasNotLogged = !isLogged;
    onToggleLogged();
    if (wasNotLogged) {
      setJustLogged(true);
      setShowReflection(true);
    }
  };

  const handleReflectionResponse = (response: "yes" | "no" | "not_sure") => {
    // Store response for future personalization (could be expanded)
    console.log("Reflection response:", response);
    setShowReflection(false);
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isLogged 
        ? "border-primary/30 bg-primary/5" 
        : "border-primary/40 bg-gradient-to-r from-primary/5 to-transparent"
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        <button 
          onClick={handleToggle}
          disabled={isToggling || !isLoggedIn}
          className="shrink-0 disabled:opacity-50 group"
          aria-label={isLogged ? "Mark as incomplete" : "Mark as completed"}
          title={isLogged ? "Completed" : "Mark as completed"}
        >
          {isToggling ? (
            <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : isLogged ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <div className="h-5 w-5 border-2 border-primary/50 rounded-full group-hover:border-primary transition-colors flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary/0 group-hover:bg-primary/50 transition-colors" />
            </div>
          )}
        </button>
        
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          input.type === "podcast" ? "bg-primary/20" : 
          input.type === "book" ? "bg-amber-500/20" : 
          "bg-blue-500/20"
        }`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isLogged ? 'text-muted-foreground' : 'text-foreground'}`}>
              {input.title}
            </span>
            {isLogged ? (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400">
                Completed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 border-primary/30 text-primary">
                Active
              </Badge>
            )}
          </div>
          {input.author && (
            <div className="text-[10px] text-muted-foreground/60">{input.author}</div>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <div title={thinkingConfig.description}>
            <ThinkingSystemIcon system={input.thinkingSystem} />
          </div>
          <DifficultyIndicator level={input.difficulty} />
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-muted/50 rounded transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
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
          <div className="flex items-start gap-2 bg-muted/20 rounded-md p-2">
            <Zap className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 italic">
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
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in Spotify
                </a>
                {input.secondaryUrl && (
                  <a
                    href={input.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
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
                className={`flex items-center gap-1.5 text-xs hover:underline ${
                  input.type === "book"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                <ExternalLink className="h-3 w-3" />
                Read
              </a>
            )}
          </div>

          {/* Reflection prompt after logging */}
          {showReflection && justLogged && (
            <ReflectionPrompt 
              onRespond={handleReflectionResponse}
              onDismiss={() => setShowReflection(false)}
            />
          )}
        </div>
      )}
    </div>
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

  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 w-36 p-2.5 border border-border/20 bg-card/30 rounded-xl 
        transition-all hover:bg-card/50 hover:border-primary/40 active:scale-95 text-left
        ${isLogged ? 'opacity-40' : 'opacity-80 hover:opacity-100'}`}
    >
      {/* Icon + log button */}
      <div className="flex items-center justify-between mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          input.type === "podcast" ? "bg-primary/15" : 
          input.type === "book" ? "bg-amber-500/15" : 
          "bg-blue-500/15"
        }`}>
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleLogged();
          }}
          className={`shrink-0 ${(!isLoggedIn || isToggling) ? 'opacity-50' : 'cursor-pointer'}`}
          role="button"
          aria-label={isLogged ? "Mark as incomplete" : "Mark as completed"}
        >
          {isToggling ? (
            <div className="h-3.5 w-3.5 border border-muted/30 border-t-muted-foreground rounded-full animate-spin" />
          ) : isLogged ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
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
      
      {/* Meta */}
      <div className="flex items-center justify-between">
        <div title={thinkingConfig.description} className="opacity-70">
          <ThinkingSystemIcon system={input.thinkingSystem} />
        </div>
        <DifficultyIndicator level={input.difficulty} />
      </div>
    </button>
  );
}

interface PrescriptionSectionProps {
  type: InputType;
  title: string;
}

export function CognitiveTasksSection({ type, title }: PrescriptionSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: loggedIds = [], isLoading } = useLoggedExposures(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>(ACTIVE_PRESCRIPTIONS[type]);

  const toggleMutation = useMutation({
    mutationFn: async ({ inputId, isCurrentlyLogged }: { inputId: string; isCurrentlyLogged: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      if (isCurrentlyLogged) {
        const { error } = await supabase
          .from("user_listened_podcasts")
          .delete()
          .eq("user_id", user.id)
          .eq("podcast_id", inputId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_listened_podcasts")
          .insert({ user_id: user.id, podcast_id: inputId });
        if (error) throw error;
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
    toggleMutation.mutate({ inputId, isCurrentlyLogged });
  };

  const allInputs = COGNITIVE_INPUTS.filter(i => i.type === type);
  const activeInput = allInputs.find(i => i.id === activeId);
  const alternatives = allInputs.filter(i => i.id !== activeId);
  const config = INPUT_TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleSelectAlternative = (newActiveId: string) => {
    setActiveId(newActiveId);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            type === "podcast" ? "bg-primary/10" : 
            type === "book" ? "bg-amber-500/10" : 
            "bg-blue-500/10"
          }`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-[10px] text-muted-foreground">
              {isLoading ? "..." : "1 Active prescription"}
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

// Library component - shows all completed items
export function CognitiveLibrary() {
  const { user } = useAuth();
  const { data: completedIds = [], isLoading } = useLoggedExposures(user?.id);

  const completedItems = COGNITIVE_INPUTS.filter(input => completedIds.includes(input.id));
  
  const podcastsCompleted = completedItems.filter(i => i.type === "podcast");
  const booksCompleted = completedItems.filter(i => i.type === "book");
  const articlesCompleted = completedItems.filter(i => i.type === "article");

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
        <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
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

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <Headphones className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-semibold">{podcastsCompleted.length}</p>
          <p className="text-[10px] text-muted-foreground">Podcasts</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
          <BookOpen className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-semibold">{booksCompleted.length}</p>
          <p className="text-[10px] text-muted-foreground">Books</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
          <FileText className="h-4 w-4 text-blue-500 mx-auto mb-1" />
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
          iconColor="text-primary"
          bgColor="bg-primary/10"
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
        />
      )}
    </div>
  );
}

// Library section component
function LibrarySection({ 
  title, 
  icon: Icon, 
  items,
  iconColor,
  bgColor
}: { 
  title: string; 
  icon: React.ElementType;
  items: CognitiveInput[];
  iconColor: string;
  bgColor: string;
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
        {items.map(item => (
          <a
            key={item.id}
            href={item.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.author && (
                  <p className="text-[10px] text-muted-foreground/60">{item.author}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ThinkingSystemIcon system={item.thinkingSystem} />
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
