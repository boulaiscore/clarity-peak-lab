import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { buildObjectivePrep, countdownLabel } from "@/lib/objectivePrep";
import { METRIC_COLORS } from "@/lib/metricColors";
import type { ObjectiveFocus } from "@/config/objectives";

const FOCUS_COLORS: Record<ObjectiveFocus, string> = {
  sharpness: METRIC_COLORS.sharpness,
  reasoning: METRIC_COLORS.reasoningQuality,
  readiness: METRIC_COLORS.readiness,
  recovery: METRIC_COLORS.recovery,
};

interface ObjectivePrepCardProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  visible: boolean;
}

export function ObjectivePrepCard({
  sharpness,
  readiness,
  recovery,
  reasoningQuality,
  visible,
}: ObjectivePrepCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const plan = useMemo(
    () =>
      buildObjectivePrep({
        kind: user?.objectiveKind,
        label: user?.objectiveLabel,
        date: user?.objectiveDate,
        sharpness,
        readiness,
        recovery,
        reasoningQuality,
      }),
    [
      user?.objectiveKind,
      user?.objectiveLabel,
      user?.objectiveDate,
      sharpness,
      readiness,
      recovery,
      reasoningQuality,
    ],
  );

  if (!visible || !plan) return null;

  const color = FOCUS_COLORS[plan.focus];

  return (
    <section
      className="border-b border-white/[0.06] px-4 py-4"
      aria-label="What you are preparing for"
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
          Preparing for
        </span>
        <span className="ml-auto text-[8px] font-medium uppercase tracking-[0.1em] text-muted-foreground/45">
          {plan.phaseLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium leading-snug text-foreground/95">{plan.label}</span>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color }}>
          {countdownLabel(plan.daysUntil)}
        </span>
      </div>

      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
        It needs {plan.demand}. {plan.phaseGuidance}
      </p>

      <button
        type="button"
        disabled={!plan.move.route}
        onClick={() => plan.move.route && navigate(plan.move.route)}
        className="mt-3 flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left transition-colors enabled:hover:bg-white/[0.05] disabled:cursor-default"
      >
        <span className="min-w-0">
          <span className="block text-[12px] font-semibold text-foreground/92">{plan.move.label}</span>
          <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground/65">
            {plan.move.detail}
          </span>
        </span>
        {plan.move.route && (
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-foreground/45" strokeWidth={2} />
        )}
      </button>
    </section>
  );
}
