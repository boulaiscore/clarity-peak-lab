import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
import { useDailyOutlook } from "@/hooks/useDailyOutlook";

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

function greetingForNow(name: string | null): string {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${greeting}, ${name}` : greeting;
}

export function DailyOutlookCard(props: DailyOutlookCardProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    outlook,
    copySource,
    coachName,
    isLoading,
    isGeneratingCopy,
    markOpened,
    activateAction,
  } = useDailyOutlook(props);

  const openOutlook = () => {
    setOpen(true);
    markOpened();
  };

  const handlePrimaryAction = () => {
    activateAction();
    if (outlook.action.route) {
      setOpen(false);
      navigate(outlook.action.route);
    }
  };

  const hasLearnedPattern = outlook.coachBasis.learnedFromHistory;
  const hasPersonalConfidence = hasLearnedPattern && outlook.confidence >= 0.1;
  const sourceLine = props.activeSourceCount > 0
    ? `${hasLearnedPattern ? "Personal pattern" : "Learning"} · ${props.activeSourceCount} connected`
    : hasLearnedPattern ? "Personal pattern" : "Learning your pattern";

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

      <div className="rounded-[22px] bg-gradient-to-br from-violet-300/55 via-sky-300/35 to-foreground/15 p-px shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={openOutlook}
          className="w-full rounded-[21px] bg-card/95 px-4 py-[18px] text-left transition-colors hover:bg-card active:scale-[0.995]"
        >
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-2.5 w-24 rounded bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted/70" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 bg-foreground/[0.04] text-[10px] font-semibold tracking-[-0.04em] text-foreground/90">
                    L
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.19em] text-foreground/75">
                    Your Daily Outlook
                  </span>
                </div>
                <span className="text-right text-[8px] font-medium tabular-nums text-muted-foreground/55">
                  {sourceLine}
                </span>
              </div>

              <div className="mt-4 pr-3">
                <p className="text-[17px] font-semibold leading-tight tracking-tight text-foreground/95">
                  {outlook.headline}
                </p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/78">
                  {outlook.summary}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.055] pt-3">
                <span className="text-[9px] text-muted-foreground/60">
                  {hasLearnedPattern ? "Personal read" : "Daily guidance"} · 1 next action
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/85">
                  Read briefing
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </>
          )}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] overflow-y-auto rounded-none border-white/[0.07] bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.09),hsl(var(--background))_34%)] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:left-auto sm:right-0 sm:w-[480px] sm:rounded-l-[28px]"
        >
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-center gap-2 pr-8">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 bg-foreground/[0.04] text-[10px] font-semibold text-foreground/90">
                L
              </span>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/85">
                  LOOMA Coach
                </p>
                <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground/50">
                  {copySource === "ai" ? "Adaptive daily guidance" : "Daily guidance · learning"}
                </p>
              </div>
            </div>

            <SheetHeader className="mt-9 text-left">
              <p className="text-[12px] font-medium text-muted-foreground/75">
                {greetingForNow(coachName)} — here is what matters today.
              </p>
              <SheetTitle className="mt-2 text-[28px] leading-[1.08] tracking-tight">
                {outlook.headline}
              </SheetTitle>
              <SheetDescription className="mt-3 text-[14px] leading-relaxed text-foreground/72">
                {outlook.summary}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/[0.06] py-3 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/50">
              <span>
                {hasPersonalConfidence
                  ? `${outlook.confidenceLabel} personal confidence · ${Math.round(outlook.confidence * 100)}%`
                  : "Learning your baseline"}
              </span>
              {outlook.windowLabel && <span>Best observed window · {outlook.windowLabel}</span>}
              {props.activeSourceCount > 0 && <span>{props.activeSourceCount} connected sources</span>}
            </div>

            {hasLearnedPattern && (
              <section className="mt-8 rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-4 py-4" aria-labelledby="outlook-pattern-title">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55">
                  Learned from your pattern
                </p>
                <h3 id="outlook-pattern-title" className="mt-2 text-[13px] font-medium leading-relaxed text-foreground/82">
                  {outlook.coachBasis.patternInsight}
                </h3>
              </section>
            )}

            <section className="mt-8 border-t border-white/[0.07] pt-7" aria-labelledby="outlook-action-title">
              <h3
                id="outlook-action-title"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/82"
              >
                Today’s action plan
              </h3>

              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-[10px] font-semibold text-foreground/80">
                  1
                </span>
                <div>
                  <p className="text-[15px] font-semibold leading-snug text-foreground/95">
                    {outlook.action.label}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/68">
                    Selected because {outlook.action.metricLabel.toLowerCase()} is the signal most directly connected to this action.
                  </p>
                </div>
              </div>

              {outlook.action.kind === "lab" && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-11 w-full rounded-full border-foreground/20 bg-foreground/[0.04] text-sm text-foreground hover:bg-foreground/[0.08]"
                  onClick={handlePrimaryAction}
                >
                  Open recommended protocol
                </Button>
              )}
            </section>

            <p className="mt-9 border-t border-white/[0.06] pt-5 text-center text-[9px] leading-relaxed text-muted-foreground/42">
              Built from your goal, current state, connected context and—when available—your own history.
              {isGeneratingCopy ? " Updating your briefing…" : ""}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </motion.section>
  );
}
