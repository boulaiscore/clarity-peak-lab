/**
 * Active Books View
 * Shows currently reading books with timer/manual entry options.
 * Max 2 books at a time.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Clock,
  Play,
  Check,
  X,
  ChevronRight,
  Timer,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  ActiveBook,
  useActiveBooks,
  useCompleteActiveBook,
  useAbandonActiveBook,
  useLogManualReading,
} from "@/hooks/useActiveBooks";
import {
  useStartReasonSession,
  LOOMA_ITEM_WEIGHTS,
} from "@/hooks/useReasonSessions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { AddBookDialog } from "./AddBookDialog";

export function ActiveBooksView() {
  const { data: activeBooks = [], isLoading } = useActiveBooks();
  const completeBook = useCompleteActiveBook();
  const abandonBook = useAbandonActiveBook();
  const logManual = useLogManualReading();
  const startSession = useStartReasonSession();

  const [showAddBook, setShowAddBook] = useState(false);
  const [manualBookId, setManualBookId] = useState<string | null>(null);
  const [manualMinutes, setManualMinutes] = useState("");
  const [confirmComplete, setConfirmComplete] = useState<ActiveBook | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState<ActiveBook | null>(null);

  const canAddMore = activeBooks.length < 2;

  const handleStartTimer = async (book: ActiveBook) => {
    try {
      await startSession.mutateAsync({
        session_type: "reading",
        source: book.source as "looma_list" | "custom",
        item_id: book.id,
        custom_title: book.title,
        custom_author: book.author || undefined,
        weight: LOOMA_ITEM_WEIGHTS.book,
      });
      toast.success("Reading timer started", { description: book.title });
    } catch {
      toast.error("Failed to start timer");
    }
  };

  const handleLogManual = async (book: ActiveBook) => {
    const mins = parseInt(manualMinutes);
    if (!mins || mins <= 0 || mins > 480) {
      toast.error("Enter a valid number of minutes (1-480)");
      return;
    }
    try {
      await logManual.mutateAsync({
        bookId: book.id,
        minutes: mins,
        bookTitle: book.title,
        bookAuthor: book.author || undefined,
      });
      toast.success(`${mins} min logged`, { description: book.title });
      setManualBookId(null);
      setManualMinutes("");
    } catch {
      toast.error("Failed to log reading time");
    }
  };

  const handleComplete = async () => {
    if (!confirmComplete) return;
    try {
      await completeBook.mutateAsync(confirmComplete.id);
      toast.success("Book completed", {
        description: `${confirmComplete.title} — ${confirmComplete.total_minutes_read} min total. RQ impact applied.`,
      });
      setConfirmComplete(null);
    } catch {
      toast.error("Failed to complete book");
    }
  };

  const handleAbandon = async () => {
    if (!confirmAbandon) return;
    try {
      await abandonBook.mutateAsync(confirmAbandon.id);
      toast("Book removed", { description: confirmAbandon.title });
      setConfirmAbandon(null);
    } catch {
      toast.error("Failed to remove book");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white/80" />
      </div>
    );
  }

  const manualBook = activeBooks.find((b) => b.id === manualBookId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.055] pb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/75">Currently reading</h3>
        <span className="text-[9px] tabular-nums text-muted-foreground/55">
          {activeBooks.length}/2 books
        </span>
      </div>

      {/* Active books list */}
      {activeBooks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[16px] border border-white/[0.065] bg-white/[0.018] p-6 text-center"
        >
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[11px] border border-white/[0.09] bg-white/[0.03] text-[8px] font-semibold tracking-[0.1em] text-white/60">READ</span>
          <p className="mb-1 text-[13px] font-semibold text-foreground/85">No books in progress</p>
          <p className="mb-4 text-[10px] leading-relaxed text-muted-foreground/55">
            Pick from the curated LOOMA library or add your own title
          </p>
          <Button size="sm" variant="premium" onClick={() => setShowAddBook(true)} className="gap-1.5">
            Browse library
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activeBooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-[16px] border border-white/[0.065] bg-white/[0.018] p-4"
              >
                {/* Book info */}
                <div className="flex items-start gap-3 mb-3">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      loading="lazy"
                      className="w-10 h-14 object-cover rounded-md shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded-md border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-1">{book.title}</h4>
                    {book.author && (
                      <p className="text-[10px] text-muted-foreground">{book.author}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {book.total_minutes_read} min total
                      </span>
                      {book.last_read_at && (
                        <span>
                          Last read {formatDistanceToNow(new Date(book.last_read_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual minutes inline form */}
                {manualBookId === book.id ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <Input
                      type="number"
                      placeholder="Minutes read"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      className="h-8 text-sm flex-1"
                      min={1}
                      max={480}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => handleLogManual(book)}
                      disabled={logManual.isPending}
                    >
                      {logManual.isPending ? "..." : "Log"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => { setManualBookId(null); setManualMinutes(""); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="premium"
                    className="h-8 gap-1.5 flex-1"
                    onClick={() => handleStartTimer(book)}
                    disabled={startSession.isPending}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Timer
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    className="h-8 gap-1.5 flex-1"
                    onClick={() => setManualBookId(manualBookId === book.id ? null : book.id)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Log Minutes
                  </Button>
                </div>

                {/* Secondary actions */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setConfirmComplete(book)}
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark as Completed
                  </button>
                  <span className="text-muted-foreground/30">•</span>
                  <button
                    onClick={() => setConfirmAbandon(book)}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add more button */}
          {canAddMore && (
            <Button
              variant="subtle"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setShowAddBook(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Book
            </Button>
          )}
        </div>
      )}

      {/* Add Book Dialog */}
      <AddBookDialog
        open={showAddBook}
        onClose={() => setShowAddBook(false)}
        onBookAdded={() => setShowAddBook(false)}
      />

      {/* Complete confirmation */}
      <AlertDialog open={!!confirmComplete} onOpenChange={() => setConfirmComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Book completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark "{confirmComplete?.title}" as completed. This will contribute to your Reasoning Quality score.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Yes, completed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon confirmation */}
      <AlertDialog open={!!confirmAbandon} onOpenChange={() => setConfirmAbandon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove book?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{confirmAbandon?.title}" from your reading list. Previously logged time will still count.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbandon} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
