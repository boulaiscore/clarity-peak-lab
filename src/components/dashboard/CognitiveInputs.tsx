import { useState, useEffect } from "react";
import { Headphones, Clock, Target, MapPin, Zap, ExternalLink, CheckCircle2, Circle, Loader2, BookOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type InputType = "podcast" | "book" | "article";

interface CognitiveInput {
  id: string;
  type: InputType;
  title: string;
  author?: string;
  duration: string;
  cognitivePurpose: string;
  usageContext: string;
  reflectionPrompt: string;
  primaryUrl: string;
  secondaryUrl?: string;
}

const INPUT_TYPE_CONFIG: Record<InputType, { label: string; icon: typeof Headphones; color: string }> = {
  podcast: { label: "Podcast", icon: Headphones, color: "text-primary/70" },
  book: { label: "Book", icon: BookOpen, color: "text-amber-500/70" },
  article: { label: "Article", icon: FileText, color: "text-blue-500/70" },
};

const COGNITIVE_INPUTS: CognitiveInput[] = [
  // PODCASTS
  {
    id: "in-our-time",
    type: "podcast",
    title: "In Our Time",
    duration: "35–55 min",
    cognitivePurpose: "Concettualizzazione rapida, distinzione tra tesi e prove, contesto storico/filosofico",
    usageContext: "Commute / walk a bassa arousal",
    reflectionPrompt: "Qual è la tesi principale? Che evidenze la sorreggono e cosa la falsificherebbe?",
    primaryUrl: "https://open.spotify.com/show/17YfG23eMbfLBaDPqucgzZ",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/in-our-time/id73330895",
  },
  {
    id: "partially-examined-life",
    type: "podcast",
    title: "The Partially Examined Life",
    duration: "60–120 min",
    cognitivePurpose: "Seguire argomentazioni complesse senza scorciatoie; allenare slow thinking",
    usageContext: "Sera / long focus block",
    reflectionPrompt: "Riesco a ricostruire l'argomento in 5 frasi? Dove sono le premesse implicite?",
    primaryUrl: "https://open.spotify.com/show/1APpUKebKOXJZjoCaCfoVk",
    secondaryUrl: "https://podcasts.apple.com/it/podcast/the-partially-examined-life-philosophy-podcast/id318345767",
  },
  {
    id: "very-bad-wizards",
    type: "podcast",
    title: "Very Bad Wizards",
    duration: "45–90 min",
    cognitivePurpose: "Dilemmi morali + psicologia; tenere insieme intuizioni e rigore",
    usageContext: "Commute lungo / palestra post-allenamento",
    reflectionPrompt: "Quale principio morale stanno usando? Esiste un controesempio che lo rompe?",
    primaryUrl: "https://open.spotify.com/show/4gGFerFYkDHnezTlwExEbu",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/very-bad-wizards/id557975157",
  },
  {
    id: "mindscape",
    type: "podcast",
    title: "Sean Carroll's Mindscape",
    duration: "60–120 min",
    cognitivePurpose: "Profondità + sintesi cross-disciplinare; ragionare su modelli del mondo",
    usageContext: "Weekend / deep work block",
    reflectionPrompt: "Quali assunzioni reggono la visione dell'ospite? Cosa cambierebbe se fossero false?",
    primaryUrl: "https://open.spotify.com/show/622lvLwp8CVu6dvCsYAJhN",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/sean-carrolls-mindscape-science-society-philosophy/id1406534739",
  },
  {
    id: "philosophy-bites",
    type: "podcast",
    title: "Philosophy Bites",
    duration: "15–25 min",
    cognitivePurpose: "Concetti ad alta densità in poco tempo; allenare definizioni e distinzioni",
    usageContext: "Coffee / micro-moment",
    reflectionPrompt: "Definisci il concetto con parole tue e genera 1 esempio + 1 controesempio.",
    primaryUrl: "https://open.spotify.com/show/6UmBytzR58EY4hN1jzQG2o",
    secondaryUrl: "https://podcasts.apple.com/gb/podcast/philosophy-bites/id257042117",
  },
  {
    id: "econtalk",
    type: "podcast",
    title: "EconTalk",
    duration: "50–90 min",
    cognitivePurpose: "Causalità, incentivi, trade-off; ragionare su sistemi complessi",
    usageContext: "Commute / camminata",
    reflectionPrompt: "Qual è il meccanismo causale proposto? Quale variabile confondente manca?",
    primaryUrl: "https://open.spotify.com/show/4M5Gb71lskQ0Rg6e08uQhi",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/econtalk/id135066958",
  },
  {
    id: "conversations-with-tyler",
    type: "podcast",
    title: "Conversations with Tyler",
    duration: "45–90 min",
    cognitivePurpose: "Esplorazione ampia + connessioni inattese; allenare sintesi e domande migliori",
    usageContext: "Commute lungo / sessione focus leggero",
    reflectionPrompt: "Qual è l'idea più non ovvia? Che implicazione pratica ha?",
    primaryUrl: "https://open.spotify.com/show/0Z1234tGXD2hVhjFrrhJ7g",
    secondaryUrl: "https://podcasts.apple.com/us/podcast/conversations-with-tyler/id983795625",
  },
  // BOOKS
  {
    id: "apology-plato",
    type: "book",
    title: "Apology",
    author: "Plato",
    duration: "1–2 ore",
    cognitivePurpose: "Argomentazione sotto pressione; difesa razionale contro intuizioni sociali",
    usageContext: "Sera / long focus",
    reflectionPrompt: "Quale premessa è più vulnerabile? Come la rafforzeresti?",
    primaryUrl: "https://www.gutenberg.org/ebooks/1656",
  },
  {
    id: "meditations-aurelius",
    type: "book",
    title: "Meditations",
    author: "Marcus Aurelius",
    duration: "10–15 min/sessione",
    cognitivePurpose: "Controllo delle inferenze; igiene del giudizio",
    usageContext: "Morning routine / wind-down",
    reflectionPrompt: "Quale giudizio sto aggiungendo io ai fatti?",
    primaryUrl: "https://www.gutenberg.org/ebooks/2680",
  },
  {
    id: "tao-te-ching",
    type: "book",
    title: "Tao Te Ching",
    author: "Laozi",
    duration: "5–10 min",
    cognitivePurpose: "Tolleranza dell'ambiguità; pensiero non lineare",
    usageContext: "Low-arousal moments",
    reflectionPrompt: "Che interpretazione opposta è ugualmente plausibile?",
    primaryUrl: "https://www.gutenberg.org/ebooks/216",
  },
  {
    id: "notes-from-underground",
    type: "book",
    title: "Notes from Underground",
    author: "F. Dostoevsky",
    duration: "2–3 ore",
    cognitivePurpose: "Distinguere ragione da razionalizzazione",
    usageContext: "Sera",
    reflectionPrompt: "Dove l'argomento diventa auto-giustificazione?",
    primaryUrl: "https://www.gutenberg.org/ebooks/600",
  },
  {
    id: "death-of-ivan-ilyich",
    type: "book",
    title: "The Death of Ivan Ilyich",
    author: "Leo Tolstoy",
    duration: "2 ore",
    cognitivePurpose: "Smontare narrazioni di status; verità scomode",
    usageContext: "Evening reading",
    reflectionPrompt: "Quali segnali ignoriamo perché socialmente costosi?",
    primaryUrl: "https://www.gutenberg.org/ebooks/284",
  },
  {
    id: "the-stranger",
    type: "book",
    title: "The Stranger",
    author: "Albert Camus",
    duration: "3–4 ore",
    cognitivePurpose: "Etica senza spiegazioni; interpretazione profonda",
    usageContext: "Weekend",
    reflectionPrompt: "Il giudizio morale nasce dai fatti o dal contesto?",
    primaryUrl: "https://archive.org/details/stranger00camu",
  },
  {
    id: "little-prince",
    type: "book",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    duration: "1–2 ore",
    cognitivePurpose: "Lettura a più livelli; simboli e meta-significato",
    usageContext: "Pausa / sera",
    reflectionPrompt: "Qual è il messaggio implicito che emerge solo a distanza?",
    primaryUrl: "https://archive.org/details/littleprince0000sain",
  },
  // ARTICLES
  {
    id: "politics-english-language",
    type: "article",
    title: "Politics and the English Language",
    author: "George Orwell",
    duration: "20–30 min",
    cognitivePurpose: "Pulizia del linguaggio → chiarezza del pensiero",
    usageContext: "Focused reading",
    reflectionPrompt: "Quali parole mascherano l'argomento?",
    primaryUrl: "https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/",
  },
  {
    id: "what-is-it-like-to-be-a-bat",
    type: "article",
    title: "What Is It Like to Be a Bat?",
    author: "Thomas Nagel",
    duration: "20–30 min",
    cognitivePurpose: "Limiti della prospettiva; spiegare vs comprendere",
    usageContext: "Deep focus",
    reflectionPrompt: "Cosa resta inaccessibile per principio?",
    primaryUrl: "https://warwick.ac.uk/fac/soc/philosophy/people/martin_bayley/what_is_it_like_to_be_a_bat.pdf",
  },
  {
    id: "hedgehog-and-fox",
    type: "article",
    title: "The Hedgehog and the Fox",
    author: "Isaiah Berlin",
    duration: "45–60 min",
    cognitivePurpose: "Pluralismo dei modelli; evitare monocausalità",
    usageContext: "Weekend reading",
    reflectionPrompt: "Sto forzando un modello unico?",
    primaryUrl: "https://archive.org/details/hedgehogfox00berl",
  },
  {
    id: "in-praise-of-idleness",
    type: "article",
    title: "In Praise of Idleness",
    author: "Bertrand Russell",
    duration: "20–30 min",
    cognitivePurpose: "Argomentare contro norme sociali implicite",
    usageContext: "Evening / reflection",
    reflectionPrompt: "Quale assunzione culturale regge l'argomento?",
    primaryUrl: "https://harpers.org/archive/1932/10/in-praise-of-idleness/",
  },
  {
    id: "of-cannibals",
    type: "article",
    title: "Of Cannibals",
    author: "Michel de Montaigne",
    duration: "15–25 min",
    cognitivePurpose: "Sospensione del giudizio; relativismo rigoroso",
    usageContext: "Quiet moment",
    reflectionPrompt: "Quale criterio sto assumendo come universale?",
    primaryUrl: "https://www.gutenberg.org/ebooks/3600",
  },
  {
    id: "on-liberty-chapter-2",
    type: "article",
    title: "On Liberty, Chapter II",
    author: "John Stuart Mill",
    duration: "30–40 min",
    cognitivePurpose: "Steelmanning; valore delle idee avverse",
    usageContext: "Focused reading",
    reflectionPrompt: "So difendere la tesi opposta meglio del suo autore?",
    primaryUrl: "https://www.gutenberg.org/ebooks/34901",
  },
  {
    id: "ones-who-walk-away-from-omelas",
    type: "article",
    title: "The Ones Who Walk Away from Omelas",
    author: "Ursula K. Le Guin",
    duration: "10–15 min",
    cognitivePurpose: "Dilemmi morali non risolvibili",
    usageContext: "Evening / reflection",
    reflectionPrompt: "Quale costo sono disposto ad accettare?",
    primaryUrl: "https://shsdavisapes.pbworks.com/f/Omelas.pdf",
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

function InputCard({ 
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
  const Icon = config.icon;

  return (
    <div className={`border border-border/40 bg-card/30 p-4 space-y-3 transition-all ${isListened ? 'opacity-60' : ''}`}>
      {/* Header: Toggle + Type + Duration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleListened}
            disabled={isToggling || !isLoggedIn}
            className="flex items-center gap-2 group disabled:opacity-50"
            aria-label={isListened ? "Mark as not completed" : "Mark as completed"}
            title={!isLoggedIn ? "Login to track progress" : undefined}
          >
            {isToggling ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : isListened ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary/70 transition-colors" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {config.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{input.duration}</span>
        </div>
      </div>

      {/* Title + Author */}
      <div>
        <h4 className={`text-sm font-medium leading-tight ${isListened ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {input.title}
        </h4>
        {input.author && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{input.author}</p>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Target className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{input.cognitivePurpose}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{input.usageContext}</span>
        </div>
        <div className="flex items-start gap-2">
          <Zap className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
          <span className="text-amber-600/80 dark:text-amber-400/80 italic text-[11px]">
            "{input.reflectionPrompt}"
          </span>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/30">
        <a
          href={input.primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-xs hover:underline ${
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
            className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Apple Podcasts
          </a>
        )}
      </div>
    </div>
  );
}

export function CognitiveInputs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: listenedIds = [], isLoading } = useListenedPodcasts(user?.id);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InputType | "all">("all");

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

  const filteredInputs = filter === "all" 
    ? COGNITIVE_INPUTS 
    : COGNITIVE_INPUTS.filter(i => i.type === filter);

  const listenedCount = listenedIds.length;
  const counts = {
    all: COGNITIVE_INPUTS.length,
    podcast: COGNITIVE_INPUTS.filter(i => i.type === "podcast").length,
    book: COGNITIVE_INPUTS.filter(i => i.type === "book").length,
    article: COGNITIVE_INPUTS.filter(i => i.type === "article").length,
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Cognitive Inputs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prescribed content for cognitive development
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          {isLoading ? "..." : `${listenedCount}/${COGNITIVE_INPUTS.length}`} Done
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        {(["all", "podcast", "book", "article"] as const).map((type) => {
          const isActive = filter === type;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              <span className="ml-1 opacity-50">({counts[type]})</span>
            </button>
          );
        })}
      </div>

      {/* Input Cards */}
      <div className="grid gap-3">
        {filteredInputs.map((input) => (
          <InputCard 
            key={input.id} 
            input={input} 
            isListened={listenedIds.includes(input.id)}
            onToggleListened={() => handleToggle(input.id)}
            isToggling={togglingId === input.id}
            isLoggedIn={!!user}
          />
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide text-center pt-2">
        {user ? "Tap circle to mark complete • Max 1–2 per week" : "Login to track your progress"}
      </p>
    </section>
  );
}
