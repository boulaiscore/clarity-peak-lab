/**
 * Add Book Dialog
 * Pick from LOOMA library (BOOK format) or enter a custom book.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Library,
  Sparkles,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_LIBRARY, ContentItem, estimateReadingHours, ContentDifficulty } from "@/lib/contentLibrary";
import { useAddActiveBook } from "@/hooks/useActiveBooks";
import { toast } from "sonner";

interface AddBookDialogProps {
  open: boolean;
  onClose: () => void;
  onBookAdded: () => void;
}

type Mode = "choose" | "looma" | "custom";

/** Map demand string to ContentDifficulty for estimation */
function demandToDifficulty(demand: string): ContentDifficulty {
  if (demand === "LOW") return "light";
  if (demand === "HIGH" || demand === "VERY_HIGH") return "dense";
  return "medium";
}

export function AddBookDialog({ open, onClose, onBookAdded }: AddBookDialogProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customPages, setCustomPages] = useState("");
  const [customDemand, setCustomDemand] = useState("MEDIUM");

  const addBook = useAddActiveBook();

  const books = CONTENT_LIBRARY.filter((c) => c.format === "book");

  const handleClose = () => {
    setMode("choose");
    setCustomTitle("");
    setCustomAuthor("");
    setCustomPages("");
    setCustomDemand("MEDIUM");
    onClose();
  };

  const handlePickLooma = async (item: ContentItem) => {
    try {
      await addBook.mutateAsync({
        title: item.title,
        author: item.author,
        source: "looma_list",
        item_id: item.id,
        demand: item.difficulty === "dense" ? "HIGH" : "MEDIUM",
        pages: item.pages,
      });
      toast.success("Book added!", { description: item.title });
      handleClose();
      onBookAdded();
    } catch (e: any) {
      toast.error(e.message || "Failed to add book");
    }
  };

  const handleAddCustom = async () => {
    if (!customTitle.trim()) {
      toast.error("Enter a book title");
      return;
    }
    const pages = parseInt(customPages) || undefined;
    try {
      await addBook.mutateAsync({
        title: customTitle.trim(),
        author: customAuthor.trim() || undefined,
        source: "custom",
        demand: customDemand,
        pages,
      });
      toast.success("Book added!", { description: customTitle });
      handleClose();
      onBookAdded();
    } catch (e: any) {
      toast.error(e.message || "Failed to add book");
    }
  };

  const customEstimate = customPages
    ? estimateReadingHours(parseInt(customPages) || 0, demandToDifficulty(customDemand))
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "choose" && "Add a Book"}
            {mode === "looma" && "LOOMA Library"}
            {mode === "custom" && "Custom Book"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose" && "Choose from curated books or add your own."}
            {mode === "looma" && "Select a book to start reading."}
            {mode === "custom" && "Enter the book you're currently reading."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    Curated cognitive performance books
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>

              <button
                onClick={() => setMode("custom")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Custom Book</p>
                  <p className="text-xs text-muted-foreground">
                    Add any book you're reading
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </motion.div>
          )}

          {mode === "looma" && (
            <motion.div
              key="looma"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 min-h-0"
            >
              <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="mb-3 -ml-2">
                ← Back
              </Button>
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {books.map((item) => {
                    const estHours = item.pages
                      ? estimateReadingHours(item.pages, item.difficulty)
                      : null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePickLooma(item)}
                        disabled={addBook.isPending}
                        className="w-full p-3 rounded-xl border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                            {item.author && (
                              <p className="text-[10px] text-muted-foreground">{item.author}</p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground/60">
                                {item.difficulty} · {item.pages} pp
                              </span>
                              {estHours && (
                                <span className="text-[10px] text-amber-500/80 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  ~{estHours}h
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {mode === "custom" && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="mb-1 -ml-2">
                ← Back
              </Button>

              <div className="space-y-2">
                <Label htmlFor="book-title">Book Title *</Label>
                <Input
                  id="book-title"
                  placeholder="e.g., Thinking, Fast and Slow"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-author">Author</Label>
                <Input
                  id="book-author"
                  placeholder="e.g., Daniel Kahneman"
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-pages">Pages</Label>
                <Input
                  id="book-pages"
                  type="number"
                  placeholder="e.g., 350"
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  min={1}
                  max={5000}
                />
              </div>

              <div className="space-y-2">
                <Label>Cognitive Demand</Label>
                <Select value={customDemand} onValueChange={setCustomDemand}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low — light fiction, narrative</SelectItem>
                    <SelectItem value="MEDIUM">Medium — non-fiction, essays</SelectItem>
                    <SelectItem value="HIGH">High — dense, analytical</SelectItem>
                    <SelectItem value="VERY_HIGH">Very High — academic, technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customEstimate !== null && customEstimate > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
                  <Clock className="w-3.5 h-3.5" />
                  Estimated ~{customEstimate}h to complete
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleAddCustom}
                disabled={!customTitle.trim() || addBook.isPending}
              >
                {addBook.isPending ? "Adding..." : "Start Reading This Book"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
