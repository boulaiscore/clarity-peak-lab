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
}

import { LAB_RECOVERY_ROUTE, labGamesRoute } from "@/lib/labRoutes";

const RECOVERY_ROUTE = LAB_RECOVERY_ROUTE;

function buildLockContent(gating: GameGatingResult): LockContent {
  switch (gating.reasonCode) {
    case "RECOVERY_TOO_LOW":
    case "SUPERHUMAN_REC_REQUIRED":
      return {
        title: "Recovery needs to rise first",
        why: "This protects the quality of your result when your available energy is low.",
        actions: [
          { label: "Start a recovery session", to: RECOVERY_ROUTE },
        ],
      };
    case "SHARPNESS_TOO_LOW":
      return {
        title: "Build Sharpness first",
        why: "A short Fast · intuitive drill is the most direct next step.",
        actions: [
          { label: "Open Fast · intuitive drills", to: labGamesRoute("fast") },
        ],
      };
    case "SHARPNESS_TOO_HIGH":
      return {
        title: "Reserved for a lower sharpness range",
        why: "You are already above the range this drill is designed for, so it would not add anything today.",
        actions: [{ label: "Open Slow · analytical drills", to: labGamesRoute("slow") }],
      };
    case "READINESS_TOO_LOW":
      return {
        title: "Readiness is below the level this drill needs",
        why: "Recover before adding demanding analytical work.",
        actions: [
          { label: "Start a recovery session", to: RECOVERY_ROUTE },
        ],
      };
    case "READINESS_OUT_OF_RANGE":
      return {
        title: "Readiness is outside this drill's range",
        why: "Insight work needs a middle readiness range. Right now Critical Thinking is the better use of your state.",
        actions: [{ label: "Open Slow · analytical drills", to: labGamesRoute("slow") }],
      };
    case "CAP_REACHED_DAILY_S1":
    case "CAP_REACHED_DAILY_S2":
      return {
        title: "Daily training limit reached",
        why: "You already did today's useful volume. More sessions today would add load without adding measurable gain.",
        actions: [
          { label: "Recover instead", to: RECOVERY_ROUTE },
        ],
      };
    case "CAP_REACHED_WEEKLY_S2":
    case "CAP_REACHED_WEEKLY_IN":
      return {
        title: "Weekly limit for this drill reached",
        why: "Deliberate reasoning is capped per week so results stay comparable over time.",
        actions: [
          { label: "Open Fast · intuitive drills", to: labGamesRoute("fast") },
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

  const thresholdExplanation = details && required != null
    ? `${required} is LOOMA's entry level for ${details.metric.toLowerCase()} in this drill. It is a quality-control rule for comparable results, not a clinical cutoff.`
    : null;

  const handleAction = (action: LockAction) => {
    const destination = action.to;
    if (!destination) return;
    onNavigate?.();
    setTimeout(() => navigate(destination), 150);
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
            <span className="text-[10px] font-medium text-muted-foreground">
              Current
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-foreground">
              {current} / {required}
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
          {thresholdExplanation && (
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
              {thresholdExplanation}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
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
