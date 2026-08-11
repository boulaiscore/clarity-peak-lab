import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PassiveFeaturePayload } from "@/lib/passiveCoachFeatures";
import type { DailyOutlookTone } from "@/lib/dailyOutlook";
import { useDailyOutlook } from "@/hooks/useDailyOutlook";
import { cn } from "@/lib/utils";

interface DailyOutlookCardProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  signalCoverage: number;
  activeSourceCount: number;
  passiveFeatures: PassiveFeaturePayload | null;
  isLoading: boolean;
}

const toneClass: Record<DailyOutlookTone, string> = {
  support: "text-emerald-300/85",
  limit: "text-amber-300/90",
  neutral: "text-muted-foreground/70",
};

export function DailyOutlookCard(props: DailyOutlookCardProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    outlook,
    copySource,
    isLoading,
    isGeneratingCopy,
    actionStartedAt,
    markOpened,
    startAction,
  } = useDailyOutlook(props);

  const openOutlook = () => {
    setOpen(true);
    markOpened();
  };

  const handlePrimaryAction = async () => {
    await startAction();
    if (outlook.action.route) {
      setOpen(false);
      navigate(outlook.action.route);
    }
  };

  const actionStarted = Boolean(actionStartedAt);
  const sourceLine = props.activeSourceCount > 0
    ? `${props.activeSourceCount} signals · ${outlook.confidenceLabel} confidence`
    : "Personal baseline · learning";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-5"
      aria-labelledby="daily-outlook-section-title"
    >
      <h2
        id="daily-outlook-section-title"
        className="mb-2.5 px-0.5 text-[15px] font-semibold tracking-tight text-foreground"
      >
        My day
      </h2>

      <button
        type="button"
        onClick={openOutlook}
        className="w-full rounded-2xl border border-border/40 bg-card/45 px-4 py-4 text-left transition-colors hover:bg-card/65 active:scale-[0.995]"
      >
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-2.5 w-24 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted/70" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-semibold uppercase tracking-[0.19em] text-muted-foreground/65">
                Daily Outlook
              </span>
              <span className="text-[9px] font-medium tabular-nums text-muted-foreground/55">
                {sourceLine}
              </span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-tight text-foreground/95">
                  {outlook.headline}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/78">
                  {outlook.summary}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/55" />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.055] pt-3">
              <span className="text-[10px] font-medium text-foreground/80">
                {actionStarted
                  ? "Action started"
                  : outlook.windowLabel ?? `Next · ${outlook.action.durationMinutes} min`}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/85">
                {outlook.action.shortLabel}
              </span>
            </div>
          </>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] overflow-y-auto rounded-t-[24px] border-white/[0.07] bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5"
        >
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="pr-8 text-left">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Daily Outlook
            </p>
            <SheetTitle className="text-[24px] leading-tight tracking-tight">
              {outlook.headline}
            </SheetTitle>
            <SheetDescription className="text-[13px] leading-relaxed text-muted-foreground/80">
              {outlook.summary}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-white/[0.055] py-4">
            <OutlookDatum
              label="Best window"
              value={outlook.windowLabel ?? "No fixed window"}
            />
            <OutlookDatum
              label="Confidence"
              value={`${outlook.confidenceLabel} · ${Math.round(outlook.confidence * 100)}%`}
            />
          </div>

          <section className="mt-6" aria-labelledby="outlook-evidence-title">
            <div className="flex items-center justify-between">
              <h3
                id="outlook-evidence-title"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65"
              >
                Why today
              </h3>
              <span className="text-[9px] text-muted-foreground/45">
                {copySource === "ai" ? "Adaptive wording" : "Explainable policy"}
              </span>
            </div>

            <div className="mt-3 divide-y divide-white/[0.055] rounded-2xl border border-border/35 bg-card/35 px-4">
              {outlook.evidence.map((item) => (
                <div key={`${item.code}-${item.label}`} className="flex items-center gap-3 py-3.5">
                  <span className="min-w-10 rounded-md border border-border/45 bg-background/45 px-2 py-1 text-center text-[9px] font-semibold tracking-[0.12em] text-foreground/75">
                    {item.code}
                  </span>
                  <span className="min-w-0 flex-1 text-[12px] font-medium text-foreground/88">
                    {item.label}
                  </span>
                  <span className={cn("text-right text-[10px] tabular-nums", toneClass[item.tone])}>
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.065] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              Next action
            </p>
            <p className="mt-2 text-[15px] font-semibold text-foreground/95">
              {outlook.action.label}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/70">
              {outlook.action.kind === "work"
                ? "Later passive state is linked to this recommendation automatically."
                : "The completed session and later passive state are linked automatically."}
            </p>
            <Button
              type="button"
              variant="premium"
              className="mt-4 h-11 w-full text-sm"
              onClick={() => void handlePrimaryAction()}
              disabled={actionStarted && outlook.action.kind === "work"}
            >
              {actionStarted && outlook.action.kind === "work"
                ? "Block started"
                : outlook.action.label}
            </Button>
          </section>

          <p className="mt-5 text-center text-[9px] leading-relaxed text-muted-foreground/45">
            Generated from your own baseline. Missing signals remain neutral and never count against you.
            {isGeneratingCopy ? " Updating wording…" : ""}
          </p>
        </SheetContent>
      </Sheet>
    </motion.section>
  );
}

function OutlookDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-foreground/90 tabular-nums">
        {value}
      </p>
    </div>
  );
}
