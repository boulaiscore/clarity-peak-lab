import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PassiveFeaturePayload } from "@/lib/passiveCoachFeatures";
import { deriveDailyCognitiveState } from "@/lib/dailyCognitiveState";
import { cn } from "@/lib/utils";

interface CognitiveStateCardProps {
  readiness: number;
  recovery: number;
  sharpness: number;
  reasoningQuality: number;
  readinessDelta?: string | null;
  recoveryDelta?: string | null;
  sharpnessDelta?: string | null;
  passiveFeatures: PassiveFeaturePayload | null;
  isLoading: boolean;
  passiveLoading?: boolean;
  isHistorical?: boolean;
  onReadiness?: () => void;
  onRecovery?: () => void;
  onSharpness?: () => void;
}

function StateRing({ value, loading, delta }: { value: number; loading: boolean; delta?: string | null }) {
  const size = 116;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const progress = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div className="relative h-[116px] w-[116px] shrink-0" aria-label={`Readiness ${Math.round(value)} out of 100`}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth={strokeWidth}
          className="opacity-[0.08]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(245 58% 65%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress * circumference}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-medium leading-none tracking-[-0.04em] tabular-nums text-foreground">
          {loading ? "—" : Math.round(value)}
        </span>
        <span className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">
          Readiness
        </span>
        {!loading && delta && (
          <span className="mt-0.5 text-[8px] tabular-nums text-muted-foreground/60">{delta}</span>
        )}
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  delta,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  delta?: string | null;
  accent: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
        {label}
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[18px] font-medium leading-none tabular-nums text-foreground/95">{value}</span>
        {delta && <span className="text-[9px] tabular-nums text-muted-foreground/65">{delta}</span>}
      </span>
      <span className="mt-2 block h-0.5 w-5 rounded-full" style={{ backgroundColor: accent }} />
    </>
  );

  return onClick ? (
    <button onClick={onClick} className="min-w-0 text-left transition-opacity active:opacity-60">
      {content}
    </button>
  ) : (
    <div className="min-w-0">{content}</div>
  );
}

export function CognitiveStateCard({
  readiness,
  recovery,
  sharpness,
  reasoningQuality,
  readinessDelta,
  recoveryDelta,
  sharpnessDelta,
  passiveFeatures,
  isLoading,
  passiveLoading = false,
  isHistorical = false,
  onReadiness,
  onRecovery,
  onSharpness,
}: CognitiveStateCardProps) {
  const navigate = useNavigate();
  const passive = passiveFeatures?.coachContext;
  const state = deriveDailyCognitiveState({
    readiness,
    recovery,
    sharpness,
    reasoningQuality,
    healthScore: passive?.healthScore,
    attentionLoadRatio: passive?.attentionLoadRatio,
    scheduleLoadRatio: passive?.scheduleLoadRatio,
  });
  const availability = passiveFeatures?.availability ?? {};
  const sources = [
    { label: "Health", active: availability.phoneHealth === true || availability.wearable === true },
    { label: "Attention", active: availability.deviceUsage === true },
    { label: "Schedule", active: availability.calendar === true },
    { label: "Training", active: availability.firstPartyBehavior === true },
  ];
  const headline = isLoading ? "Updating your state" : isHistorical ? "Recorded state" : state.headline;
  const summary = isLoading
    ? "Syncing today's signals."
    : isHistorical
      ? "A snapshot from your personal baseline history."
      : state.summary;

  return (
    <section className="mb-5 overflow-hidden rounded-[24px] border border-border/25 bg-card/35">
      <div className="flex items-center gap-5 px-5 pb-5 pt-6">
        <button
          type="button"
          onClick={onReadiness}
          disabled={!onReadiness}
          className="shrink-0 rounded-full transition-opacity enabled:active:opacity-60"
        >
          <StateRing value={readiness} loading={isLoading} delta={readinessDelta} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
            Cognitive state
          </p>
          <h1 className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            {headline}
          </h1>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {summary}
          </p>
          {!isHistorical && !isLoading && (
            <button
              type="button"
              onClick={() => navigate(state.actionRoute)}
              className="mt-4 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground/75 transition-colors hover:text-foreground"
            >
              {state.actionLabel}
              <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border/20 px-5 py-4">
        <MetricCell
          label="Recovery"
          value={isLoading ? "—" : `${Math.round(recovery)}%`}
          delta={recoveryDelta}
          accent="hsl(174 38% 55%)"
          onClick={onRecovery}
        />
        <MetricCell
          label="Sharpness"
          value={isLoading ? "—" : `${Math.round(sharpness)}`}
          delta={sharpnessDelta}
          accent="hsl(210 70% 58%)"
          onClick={onSharpness}
        />
        <MetricCell
          label="Load"
          value={isLoading || passiveLoading ? "—" : isHistorical ? "Recorded" : state.loadLabel}
          accent="hsl(245 45% 62%)"
        />
      </div>

      {!isHistorical && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/20 px-5 py-3">
          {sources.map((source) => (
            <span
              key={source.label}
              className={cn(
                "inline-flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-[0.12em]",
                source.active ? "text-foreground/65" : "text-muted-foreground/35",
              )}
            >
              <span
                className={cn(
                  "h-1 w-1 rounded-full",
                  source.active ? "bg-primary" : "bg-muted-foreground/25",
                )}
              />
              {source.label}
            </span>
          ))}
          <span className="ml-auto text-[8px] text-muted-foreground/45">Personal baseline</span>
        </div>
      )}
    </section>
  );
}
