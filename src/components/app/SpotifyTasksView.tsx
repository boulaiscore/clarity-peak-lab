/**
 * Spotify-Style Tasks View
 * 
 * Horizontal scrollable sections for cognitive content:
 * - Suggested For You (based on cognitive state)
 * - Podcasts
 * - Books
 * - Articles
 * 
 * Spotify-inspired design: horizontal carousels, large cards, minimal UI
 */

import { useState } from "react";
import { motion } from "framer-motion";
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
  BookMarked
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
import { usePodcastPermissioning, PodcastEligibility } from "@/hooks/usePodcastPermissioning";
import { useReadingPermissioning, ReadingEligibility } from "@/hooks/useReadingPermissioning";
import { CognitiveLibrary } from "@/components/dashboard/CognitiveInputs";
import { 
  getApplePodcastUrl, 
  getSpotifySearchUrl, 
  PodcastDemand 
} from "@/data/podcasts";
import { ReadingType, ReadingDemand, getReadingTypeCopy } from "@/data/readings";
import { cn } from "@/lib/utils";

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

// Podcast Card - Spotify Album Style
function PodcastCard({ 
  podcast, 
  index,
  onClick 
}: { 
  podcast: PodcastEligibility;
  index: number;
  onClick: () => void;
}) {
  const gradient = getGradient(index, "podcast");
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group flex-shrink-0 w-[140px] text-left"
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
        
        {/* Demand badge */}
        <div className="absolute top-2 left-2">
          <DemandPill demand={podcast.podcast.demand} />
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

// Reading Card - Spotify Album Style (for Books and Articles)
function ReadingCard({ 
  reading, 
  index,
  type,
  onClick 
}: { 
  reading: ReadingEligibility;
  index: number;
  type: "book" | "article";
  onClick: () => void;
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
      className="group flex-shrink-0 w-[140px] text-left"
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
        
        {/* Type and Demand badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="text-[8px] font-medium px-2 py-0.5 rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
            {copy.categoryLabel}
          </span>
          <DemandPill demand={reading.reading.demand} />
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

// Suggested For You Hero Card
function SuggestedHeroCard({ 
  item,
  type,
  onClick 
}: { 
  item: PodcastEligibility | ReadingEligibility;
  type: "podcast" | "book" | "article";
  onClick: () => void;
}) {
  const isPodcast = type === "podcast";
  const title = isPodcast 
    ? (item as PodcastEligibility).podcast.title 
    : (item as ReadingEligibility).reading.title;
  const subtitle = isPodcast
    ? (item as PodcastEligibility).podcast.intent
    : (item as ReadingEligibility).reading.description;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 hover:border-primary/40 transition-all active:scale-[0.99] text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-primary uppercase tracking-wide mb-0.5">
            Suggested for you
          </p>
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}

// Details Dialog for Podcasts
function PodcastDetailsDialog({
  podcast,
  open,
  onClose,
}: {
  podcast: PodcastEligibility | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!podcast) return null;
  
  const appleUrl = getApplePodcastUrl(podcast.podcast.applePodcastId);
  const spotifyUrl = getSpotifySearchUrl(podcast.podcast.spotifyQuery);
  
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
        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={appleUrl} target="_blank" rel="noopener noreferrer">
              Apple Podcasts
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
              Spotify
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Details Dialog for Readings
function ReadingDetailsDialog({
  reading,
  open,
  onClose,
}: {
  reading: ReadingEligibility | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!reading) return null;
  
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {reading.reading.author && <span>{reading.reading.author}</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {reading.reading.durationMinutes} min
            </span>
          </div>
          
          {reading.reading.url && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href={reading.reading.url} target="_blank" rel="noopener noreferrer">
                Open Reading
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function SpotifyTasksView() {
  const [viewMode, setViewMode] = useState<"browse" | "library">("browse");
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastEligibility | null>(null);
  const [selectedReading, setSelectedReading] = useState<ReadingEligibility | null>(null);
  
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
  
  // Combine all enabled content for "Suggested" section
  const allSuggested: Array<{ type: "podcast" | "book" | "article"; item: PodcastEligibility | ReadingEligibility }> = [
    ...enabledPodcasts.map(p => ({ type: "podcast" as const, item: p as PodcastEligibility | ReadingEligibility })),
    ...enabledReadings.map(r => ({ 
      type: (r.reading.readingType === "BOOK" ? "book" : "article") as "podcast" | "book" | "article", 
      item: r as PodcastEligibility | ReadingEligibility 
    })),
  ];
  
  // Filter books and articles
  const books = [...enabledReadings, ...withheldReadings].filter(
    r => r.reading.readingType === "BOOK"
  );
  const articles = [...enabledReadings, ...withheldReadings].filter(
    r => r.reading.readingType === "NON_FICTION" || r.reading.readingType === "RECOVERY_SAFE"
  );
  const allPodcasts = [...enabledPodcasts, ...withheldPodcasts];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-4">
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
          
          {/* Suggested For You - Hero */}
          {allSuggested.length > 0 && (
            <section>
              <SuggestedHeroCard
                item={allSuggested[0].item}
                type={allSuggested[0].type}
                onClick={() => {
                  if (allSuggested[0].type === "podcast") {
                    setSelectedPodcast(allSuggested[0].item as PodcastEligibility);
                  } else {
                    setSelectedReading(allSuggested[0].item as ReadingEligibility);
                  }
                }}
              />
            </section>
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
      />
      <ReadingDetailsDialog
        reading={selectedReading}
        open={!!selectedReading}
        onClose={() => setSelectedReading(null)}
      />
    </div>
  );
}
