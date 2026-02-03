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
  FileText,
  Plus,
  ChevronRight,
  Library,
  Sparkles,
  ExternalLink
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
import { toast } from "sonner";

interface ReasonContentSelectorProps {
  open: boolean;
  onClose: () => void;
  onSessionStarted: () => void;
  initialSessionType?: SessionType;
}

type SelectionMode = "choose" | "looma" | "custom";

export function ReasonContentSelector({ 
  open, 
  onClose, 
  onSessionStarted,
  initialSessionType = "reading"
}: ReasonContentSelectorProps) {
  const [mode, setMode] = useState<SelectionMode>("choose");
  const [sessionType, setSessionType] = useState<SessionType>(initialSessionType);
  
  // Custom item state
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [focus, setFocus] = useState(3);
  
  const startSession = useStartReasonSession();
  
  // Reset state when dialog closes
  const handleClose = () => {
    setMode("choose");
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
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "choose" && (initialSessionType === "listening" ? "Start Listening" : "Start Reading")}
            {mode === "looma" && "LOOMA Library"}
            {mode === "custom" && "Custom Content"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose" && (initialSessionType === "listening" 
              ? "Choose a podcast to track your listening time."
              : "Choose content to track your reading time.")}
            {mode === "looma" && (initialSessionType === "listening"
              ? "Select from curated podcasts with optimized weights."
              : "Select from curated books and readings with optimized weights.")}
            {mode === "custom" && (initialSessionType === "listening"
              ? "Track your own podcast or audiobook."
              : "Track your own book, article, or paper.")}
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
              className="space-y-3 pt-2"
            >
              <button
                onClick={() => setMode("looma")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Library className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold flex items-center gap-2">
                    LOOMA Library
                    <Sparkles className="w-3 h-3 text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Curated podcasts, books & articles
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              
              <button
                onClick={() => setMode("custom")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Custom Content</p>
                  <p className="text-xs text-muted-foreground">
                    Track your own book, podcast, or article
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
              className="flex-1 min-h-0"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode("choose")}
                className="mb-3 -ml-2"
              >
                ← Back
              </Button>
              
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {filteredLibrary.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No {initialSessionType === "listening" ? "podcasts" : "books or readings"} available yet.
                    </p>
                  ) : (
                    filteredLibrary.map((item) => (
                      <div
                        key={item.id}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          item.format === "podcast" && "bg-violet-500/10",
                          item.format === "reading" && "bg-cyan-500/10",
                          item.format === "book" && "bg-amber-500/10",
                        )}>
                          {item.format === "podcast" && <Headphones className="w-5 h-5 text-violet-500" />}
                          {item.format === "reading" && <FileText className="w-5 h-5 text-cyan-500" />}
                          {item.format === "book" && <BookOpen className="w-5 h-5 text-amber-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="capitalize">{item.format}</span>
                            <span>•</span>
                            <span>{item.durationMinutes} min</span>
                            <span>•</span>
                            <span className="font-medium text-primary">
                              {LOOMA_ITEM_WEIGHTS[item.format]?.toFixed(1) || "1.0"}×
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.url, "_blank", "noopener,noreferrer");
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              title="Open content"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartLoomaSession(item)}
                            disabled={startSession.isPending}
                            className="h-8 px-3 text-xs font-medium"
                          >
                            Start
                          </Button>
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
              className="space-y-4"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMode("choose")}
                className="mb-1 -ml-2"
              >
                ← Back
              </Button>
              
              {/* Session type toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSessionType("reading")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    sessionType === "reading" 
                      ? "border-primary bg-primary/10 text-foreground" 
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Reading</span>
                </button>
                <button
                  onClick={() => setSessionType("listening")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    sessionType === "listening" 
                      ? "border-primary bg-primary/10 text-foreground" 
                      : "border-border text-muted-foreground hover:border-primary/50"
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
                />
              </div>
              
              {/* Weight preview */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Calculated Weight</span>
                  <span className="text-lg font-bold text-primary">{customWeight.toFixed(2)}×</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Weight multiplies your reading time for RQ calculation
                </p>
              </div>
              
              {/* Start button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleStartCustomSession}
                disabled={!customTitle.trim() || startSession.isPending}
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
