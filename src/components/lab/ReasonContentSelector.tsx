/**
 * Reason Content Selector
 * 
 * Two-path selection:
 * (A) LOOMA curated list - podcasts/books/readings with predefined weights
 * (B) Custom item - title + author + difficulty/focus sliders
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Headphones, 
  ChevronRight,
  ExternalLink,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  NewReasonSession, 
  SessionType,
  useStartReasonSession,
  calculateCustomWeight,
  LOOMA_ITEM_WEIGHTS
} from "@/hooks/useReasonSessions";
import { usePodcastPermissioning } from "@/hooks/usePodcastPermissioning";
import { useReadingPermissioning } from "@/hooks/useReadingPermissioning";
import { CONTENT_LIBRARY, ContentItem } from "@/lib/contentLibrary";
import { SpotifyEmbed } from "@/components/ui/SpotifyEmbed";
import { toast } from "sonner";

interface ReasonContentSelectorProps {
  open: boolean;
  onClose: () => void;
  onSessionStarted: () => void;
  initialSessionType?: SessionType;
}

type SelectionMode = "choose" | "looma" | "custom" | "preview";

export function ReasonContentSelector({ 
  open, 
  onClose, 
  onSessionStarted,
  initialSessionType = "reading"
}: ReasonContentSelectorProps) {
  const [mode, setMode] = useState<SelectionMode>("choose");
  const [sessionType, setSessionType] = useState<SessionType>(initialSessionType);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  
  // Custom item state
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [focus, setFocus] = useState(3);
  
  const startSession = useStartReasonSession();
  
  // Reset state when dialog closes
  const handleClose = () => {
    setMode("choose");
    setPreviewItem(null);
    setCustomTitle("");
    setCustomAuthor("");
    setDifficulty(3);
    setFocus(3);
    setSessionType(initialSessionType);
    onClose();
  };
  
  // Filter library based on session type
  const filteredLibrary = CONTENT_LIBRARY.filter(item => {
    if (initialSessionType === "listening") {
      return item.format === "podcast";
    } else {
      // reading - show books and readings, not podcasts
      return item.format === "book" || item.format === "reading";
    }
  });
  
  // Start session with LOOMA content
  const handleStartLoomaSession = async (item: ContentItem) => {
    try {
      // Determine session type based on content format
      const type: SessionType = item.format === "podcast" ? "listening" : "reading";
      const weight = LOOMA_ITEM_WEIGHTS[item.format] || 1.0;
      
      await startSession.mutateAsync({
        session_type: type,
        source: "looma_list",
        item_id: item.id,
        weight,
      });
      
      toast.success("Session started!", {
        description: `${item.title} — Weight: ${weight.toFixed(1)}×`,
      });
      
      handleClose();
      onSessionStarted();
    } catch (error) {
      toast.error("Failed to start session");
    }
  };
  
  // Start custom session
  const handleStartCustomSession = async () => {
    if (!customTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    const weight = calculateCustomWeight(difficulty, focus);
    
    try {
      await startSession.mutateAsync({
        session_type: sessionType,
        source: "custom",
        custom_title: customTitle.trim(),
        custom_author: customAuthor.trim() || undefined,
        weight,
      });
      
      toast.success("Session started!", {
        description: `${customTitle} — Weight: ${weight.toFixed(1)}×`,
      });
      
      handleClose();
      onSessionStarted();
    } catch (error) {
      toast.error("Failed to start session");
    }
  };
  
  const customWeight = calculateCustomWeight(difficulty, focus);
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="flex max-h-[88dvh] w-[calc(100%_-_20px)] max-w-sm flex-col gap-0 overflow-hidden rounded-[24px] border-white/[0.08] bg-[#0b0d10] p-0 shadow-[0_30px_100px_rgba(0,0,0,0.72)]">
        <DialogHeader className="border-b border-white/[0.06] px-5 pb-4 pt-5 pr-11 text-left">
          <DialogTitle className="text-[17px]">
            {mode === "choose" && (initialSessionType === "listening" ? "Start Listening" : "Start Reading")}
            {mode === "looma" && "LOOMA Library"}
            {mode === "custom" && "Custom Content"}
            {mode === "preview" && previewItem?.title}
          </DialogTitle>
          <DialogDescription className="text-[11px] leading-relaxed text-muted-foreground/65">
            {mode === "choose" && (initialSessionType === "listening" 
              ? "Choose a podcast to track your listening time."
              : "Choose content to track your reading time.")}
            {mode === "looma" && (initialSessionType === "listening"
              ? "Select from curated podcasts with optimized weights."
              : "Select from curated books and readings with optimized weights.")}
            {mode === "custom" && (initialSessionType === "listening"
              ? "Track your own podcast or audiobook."
              : "Track your own book, article, or paper.")}
            {mode === "preview" && "Preview this podcast, then start your session."}
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {/* Mode selection */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2 p-5"
            >
              <button
                onClick={() => setMode("looma")}
                className="group flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.022] p-4 text-left transition-colors hover:border-white/[0.13] hover:bg-white/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-violet-300/20 bg-violet-400/[0.06] text-[9px] font-semibold tracking-[0.12em] text-violet-200/75">01</span>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold text-foreground/95">Curated by LOOMA</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {initialSessionType === "listening" ? "Podcasts selected for focused listening" : "Books and articles selected for depth"}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45 transition-colors group-hover:text-foreground" />
              </button>
              
              <button
                onClick={() => setMode("custom")}
                className="group flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.022] p-4 text-left transition-colors hover:border-white/[0.13] hover:bg-white/[0.04]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.09] bg-white/[0.025] text-[9px] font-semibold tracking-[0.12em] text-white/60">02</span>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold text-foreground/95">Your own content</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    Add a podcast, audiobook or reading
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45 transition-colors group-hover:text-foreground" />
              </button>
            </motion.div>
          )}
          
          {/* LOOMA Library */}
          {mode === "looma" && (
            <motion.div
              key="looma"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-0 flex-1 p-5"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode("choose")}
                className="mb-3 -ml-3 h-7 px-3 text-[10px]"
              >
                ← Back
              </Button>
              
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-3">
                  {filteredLibrary.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No {initialSessionType === "listening" ? "podcasts" : "books or readings"} available yet.
                    </p>
                  ) : (
                    filteredLibrary.map((item) => (
                      <div
                        key={item.id}
                        className="w-full rounded-[14px] border border-white/[0.065] bg-white/[0.018] p-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
                      >
                        {/* Top row: icon + title */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border text-[8px] font-semibold tracking-[0.1em]",
                            item.format === "podcast" && "border-violet-300/20 bg-violet-400/[0.06] text-violet-200/75",
                            item.format === "reading" && "border-white/[0.08] bg-white/[0.025] text-white/55",
                            item.format === "book" && "border-amber-300/20 bg-amber-400/[0.06] text-amber-200/75",
                          )}>
                            {item.format === "podcast" ? "POD" : item.format === "book" ? "BOOK" : "READ"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground/90">{item.title}</p>
                            {item.author && <p className="mt-1 truncate text-[9px] text-muted-foreground/55">{item.author}</p>}
                          </div>
                        </div>
                        
                        {/* Bottom row: metadata + actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/55">
                            <span className="capitalize">{item.format}</span>
                            <span>•</span>
                            <span>{item.durationMinutes} min</span>
                            <span>•</span>
                            <span className={cn("font-semibold", item.format === "podcast" ? "text-violet-200/75" : "text-amber-200/75")}>
                              {LOOMA_ITEM_WEIGHTS[item.format]?.toFixed(1) || "1.0"}×
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Preview button for podcasts with Spotify embed */}
                            {item.format === "podcast" && item.spotifyShowId && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewItem(item);
                                  setMode("preview");
                                }}
                                className="h-7 px-2 text-[9px] font-medium"
                                title="Preview podcast"
                              >
                                <Play className="w-3.5 h-3.5 mr-1" />
                                Preview
                              </Button>
                            )}
                            {/* External link for non-podcast or no Spotify ID */}
                            {(item.format !== "podcast" || !item.spotifyShowId) && item.url && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.url, "_blank", "noopener,noreferrer");
                                }}
                                className="h-7 px-2 text-[9px] font-medium"
                                title="Open content"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                Open
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="premium"
                              onClick={() => handleStartLoomaSession(item)}
                              disabled={startSession.isPending}
                              className="h-7 px-3 text-[9px] font-semibold"
                            >
                              Start
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
          
          {/* Custom content */}
          {mode === "custom" && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-5"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode("choose")}
                className="mb-1 -ml-3 h-7 px-3 text-[10px]"
              >
                ← Back
              </Button>
              
              {/* Session type toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSessionType("reading")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[12px] border py-2.5 transition-all",
                    sessionType === "reading" 
                      ? "border-white/[0.2] bg-white/[0.075] text-foreground"
                      : "border-white/[0.065] bg-white/[0.018] text-muted-foreground hover:border-white/[0.13]"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Reading</span>
                </button>
                <button
                  onClick={() => setSessionType("listening")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[12px] border py-2.5 transition-all",
                    sessionType === "listening" 
                      ? "border-violet-300/30 bg-violet-400/[0.07] text-violet-100"
                      : "border-white/[0.065] bg-white/[0.018] text-muted-foreground hover:border-white/[0.13]"
                  )}
                >
                  <Headphones className="w-4 h-4" />
                  <span className="text-sm font-medium">Listening</span>
                </button>
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Thinking, Fast and Slow"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-11 border-white/[0.08] bg-white/[0.025] focus-visible:ring-white/20"
                />
              </div>
              
              {/* Author (optional) */}
              <div className="space-y-2">
                <Label htmlFor="author">Author (optional)</Label>
                <Input
                  id="author"
                  placeholder="e.g., Daniel Kahneman"
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value)}
                  className="h-11 border-white/[0.08] bg-white/[0.025] focus-visible:ring-white/20"
                />
              </div>
              
              {/* Difficulty slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Difficulty</Label>
                  <span className="text-xs text-muted-foreground">
                    {difficulty === 1 && "Light"}
                    {difficulty === 2 && "Easy"}
                    {difficulty === 3 && "Moderate"}
                    {difficulty === 4 && "Challenging"}
                    {difficulty === 5 && "Dense"}
                  </span>
                </div>
                <Slider
                  value={[difficulty]}
                  onValueChange={([v]) => setDifficulty(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/[0.08] [&>span:first-child>span]:bg-white/80 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-white/70"
                />
              </div>
              
              {/* Focus slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Focus Required</Label>
                  <span className="text-xs text-muted-foreground">
                    {focus === 1 && "Background"}
                    {focus === 2 && "Casual"}
                    {focus === 3 && "Attentive"}
                    {focus === 4 && "Deep"}
                    {focus === 5 && "Intensive"}
                  </span>
                </div>
                <Slider
                  value={[focus]}
                  onValueChange={([v]) => setFocus(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/[0.08] [&>span:first-child>span]:bg-white/80 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-white/70"
                />
              </div>
              
              {/* Weight preview */}
              <div className="rounded-[14px] border border-white/[0.065] bg-white/[0.022] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Calculated Weight</span>
                  <span className="text-lg font-semibold tabular-nums text-foreground">{customWeight.toFixed(2)}×</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Weight multiplies your reading time for RQ calculation
                </p>
              </div>
              
              {/* Start button */}
              <Button
                className="w-full"
                variant="premium"
                size="lg"
                onClick={handleStartCustomSession}
                disabled={!customTitle.trim() || startSession.isPending}
              >
                {startSession.isPending ? "Starting..." : "Start Session"}
              </Button>
            </motion.div>
          )}
          
          {/* Podcast Preview with Spotify Embed */}
          {mode === "preview" && previewItem && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-5"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setMode("looma");
                  setPreviewItem(null);
                }}
                className="mb-1 -ml-3 h-7 px-3 text-[10px]"
              >
                ← Back to Library
              </Button>
              
              {/* Podcast info */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-violet-300/20 bg-violet-400/[0.06]">
                  <Headphones className="h-4 w-4 text-violet-200/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{previewItem.author}</p>
                  <p className="text-sm font-medium text-violet-200/80">
                    {LOOMA_ITEM_WEIGHTS[previewItem.format]?.toFixed(1) || "1.0"}× weight
                  </p>
                </div>
              </div>
              
              {/* Spotify Embed Player */}
              {previewItem.spotifyShowId && (
                <SpotifyEmbed 
                  spotifyShowId={previewItem.spotifyShowId}
                  height={232}
                />
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                Listen to a preview, then start your session when ready.
              </p>
              
              {/* Start Session Button */}
              <Button
                className="w-full"
                variant="premium"
                size="lg"
                onClick={() => handleStartLoomaSession(previewItem)}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? "Starting..." : "Start Session"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
