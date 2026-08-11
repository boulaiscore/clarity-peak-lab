import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
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

interface NetworkNode {
  x: number;
  y: number;
  radius: number;
}

const NETWORK_NODES: NetworkNode[] = [
  { x: 75, y: 36, radius: 2.2 }, { x: 105, y: 27, radius: 1.8 }, { x: 137, y: 30, radius: 2.6 },
  { x: 165, y: 41, radius: 2.0 }, { x: 54, y: 53, radius: 2.5 }, { x: 91, y: 51, radius: 1.9 },
  { x: 121, y: 48, radius: 3.0 }, { x: 151, y: 55, radius: 2.2 }, { x: 184, y: 60, radius: 2.7 },
  { x: 40, y: 78, radius: 1.9 }, { x: 70, y: 72, radius: 2.8 }, { x: 101, y: 70, radius: 2.1 },
  { x: 134, y: 74, radius: 2.5 }, { x: 166, y: 78, radius: 1.8 }, { x: 201, y: 84, radius: 2.4 },
  { x: 33, y: 106, radius: 2.5 }, { x: 61, y: 98, radius: 1.8 }, { x: 91, y: 99, radius: 2.7 },
  { x: 122, y: 101, radius: 2.0 }, { x: 151, y: 103, radius: 3.0 }, { x: 181, y: 106, radius: 2.1 },
  { x: 207, y: 112, radius: 2.6 }, { x: 45, y: 130, radius: 2.0 }, { x: 73, y: 123, radius: 2.8 },
  { x: 105, y: 127, radius: 1.9 }, { x: 136, y: 125, radius: 2.6 }, { x: 167, y: 128, radius: 2.1 },
  { x: 195, y: 134, radius: 2.7 }, { x: 66, y: 151, radius: 2.4 }, { x: 96, y: 147, radius: 1.8 },
  { x: 126, y: 151, radius: 2.9 }, { x: 156, y: 148, radius: 2.0 }, { x: 178, y: 153, radius: 2.5 },
  { x: 83, y: 86, radius: 1.7 }, { x: 115, y: 87, radius: 2.3 }, { x: 145, y: 89, radius: 1.7 },
  { x: 76, y: 111, radius: 2.1 }, { x: 108, y: 113, radius: 1.6 }, { x: 139, y: 114, radius: 2.2 },
  { x: 170, y: 115, radius: 1.7 },
];

