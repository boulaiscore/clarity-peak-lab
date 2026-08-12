/**
 * Continue Reading Sheet
 *
 * Premium quick-resume surface (Pro/Elite only).
 * Smart list of in-progress books ordered by most recent reading session,
 * with one-tap resume timer. No manual queue — the list is derived from
 * `active_books` (status = "reading") so it reflects real intent.
 */

import { useNavigate } from "react-router-dom";
import { Bookmark, Play, Clock, Lock, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useActiveBooks, ActiveBook } from "@/hooks/useActiveBooks";
import {
  useStartReasonSession,
  LOOMA_ITEM_WEIGHTS,
} from "@/hooks/useReasonSessions";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContinueReadingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContinueReadingSheet({ open, onOpenChange }: ContinueReadingSheetProps) {
  const navigate = useNavigate();
  const { isActive, loading: subLoading } = useSubscription();
  const { data: activeBooks = [], isLoading } = useActiveBooks();
  const startSession = useStartReasonSession();

  const hasAccess = isActive;

  // Sort by most recently read first (fall back to started_at)
  const sorted = [...activeBooks].sort((a, b) => {
    const aTime = new Date(a.last_read_at || a.started_at).getTime();
    const bTime = new Date(b.last_read_at || b.started_at).getTime();
    return bTime - aTime;
  });

  const handleResume = async (book: ActiveBook) => {
    try {
      await startSession.mutateAsync({
        session_type: "reading",
        source: book.source as "looma_list" | "custom",
        item_id: book.id,
        custom_title: book.title,
        custom_author: book.author || undefined,
        weight: LOOMA_ITEM_WEIGHTS.book,
      });
      onOpenChange(false);
      toast.success("Reading timer started", { description: book.title });
    } catch {
      toast.error("Failed to start timer");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[82dvh] flex-col rounded-t-[28px] border-white/[0.08] bg-[#0b0d10] shadow-[0_-24px_80px_rgba(0,0,0,0.58)]"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-white/65" />
            <SheetTitle className="text-base">Continue Reading</SheetTitle>
          </div>
          <SheetDescription className="text-[11px]">
            Resume one of your active books in a single tap.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto mt-4">
          {subLoading ? (
            <div className="py-10 text-center text-[11px] text-muted-foreground">Loading…</div>
          ) : !hasAccess ? (
            <div className="py-8 px-2 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.035] border border-white/[0.09] flex items-center justify-center">
                <Lock className="w-5 h-5 text-white/60" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-semibold text-foreground">Pro feature</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Continue Reading keeps your active books one tap away — included with Pro and Elite.
                </p>
              </div>
              <Button
                size="sm"
                className="mt-1"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/app/subscription");
                }}
              >
                See plans
              </Button>
            </div>
          ) : isLoading ? (
            <div className="py-10 text-center text-[11px] text-muted-foreground">Loading books…</div>
          ) : sorted.length === 0 ? (
            <div className="py-8 px-2 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-semibold text-foreground">Nothing in progress</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Start a book from the Read card and it will appear here for instant resume.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2 pb-2">
              {sorted.map((book) => {
                const last = book.last_read_at
                  ? formatDistanceToNow(new Date(book.last_read_at), { addSuffix: true })
                  : "Not started";
                return (
                  <li
                    key={book.id}
                    className={cn(
                      "rounded-[14px] border border-white/[0.065] bg-white/[0.018] p-3",
                      "flex items-center gap-3"
                    )}
                  >
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
                      <p className="text-[13px] font-semibold text-foreground/90 truncate">
                        {book.title}
                      </p>
                      {book.author && (
                        <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                        <Clock className="w-3 h-3" />
                        <span>{last}</span>
                        <span className="opacity-50">·</span>
                        <span>{book.total_minutes_read || 0} min total</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResume(book)}
                      disabled={startSession.isPending}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg",
                        "border border-foreground/15 bg-foreground text-background",
                        "hover:bg-foreground/90 active:scale-[0.98] transition-all",
                        "text-[11px] font-medium uppercase tracking-[0.14em]",
                        "disabled:opacity-50"
                      )}
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
