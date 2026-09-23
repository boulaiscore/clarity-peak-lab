/**
 * GameLockCard
 *
 * Explains exactly why a drill is locked: which criterion, the current value
 * versus the required one, and the concrete next action the user can take.
 * Replaces opaque copy such as "Sharpness below threshold".
 */

import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameGatingResult } from "@/hooks/useGamesGating";

interface LockAction {
  label: string;
  to?: string;
}

interface LockContent {
  title: string;
  why: string;
  actions: LockAction[];
  note?: string;
}

const RECOVERY_ROUTE = "/neuro-lab?tab=detox";
const FAST_ROUTE = "/neuro-lab?tab=games&system=fast";
const SLOW_ROUTE = "/neuro-lab?tab=games&system=slow";

function buildLockContent(gating: GameGatingResult): LockContent {
  switch (gating.reasonCode) {
    case "RECOVERY_TOO_LOW":
    case "SUPERHUMAN_REC_REQUIRED":
      return {
        title: "Recovery is too low right now",
        why: "Training in this state lowers your scores instead of building them. It reopens as soon as Recovery reaches the level below.",
        actions: [
          { label: "Start a recovery session", to: RECOVERY_ROUTE },
          { label: "Take a screen-free break" },
        ],
      };
    case "SHARPNESS_TOO_LOW":
      return {
        title: "Sharpness is below the level this drill needs",
        why: "These drills only measure something real when your clarity is high enough. Fast-processing work is the quickest way to raise it today.",
        actions: [
          { label: "Train fast processing first", to: FAST_ROUTE },
          { label: "Or rest and retry later" },
        ],
      };
    case "SHARPNESS_TOO_HIGH":
      return {
        title: "Reserved for a lower sharpness range",
        why: "You are already above the range this drill is designed for, so it would not add anything today.",
        actions: [{ label: "Go to deliberate reasoning", to: SLOW_ROUTE }],
      };
    case "READINESS_TOO_LOW":
      return {
        title: "Readiness is below the level this drill needs",
        why: "Readiness reflects how much demanding work your day can absorb. Rest or wait a few hours and it usually comes back up.",
        actions: [
          { label: "Start a recovery session", to: RECOVERY_ROUTE },
          { label: "Or retry in 2–4 hours" },
        ],
      };
    case "READINESS_OUT_OF_RANGE":
      return {
        title: "Readiness is outside this drill's range",
        why: "Insight work needs a middle readiness range. Right now Critical Thinking is the better use of your state.",
        actions: [{ label: "Go to Critical Thinking", to: SLOW_ROUTE }],
      };
    case "CAP_REACHED_DAILY_S1":
    case "CAP_REACHED_DAILY_S2":
      return {
        title: "Daily training limit reached",
        why: "You already did today's useful volume. More sessions today would add load without adding measurable gain.",
        actions: [
          { label: "Recover instead", to: RECOVERY_ROUTE },
          { label: "Resets tomorrow morning" },
        ],
      };
    case "CAP_REACHED_WEEKLY_S2":
    case "CAP_REACHED_WEEKLY_IN":
      return {
        title: "Weekly limit for this drill reached",
        why: "Deliberate reasoning is capped per week so results stay comparable over time.",
        actions: [
          { label: "Train fast processing", to: FAST_ROUTE },
          { label: "Resets at the start of next week" },
        ],
      };
    default:
      return {
        title: "Temporarily unavailable",
        why: "This drill is closed right now. Recovery and today's state decide when it reopens.",
        actions: [{ label: "Start a recovery session", to: RECOVERY_ROUTE }],
      };
  }
}

export function GameLockCard({
  gating,
  onNavigate,
  className,
}: {
  gating: GameGatingResult;
  /** Called before navigating away (use it to close the open drawer). */
  onNavigate?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const content = buildLockContent(gating);
  const isProtection = gating.status === "PROTECTION";
  const details = gating.details;

  const current = details ? Math.round(details.currentValue) : null;
  const required = details ? Math.round(details.requiredValue) : null;
  const progress =
    current != null && required != null && required > 0
      ? Math.max(4, Math.min(100, (current / required) * 100))
      : null;

  const handleAction = (action: LockAction) => {
    if (!action.to) return;
    onNavigate?.();
    setTimeout(() => navigate(action.to!), 150);
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isProtection ? "border-protection/30 bg-protection/5" : "border-border/40 bg-muted/20",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        {isProtection ? (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-protection" />
        ) : (
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-foreground">{content.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{content.why}</p>
        </div>
      </div>

      {details && current != null && required != null && (
        <div className="mt-3 rounded-lg border border-border/30 bg-background/40 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
              Unlock criterion
            </span>
            <span className="text-[11px] tabular-nums text-foreground/85">
              {details.metric} {current} · needs {required}
            </span>
          </div>
          {progress != null && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-foreground/55 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
          What to do now
        </p>
        {content.actions.map((action) =>
          action.to ? (
            <button
              key={action.label}
              type="button"
              onClick={() => handleAction(action)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-left text-[12px] font-medium text-foreground transition-colors hover:bg-background active:scale-[0.99]"
            >
              <span className="min-w-0 truncate">{action.label}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ) : (
            <p key={action.label} className="px-1 text-[11px] text-muted-foreground/75">
              {action.label}
            </p>
          ),
        )}
      </div>
    </div>
  );
}