const NETWORK_CONNECTIONS: [number, number][] = (() => {
  const result: [number, number][] = [];
  for (let from = 0; from < NETWORK_NODES.length; from += 1) {
    for (let to = from + 1; to < NETWORK_NODES.length; to += 1) {
      const dx = NETWORK_NODES[from].x - NETWORK_NODES[to].x;
      const dy = NETWORK_NODES[from].y - NETWORK_NODES[to].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 46 && (from * 11 + to * 7) % 5 !== 0) result.push([from, to]);
    }
  }
  return result;
})();

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
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const networkGradientId = `${id}-network-gradient`;
  const networkGlowId = `${id}-network-glow`;
  const score = Math.max(0, Math.min(100, overallCognitiveScore));
  const activeNodeCount = Math.round(14 + score * 0.26);
  const activity = 0.4 + score / 105;
  const pulseDuration = Math.max(1.9, 4.4 - score * 0.025);
  const animatedNodeStride = score >= 75 ? 1 : score >= 50 ? 2 : 3;
  const signalStride = score >= 75 ? 7 : score >= 50 ? 10 : 14;
  const fieldOpacity = Math.min(0.78, 0.2 + score / 150);
  const fieldDuration = Math.max(1.75, 3.35 - score * 0.014);
  const actionRoute = bottleneck?.variable === "recovery" ? "/detox-session" : "/neuro-lab";

  return (
    <div className="py-1">
      <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[radial-gradient(ellipse_at_center,hsl(var(--recovery)/0.09),transparent_69%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
        <div className="relative h-[238px] w-full">
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
            <motion.div
              className="h-[168px] w-[208px] rounded-[48%] bg-[radial-gradient(ellipse_at_center,hsl(var(--success)/0.38),hsl(var(--recovery)/0.16)_48%,transparent_72%)] blur-[15px]"
              animate={reduceMotion ? undefined : {
                opacity: [fieldOpacity * 0.38, fieldOpacity, fieldOpacity * 0.38],
                scale: [0.88, 1.12, 0.88],
              }}
              transition={reduceMotion ? undefined : {
                duration: fieldDuration,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              style={reduceMotion ? { opacity: fieldOpacity * 0.58 } : undefined}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center" aria-hidden="true">
            <motion.div
              className="h-[178px] w-[216px] rounded-[48%] border border-[hsl(var(--recovery)/0.42)] shadow-[0_0_28px_hsl(var(--success)/0.2)]"
              animate={reduceMotion ? undefined : {
                opacity: [0.12, Math.min(0.68, 0.3 + score / 250), 0.12],
                scale: [0.9, 1.08, 0.9],
              }}
              transition={reduceMotion ? undefined : {
                duration: fieldDuration,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
          <svg
            viewBox="0 0 240 180"
            className="relative z-[1] h-full w-full"
            role="img"
            aria-label={`Performance Network score ${Math.round(score)} out of 100`}
          >
            <defs>
              <linearGradient id={networkGradientId} x1="10%" y1="10%" x2="90%" y2="90%">
                <stop offset="0%" stopColor="hsl(var(--recovery))" stopOpacity="0.58" />
                <stop offset="55%" stopColor="hsl(var(--success))" />
                <stop offset="100%" stopColor="hsl(var(--recovery))" stopOpacity="0.72" />
              </linearGradient>
              <filter id={networkGlowId} x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur stdDeviation="2.15" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <path
              d="M120 18 C80 12 44 27 25 57 C9 83 14 121 36 145 C56 167 91 173 120 163 C149 173 184 167 204 145 C226 121 231 83 215 57 C196 27 160 12 120 18Z"
              fill="hsl(var(--recovery))"
              fillOpacity="0.035"
              stroke="hsl(var(--recovery))"
              strokeWidth="1.1"
              strokeOpacity="0.2"
            >
              {!reduceMotion && (
                <animate
                  attributeName="fill-opacity"
                  values={`0.025;${(0.055 + activity * 0.04).toFixed(3)};0.025`}
                  dur={`${(pulseDuration * 1.25).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
              )}
            </path>

            <g filter={`url(#${networkGlowId})`}>
              {NETWORK_CONNECTIONS.map(([from, to], index) => {
                const active = from < activeNodeCount && to < activeNodeCount;
                const baseOpacity = active ? 0.25 + (index % 4) * 0.07 : 0.055;
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={NETWORK_NODES[from].x}
                    y1={NETWORK_NODES[from].y}
                    x2={NETWORK_NODES[to].x}
                    y2={NETWORK_NODES[to].y}
                    stroke={`url(#${networkGradientId})`}
                    strokeWidth={index % 7 === 0 ? 0.9 : 0.55}
                    opacity={baseOpacity}
                  >
                    {!reduceMotion && active && index % 8 === 0 && (
                      <animate
                        attributeName="opacity"
                        values={`${(baseOpacity * 0.45).toFixed(3)};${Math.min(0.82, baseOpacity * (1.25 + activity)).toFixed(3)};${(baseOpacity * 0.45).toFixed(3)}`}
                        dur={`${(pulseDuration + (index % 3) * 0.45).toFixed(2)}s`}
                        begin={`${((index % 7) * 0.19).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </line>
                );
              })}

              {!reduceMotion && NETWORK_CONNECTIONS.map(([from, to], index) => {
                const active = from < activeNodeCount && to < activeNodeCount;
                if (!active || index % signalStride !== 0) return null;
                const start = NETWORK_NODES[from];
                const end = NETWORK_NODES[to];
                return (
                  <circle
                    key={`signal-${from}-${to}`}
                    r={0.95 + score / 210}
                    fill={`url(#${networkGradientId})`}
                    opacity={Math.min(0.95, 0.48 + activity * 0.45)}
                  >
                    <animateMotion
                      path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                      dur={`${(pulseDuration * 0.8 + (index % 4) * 0.28).toFixed(2)}s`}
                      begin={`${((index % 6) * 0.31).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.98;0"
                      dur={`${(pulseDuration * 0.8 + (index % 4) * 0.28).toFixed(2)}s`}
                      begin={`${((index % 6) * 0.31).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}

              {NETWORK_NODES.map((node, index) => {
                const active = index < activeNodeCount;
                return (
                  <g key={`${node.x}-${node.y}`}>
                    {active && index % 8 === 0 && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.radius * 3.1}
                        fill="none"
                        stroke={`url(#${networkGradientId})`}
                        strokeWidth="0.75"
                        opacity="0.34"
                      >
                        {!reduceMotion && (
                          <>
                            <animate
                              attributeName="r"
                              values={`${(node.radius * 1.9).toFixed(2)};${(node.radius * (3.5 + activity * 1.15)).toFixed(2)};${(node.radius * 1.9).toFixed(2)}`}
                              dur={`${(pulseDuration + (index % 4) * 0.35).toFixed(2)}s`}
                              begin={`${((index % 5) * 0.28).toFixed(2)}s`}
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.08;0.62;0.08"
                              dur={`${(pulseDuration + (index % 4) * 0.35).toFixed(2)}s`}
                              begin={`${((index % 5) * 0.28).toFixed(2)}s`}
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={active ? node.radius : node.radius * 0.72}
                      fill={`url(#${networkGradientId})`}
                      opacity={active ? 0.68 + (index % 3) * 0.11 : 0.12}
                    >
                      {!reduceMotion && active && index % animatedNodeStride === 0 && (
                        <>
                          <animate
                            attributeName="r"
                            values={`${(node.radius * 0.92).toFixed(2)};${(node.radius * (1.2 + activity * 0.2)).toFixed(2)};${(node.radius * 0.92).toFixed(2)}`}
                            dur={`${(pulseDuration + (index % 5) * 0.24).toFixed(2)}s`}
                            begin={`${((index % 8) * 0.17).toFixed(2)}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values={`${(0.42 + activity * 0.08).toFixed(2)};${Math.min(1, 0.82 + activity * 0.24).toFixed(2)};${(0.42 + activity * 0.08).toFixed(2)}`}
                            dur={`${(pulseDuration + (index % 5) * 0.24).toFixed(2)}s`}
                            begin={`${((index % 8) * 0.17).toFixed(2)}s`}
                            repeatCount="indefinite"
                          />
                        </>
                      )}
                    </circle>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">Performance Network</span>
            <span className="mt-1.5 text-[46px] font-semibold leading-none tabular-nums tracking-[-0.055em] text-foreground drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">{Math.round(score)}</span>
            <span className="mt-2 rounded-full border border-white/[0.08] bg-background/45 px-2.5 py-1 text-[9px] font-semibold text-[hsl(var(--recovery))] backdrop-blur-sm">
              {statusText || scoreBand(score)}
            </span>
          </div>
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
