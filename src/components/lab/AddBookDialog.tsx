/**
 * Add Book Dialog
 * Pick from LOOMA library (BOOK format) or enter a custom book.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Library,
  Sparkles,
  ChevronRight,
  Clock,
  Search,
  ExternalLink,
  Loader2,
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
import { searchGoogleBooks, GoogleBookResult } from "@/lib/googleBooks";
import { toast } from "sonner";

interface AddBookDialogProps {
  open: boolean;
  onClose: () => void;
  onBookAdded: () => void;
}

type Mode = "choose" | "looma" | "search" | "custom";

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

  // Google Books search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBookResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTouched, setSearchTouched] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  const addBook = useAddActiveBook();

  const books = CONTENT_LIBRARY.filter((c) => c.format === "book");

  const handleClose = () => {
    setMode("choose");
    setCustomTitle("");
    setCustomAuthor("");
    setCustomPages("");
    setCustomDemand("MEDIUM");
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSearchTouched(false);
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

  /** Debounced Google Books search */
  useEffect(() => {
    if (mode !== "search") return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    searchAbortRef.current?.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;
    setSearchLoading(true);
    setSearchError(null);
    setSearchTouched(true);
    const t = setTimeout(async () => {
      try {
        const results = await searchGoogleBooks(q, ctrl.signal);
        if (!ctrl.signal.aborted) setSearchResults(results);
      } catch (e: any) {
        if (e?.name !== "AbortError") setSearchError("Search failed. Try again.");
      } finally {
        if (!ctrl.signal.aborted) setSearchLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery, mode]);

  const handlePickSearch = async (item: GoogleBookResult) => {
    try {
      await addBook.mutateAsync({
        title: item.title,
        author: item.authors[0] || undefined,
        source: "custom",
        item_id: `gbooks_${item.id}`,
        demand: "MEDIUM",
        pages: item.pageCount,
        cover_url: item.cover,
      });
      toast.success("Book added!", { description: item.title });
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
            {mode === "search" && "Search any book"}
            {mode === "custom" && "Custom Book"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose" && "Pick from the curated list, search the web, or add your own."}
            {mode === "looma" && "Select a book to start reading."}
            {mode === "search" && "Powered by Google Books — covers and purchase links included."}
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
                onClick={() => setMode("search")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Search className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Search any book</p>
                  <p className="text-xs text-muted-foreground">
                    Find covers & buy via Google Books
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
                  <p className="font-semibold">Enter manually</p>
                  <p className="text-xs text-muted-foreground">
                    Type the title yourself
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

          {mode === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="mb-3 -ml-2">
                ← Back
              </Button>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Title, author, ISBN…"
                  className="pl-9"
                  maxLength={120}
                />
              </div>

              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-4">
                  {searchLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching…
                    </div>
                  )}

                  {!searchLoading && searchError && (
                    <p className="text-xs text-destructive text-center py-6">{searchError}</p>
                  )}

                  {!searchLoading && !searchError && searchTouched && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No results. Try a different query.
                    </p>
                  )}

                  {!searchTouched && (
                    <p className="text-[11px] text-muted-foreground/70 text-center py-6 leading-relaxed">
                      Start typing to find any book.<br />
                      Tap a result to add it, or open its Google page to purchase.
                    </p>
                  )}

                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border hover:border-amber-500/40 transition-all flex gap-3"
                    >
                      {item.cover ? (
                        <img
                          src={item.cover}
                          alt={item.title}
                          loading="lazy"
                          className="w-12 h-16 object-cover rounded-md shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-sm font-medium line-clamp-2 leading-tight">{item.title}</p>
                        {item.authors.length > 0 && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.authors.join(", ")}
                          </p>
                        )}
                        {item.pageCount && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {item.pageCount} pp
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-auto pt-2">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2.5"
                            disabled={addBook.isPending}
                            onClick={() => handlePickSearch(item)}
                          >
                            Add
                          </Button>
                          {item.infoLink && (
                            <a
                              href={item.infoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                            >
                              View / Buy
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
