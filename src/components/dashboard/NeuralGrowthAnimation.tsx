import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BottleneckResult, SCIBreakdown } from "@/lib/cognitiveNetworkScore";

interface NeuralGrowthAnimationProps {
  cognitiveAgeDelta: number;
  overallCognitiveScore: number;
  sciBreakdown?: SCIBreakdown | null;
  statusText?: string;
  bottleneck?: BottleneckResult | null;
}

function scoreBand(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Ready";
  if (score >= 50) return "Steady";
  if (score >= 35) return "Building";
  return "Starting point";
}

function NetworkFactor({
  code,
  label,
  score,
  weight,
  contribution,
  window,
}: {
  code: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  window: string;
}) {
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3.5">
      <span className="text-[9px] font-semibold tracking-[0.15em] text-primary">{code}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-foreground/85">{label}</p>
        <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-muted-foreground/45">
          {weight}% · {window}
        </p>
      </div>
      <div className="text-right tabular-nums">
        <p className="text-[13px] font-semibold text-foreground/90">{Math.round(score)}</p>
        <p className="text-[8px] text-muted-foreground/50">+{contribution.toFixed(1)}</p>
      </div>
    </div>
  );
}

export function NeuralGrowthAnimation({
  overallCognitiveScore,
  sciBreakdown,
  statusText,
  bottleneck,
}: NeuralGrowthAnimationProps) {
  const navigate = useNavigate();
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const score = Math.max(0, Math.min(100, overallCognitiveScore));
  const offset = circumference - (score / 100) * circumference;
  const actionRoute = bottleneck?.variable === "recovery" ? "/detox-session" : "/neuro-lab";

  return (
    <div className="py-1">
      <div className="relative mx-auto my-2 h-[176px] w-[176px]">
        <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="88" cy="88" r={radius} fill="none" strokeWidth="9" className="stroke-white/[0.055]" />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55">Network</span>
          <span className="mt-1 text-[44px] font-semibold leading-none tabular-nums tracking-[-0.055em] text-foreground">{Math.round(score)}</span>
          <span className="mt-2 text-[10px] font-semibold text-primary">{statusText || scoreBand(score)}</span>
        </div>
      </div>

      {sciBreakdown && (
        <div className="mt-4 divide-y divide-white/[0.055] border-y border-white/[0.055]">
          <NetworkFactor
            code="CP"
            label="Cognitive performance"
            score={sciBreakdown.cognitivePerformance.score}
            weight={50}
            contribution={sciBreakdown.cognitivePerformance.weighted}
            window="current state"
          />
          <NetworkFactor
            code="BE"
            label="Training engagement"
            score={sciBreakdown.behavioralEngagement.score}
            weight={30}
            contribution={sciBreakdown.behavioralEngagement.weighted}
            window="7 days"
          />
          <NetworkFactor
            code="REC"
            label="Recovery"
            score={sciBreakdown.recoveryFactor.score}
            weight={20}
            contribution={sciBreakdown.recoveryFactor.weighted}
            window="today"
          />
        </div>
      )}

      {bottleneck && bottleneck.potentialGain > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] bg-white/[0.035] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Current lever</p>
            <p className="mt-1 truncate text-[11px] font-medium text-foreground/85">{bottleneck.actionLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(actionRoute)}
            className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:text-foreground"
          >
            Act →
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[8px] leading-relaxed text-muted-foreground/45">
          Personal performance signal · not an intelligence measure
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <button className="shrink-0 text-[9px] font-medium text-muted-foreground/60 hover:text-foreground">Method</button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Performance Network</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>The score combines cognitive performance (50%), weekly training engagement (30%) and current recovery (20%).</p>
              <p>Use the direction against your own baseline. It is not a clinical or intelligence measure.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
