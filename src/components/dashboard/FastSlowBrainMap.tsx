import { DualProcessTrendChart } from "./DualProcessTrendChart";

interface FastSlowBrainMapProps {
  fastScore: number;
  fastBaseline: number;
  fastDelta: number;
  slowScore: number;
  slowBaseline: number;
  slowDelta: number;
}

function scoreBand(score: number, system: "fast" | "slow") {
  if (score >= 70) return system === "fast" ? "Sharp" : "Deep";
  if (score >= 50) return system === "fast" ? "Reactive" : "Analytical";
  return "Building";
}

function scoreColor(system: "fast" | "slow") {
  return system === "fast" ? "hsl(var(--area-fast))" : "hsl(var(--area-slow))";
}

function SystemGauge({
  code,
  label,
  score,
  baseline,
  delta,
  system,
}: {
  code: string;
  label: string;
  score: number;
  baseline: number;
  delta: number;
  system: "fast" | "slow";
}) {
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(system);

  return (
    <div className="min-w-0 text-center">
      <div className="relative mx-auto h-[124px] w-[124px]">
        <svg viewBox="0 0 124 124" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="62" cy="62" r={radius} fill="none" strokeWidth="7" className="stroke-white/[0.055]" />
          <circle
            cx="62"
            cy="62"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground/55">{code}</span>
          <span className="mt-1 text-[32px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-foreground">{score}</span>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground/80">{label}</p>
      <p className="mt-1 text-[9px] text-muted-foreground/55">
        Baseline {baseline}
        <span className="mx-1.5 text-muted-foreground/30">·</span>
        <span style={{ color }}>{delta > 0 ? `+${delta}` : delta}</span>
      </p>
    </div>
  );
}

export function FastSlowBrainMap({
  fastScore,
  fastBaseline,
  fastDelta,
  slowScore,
  slowBaseline,
  slowDelta,
}: FastSlowBrainMapProps) {
  const difference = fastScore - slowScore;
  const absoluteDifference = Math.abs(difference);
  const balance = absoluteDifference <= 10 ? "Balanced" : absoluteDifference <= 25 ? "Slight tilt" : "Imbalanced";
  const balanceDetail = absoluteDifference <= 10
    ? "Fast and deliberate processing are moving together."
    : difference > 0
      ? "Fast processing currently leads."
      : "Deliberate processing currently leads.";

  return (
    <div className="py-1">
      <div className="grid grid-cols-2 gap-3 py-3">
        <SystemGauge
          code="S1"
          label="Fast"
          score={fastScore}
          baseline={fastBaseline}
          delta={fastDelta}
          system="fast"
        />
        <SystemGauge
          code="S2"
          label="Deliberate"
          score={slowScore}
          baseline={slowBaseline}
          delta={slowDelta}
          system="slow"
        />
      </div>

      <div className="mt-3 divide-y divide-white/[0.055] border-y border-white/[0.055]">
        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3">
          <span className="text-[9px] font-semibold tracking-[0.16em] text-[hsl(var(--area-fast))]">S1</span>
          <span className="text-[11px] text-foreground/80">Fast processing</span>
          <span className="text-[10px] font-medium text-muted-foreground/70">{scoreBand(fastScore, "fast")}</span>
        </div>
        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3">
          <span className="text-[9px] font-semibold tracking-[0.16em] text-[hsl(var(--area-slow))]">S2</span>
          <span className="text-[11px] text-foreground/80">Deliberate processing</span>
          <span className="text-[10px] font-medium text-muted-foreground/70">{scoreBand(slowScore, "slow")}</span>
        </div>
        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3">
          <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground/55">BAL</span>
          <span className="text-[11px] text-foreground/80">{balanceDetail}</span>
          <span className="text-[10px] font-medium text-muted-foreground/70">{balance}</span>
        </div>
      </div>

      <p className="mt-3 text-center text-[8px] leading-relaxed text-muted-foreground/45">
        Functional task-performance signals, not fixed cognitive traits.
      </p>

      <DualProcessTrendChart currentS1={fastScore} currentS2={slowScore} />
    </div>
  );
}
