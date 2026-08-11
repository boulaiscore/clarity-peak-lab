import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  PassiveSignalSource,
  SignalCoverageLevel,
} from "@/lib/dailyPassiveState";
import { cn } from "@/lib/utils";

interface SignalCoverageRowProps {
  level: SignalCoverageLevel;
  coverage: number;
  updatedAt: string | null;
  sources: PassiveSignalSource[];
}
function formatUpdatedAt(value: string | null): string {
  if (!value) return "Waiting for data";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Waiting for data";
  return `Updated ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const statusLabel: Record<PassiveSignalSource["status"], string> = {
  active: "Active",
  learning: "Learning",
  off: "Off",
};

export function SignalCoverageRow({
  level,
  coverage,
  updatedAt,
  sources,
}: SignalCoverageRowProps) {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mb-4 flex w-full items-center justify-center gap-2 text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground/55 transition-colors hover:text-muted-foreground"
          aria-label={`Signal coverage ${level}. ${formatUpdatedAt(updatedAt)}`}
        >
          <span>Signal coverage</span>
          <span aria-hidden="true">·</span>
          <span className="text-foreground/65">{level}</span>
          <span aria-hidden="true">·</span>
          <span className="normal-case tracking-normal">{formatUpdatedAt(updatedAt)}</span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="left-1/2 w-full max-w-md -translate-x-1/2 rounded-t-[28px] border-border/40 bg-background px-6 pb-8 pt-7"
      >
        <SheetHeader className="pr-7 text-left">
          <SheetTitle className="text-lg font-medium">Signal coverage</SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            More passive signals make today&apos;s estimates more responsive to your actual state.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 border-y border-border/30">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex min-h-12 items-center justify-between border-b border-border/20 last:border-b-0"
            >
              <span className="text-sm text-foreground/85">{source.label}</span>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.12em]",
                  source.status === "active" && "text-emerald-400/80",
                  source.status === "learning" && "text-primary/80",
                  source.status === "off" && "text-muted-foreground/50",
                )}
              >
                {statusLabel[source.status]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/55">
            {Math.round(coverage * 100)}% covered
          </span>
          <button
            type="button"
            onClick={() => navigate("/app/wearable")}
            className="rounded-full border border-border/50 px-4 py-2 text-xs font-medium text-foreground/85 transition-colors hover:bg-muted/30"
          >
            Manage sources
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
