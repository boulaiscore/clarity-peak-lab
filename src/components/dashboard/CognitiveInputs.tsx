import { useState } from "react";
import { Headphones, Clock, Target, Zap, ExternalLink, CheckCircle2, Circle, Loader2, BookOpen, FileText, ChevronDown, ChevronUp, Brain, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type InputType = "podcast" | "book" | "article";
type ThinkingSystem = "S1" | "S2" | "S1+S2";

interface CognitiveInput {
  id: string;
  type: InputType;
  title: string;
  author?: string;
  duration: string;
  cognitivePurpose: string;
  reflectionPrompt: string;
  primaryUrl: string;
  secondaryUrl?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  thinkingSystem: ThinkingSystem;
}

const INPUT_TYPE_CONFIG: Record<InputType, { label: string; icon: typeof Headphones; color: string }> = {
  podcast: { label: "Podcast", icon: Headphones, color: "text-primary/70" },
  book: { label: "Book", icon: BookOpen, color: "text-amber-500/70" },
  article: { label: "Article", icon: FileText, color: "text-blue-500/70" },
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

const COGNITIVE_INPUTS: CognitiveInput[] = [
  // PODCASTS
  {
    id: "in-our-time",
    type: "podcast",
    title: "In Our Time",
    duration: "35–55 min",
    cognitivePurpose: "Concettualizzazione rapida, distinzione tra tesi e prove",
    reflectionPrompt: "Qual è la tesi principale? Che evidenze la sorreggono?",
    primaryUrl: "https://open.spotify.com/show/17YfG23eMbfLBaDPqucgzZ",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/in-our-time/id73330895",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "partially-examined-life",
    type: "podcast",
    title: "The Partially Examined Life",
    duration: "60–120 min",
    cognitivePurpose: "Argomentazioni complesse; allenare slow thinking",
    reflectionPrompt: "Riesco a ricostruire l'argomento in 5 frasi?",
    primaryUrl: "https://open.spotify.com/show/1APpUKebKOXJZjoCaCfoVk",
    secondaryUrl: "https://podcasts.apple.com/it/podcast/the-partially-examined-life-philosophy-podcast/id318345767",
    difficulty: 5,
    thinkingSystem: "S2",
  },
  {
    id: "very-bad-wizards",
    type: "podcast",
    title: "Very Bad Wizards",
    duration: "45–90 min",
    cognitivePurpose: "Dilemmi morali + psicologia",
    reflectionPrompt: "Quale principio morale stanno usando?",
    primaryUrl: "https://open.spotify.com/show/4gGFerFYkDHnezTlwExEbu",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/very-bad-wizards/id557975157",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "mindscape",
    type: "podcast",
    title: "Sean Carroll's Mindscape",
    duration: "60–120 min",
    cognitivePurpose: "Sintesi cross-disciplinare; modelli del mondo",
    reflectionPrompt: "Quali assunzioni reggono la visione dell'ospite?",
    primaryUrl: "https://open.spotify.com/show/622lvLwp8CVu6dvCsYAJhN",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/sean-carrolls-mindscape-science-society-philosophy/id1406534739",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "philosophy-bites",
    type: "podcast",
    title: "Philosophy Bites",
    duration: "15–25 min",
    cognitivePurpose: "Concetti ad alta densità; definizioni e distinzioni",
    reflectionPrompt: "Definisci il concetto e genera 1 controesempio.",
    primaryUrl: "https://open.spotify.com/show/6UmBytzR58EY4hN1jzQG2o",
    secondaryUrl: "https://podcasts.apple.com/gb/podcast/philosophy-bites/id257042117",
    difficulty: 2,
    thinkingSystem: "S2",
  },
  {
    id: "econtalk",
    type: "podcast",
    title: "EconTalk",
    duration: "50–90 min",
    cognitivePurpose: "Causalità, incentivi, sistemi complessi",
    reflectionPrompt: "Qual è il meccanismo causale proposto?",
    primaryUrl: "https://open.spotify.com/show/4M5Gb71lskQ0Rg6e08uQhi",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/econtalk/id135066958",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "conversations-with-tyler",
    type: "podcast",
    title: "Conversations with Tyler",
    duration: "45–90 min",
    cognitivePurpose: "Connessioni inattese; sintesi e domande",
    reflectionPrompt: "Qual è l'idea più non ovvia?",
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
    duration: "1–2 ore",
    cognitivePurpose: "Argomentazione sotto pressione",
    reflectionPrompt: "Quale premessa è più vulnerabile?",
    primaryUrl: "https://www.gutenberg.org/ebooks/1656",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "meditations-aurelius",
    type: "book",
    title: "Meditations",
    author: "Marcus Aurelius",
    duration: "10–15 min/sessione",
    cognitivePurpose: "Controllo delle inferenze; igiene del giudizio",
    reflectionPrompt: "Quale giudizio sto aggiungendo io ai fatti?",
    primaryUrl: "https://www.gutenberg.org/ebooks/2680",
    difficulty: 2,
    thinkingSystem: "S2",
  },
  {
    id: "tao-te-ching",
    type: "book",
    title: "Tao Te Ching",
    author: "Laozi",
    duration: "5–10 min",
    cognitivePurpose: "Tolleranza dell'ambiguità; pensiero non lineare",
    reflectionPrompt: "Che interpretazione opposta è ugualmente plausibile?",
    primaryUrl: "https://www.gutenberg.org/ebooks/216",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "notes-from-underground",
    type: "book",
    title: "Notes from Underground",
    author: "F. Dostoevsky",
    duration: "2–3 ore",
    cognitivePurpose: "Distinguere ragione da razionalizzazione",
    reflectionPrompt: "Dove l'argomento diventa auto-giustificazione?",
    primaryUrl: "https://www.gutenberg.org/ebooks/600",
    difficulty: 4,
    thinkingSystem: "S1+S2",
  },
  {
    id: "death-of-ivan-ilyich",
    type: "book",
    title: "The Death of Ivan Ilyich",
    author: "Leo Tolstoy",
    duration: "2 ore",
    cognitivePurpose: "Smontare narrazioni di status",
    reflectionPrompt: "Quali segnali ignoriamo perché socialmente costosi?",
    primaryUrl: "https://www.gutenberg.org/ebooks/284",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "the-stranger",
    type: "book",
    title: "The Stranger",
    author: "Albert Camus",
    duration: "3–4 ore",
    cognitivePurpose: "Etica senza spiegazioni",
    reflectionPrompt: "Il giudizio morale nasce dai fatti o dal contesto?",
    primaryUrl: "https://archive.org/details/stranger00camu",
    difficulty: 3,
    thinkingSystem: "S1+S2",
  },
  {
    id: "little-prince",
    type: "book",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    duration: "1–2 ore",
    cognitivePurpose: "Lettura a più livelli; simboli",
    reflectionPrompt: "Qual è il messaggio implicito?",
    primaryUrl: "https://archive.org/details/littleprince0000sain",
    difficulty: 2,
    thinkingSystem: "S1+S2",
  },
  // ARTICLES
  {
    id: "politics-english-language",
    type: "article",
    title: "Politics and the English Language",
    author: "George Orwell",
    duration: "20–30 min",
    cognitivePurpose: "Pulizia del linguaggio → chiarezza del pensiero",
    reflectionPrompt: "Quali parole mascherano l'argomento?",
    primaryUrl: "https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "what-is-it-like-to-be-a-bat",
    type: "article",
    title: "What Is It Like to Be a Bat?",
    author: "Thomas Nagel",
    duration: "20–30 min",
    cognitivePurpose: "Limiti della prospettiva",
    reflectionPrompt: "Cosa resta inaccessibile per principio?",
    primaryUrl: "https://warwick.ac.uk/fac/soc/philosophy/people/martin_bayley/what_is_it_like_to_be_a_bat.pdf",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "hedgehog-and-fox",
    type: "article",
    title: "The Hedgehog and the Fox",
    author: "Isaiah Berlin",
    duration: "45–60 min",
    cognitivePurpose: "Pluralismo dei modelli",
    reflectionPrompt: "Sto forzando un modello unico?",
    primaryUrl: "https://archive.org/details/hedgehogfox00berl",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "in-praise-of-idleness",
    type: "article",
    title: "In Praise of Idleness",
    author: "Bertrand Russell",
    duration: "20–30 min",
    cognitivePurpose: "Argomentare contro norme sociali implicite",
    reflectionPrompt: "Quale assunzione culturale regge l'argomento?",
    primaryUrl: "https://harpers.org/archive/1932/10/in-praise-of-idleness/",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "of-cannibals",
    type: "article",
    title: "Of Cannibals",
    author: "Michel de Montaigne",
    duration: "15–25 min",
    cognitivePurpose: "Sospensione del giudizio",
    reflectionPrompt: "Quale criterio sto assumendo come universale?",
    primaryUrl: "https://www.gutenberg.org/ebooks/3600",
    difficulty: 3,
    thinkingSystem: "S2",
  },
  {
    id: "on-liberty-chapter-2",
    type: "article",
    title: "On Liberty, Chapter II",
    author: "John Stuart Mill",
    duration: "30–40 min",
    cognitivePurpose: "Steelmanning; valore delle idee avverse",
    reflectionPrompt: "So difendere la tesi opposta meglio del suo autore?",
    primaryUrl: "https://www.gutenberg.org/ebooks/34901",
    difficulty: 4,
    thinkingSystem: "S2",
  },
  {
    id: "ones-who-walk-away-from-omelas",
    type: "article",
    title: "The Ones Who Walk Away from Omelas",
    author: "Ursula K. Le Guin",
    duration: "10–15 min",
    cognitivePurpose: "Dilemmi morali non risolvibili",
    reflectionPrompt: "Quale costo sono disposto ad accettare?",
    primaryUrl: "https://shsdavisapes.pbworks.com/f/Omelas.pdf",
    difficulty: 2,
    thinkingSystem: "S1+S2",
  },
];

function useListenedPodcasts(userId: string | undefined) {
  return useQuery({
    queryKey: ["listened-podcasts", userId],
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
    <div className="flex items-center gap-0.5" title={`Difficulty: ${level}/5`}>
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
  // S1+S2
  return (
    <div className="flex items-center -space-x-1">
      <Zap className="h-3 w-3 text-amber-400" />
      <Brain className="h-3 w-3 text-teal-400" />
    </div>
  );
}

// Compact task card for the weekly view
function TaskCard({ 
  input, 
  isListened, 
  onToggleListened,
  isToggling,
  isLoggedIn
}: { 
  input: CognitiveInput; 
  isListened: boolean;
  onToggleListened: () => void;
  isToggling: boolean;
  isLoggedIn: boolean;
}) {
  const config = INPUT_TYPE_CONFIG[input.type];
  const thinkingConfig = THINKING_SYSTEM_CONFIG[input.thinkingSystem];
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border border-border/30 bg-card/30 rounded-lg overflow-hidden transition-all ${isListened ? 'opacity-50' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        <button 
          onClick={onToggleListened}
          disabled={isToggling || !isLoggedIn}
          className="shrink-0 disabled:opacity-50"
          aria-label={isListened ? "Mark as not completed" : "Mark as completed"}
        >
          {isToggling ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : isListened ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary/70 transition-colors" />
          )}
        </button>
        
        <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isListened ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {input.title}
          </div>
          {input.author && (
            <div className="text-[10px] text-muted-foreground/60 truncate">{input.author}</div>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Thinking System Icon */}
          <div title={thinkingConfig.description}>
            <ThinkingSystemIcon system={input.thinkingSystem} />
          </div>
          {/* Difficulty */}
          <DifficultyIndicator level={input.difficulty} />
          {/* Expand button */}
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
      
      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/20 mt-0">
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
          
          <div className="flex items-start gap-2">
            <Target className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground">{input.cognitivePurpose}</span>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 italic">
              "{input.reflectionPrompt}"
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={input.primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 text-xs hover:underline ${
                input.type === "podcast" 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : input.type === "book"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              <ExternalLink className="h-3 w-3" />
              {input.type === "podcast" ? "Spotify" : "Read"}
            </a>
            {input.secondaryUrl && (
              <a
                href={input.secondaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Apple
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CognitiveTasksSectionProps {
  type: InputType;
  title: string;
  subtitle: string;
}

export function CognitiveTasksSection({ type, title, subtitle }: CognitiveTasksSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: listenedIds = [], isLoading } = useListenedPodcasts(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: async ({ podcastId, isCurrentlyListened }: { podcastId: string; isCurrentlyListened: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      if (isCurrentlyListened) {
        const { error } = await supabase
          .from("user_listened_podcasts")
          .delete()
          .eq("user_id", user.id)
          .eq("podcast_id", podcastId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_listened_podcasts")
          .insert({ user_id: user.id, podcast_id: podcastId });
        if (error) throw error;
      }
    },
    onMutate: async ({ podcastId, isCurrentlyListened }) => {
      setTogglingId(podcastId);
      await queryClient.cancelQueries({ queryKey: ["listened-podcasts", user?.id] });
      const previousData = queryClient.getQueryData<string[]>(["listened-podcasts", user?.id]);
      
      queryClient.setQueryData<string[]>(["listened-podcasts", user?.id], (old = []) => {
        if (isCurrentlyListened) {
          return old.filter(id => id !== podcastId);
        } else {
          return [...old, podcastId];
        }
      });
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["listened-podcasts", user?.id], context.previousData);
      }
    },
    onSettled: () => {
      setTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ["listened-podcasts", user?.id] });
    },
  });

  const handleToggle = (podcastId: string) => {
    if (!user?.id) return;
    const isCurrentlyListened = listenedIds.includes(podcastId);
    toggleMutation.mutate({ podcastId, isCurrentlyListened });
  };

  const inputs = COGNITIVE_INPUTS.filter(i => i.type === type);
  const completedCount = inputs.filter(i => listenedIds.includes(i.id)).length;
  const config = INPUT_TYPE_CONFIG[type];
  const Icon = config.icon;

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
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-medium">
          {isLoading ? "..." : `${completedCount}/${inputs.length}`}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {inputs.map((input) => (
          <TaskCard 
            key={input.id} 
            input={input} 
            isListened={listenedIds.includes(input.id)}
            onToggleListened={() => handleToggle(input.id)}
            isToggling={togglingId === input.id}
            isLoggedIn={!!user}
          />
        ))}
      </div>
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

// Legacy export for backward compatibility
export function CognitiveInputs() {
  const { user } = useAuth();
  const { data: listenedIds = [], isLoading } = useListenedPodcasts(user?.id);
  
  const totalCount = COGNITIVE_INPUTS.length;
  const completedCount = listenedIds.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Cognitive Tasks
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Max 1–2 per week for deep processing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CognitiveTasksLegend />
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            {isLoading ? "..." : `${completedCount}/${totalCount}`}
          </div>
        </div>
      </div>

      <CognitiveTasksSection 
        type="podcast" 
        title="Podcasts" 
        subtitle="Audio-first cognitive training"
      />
      
      <CognitiveTasksSection 
        type="book" 
        title="Books" 
        subtitle="Deep reading for critical reasoning"
      />
      
      <CognitiveTasksSection 
        type="article" 
        title="Articles & Essays" 
        subtitle="Focused thinking exercises"
      />

      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide text-center pt-2">
        {user ? "Progress synced across devices" : "Login to track progress"}
      </p>
    </div>
  );
}
