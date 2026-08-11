import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DualProcessTrendChart } from "./DualProcessTrendChart";

interface FastSlowBrainMapProps {
  fastScore: number;
  fastBaseline: number;
  fastDelta: number;
  slowScore: number;
  slowBaseline: number;
  slowDelta: number;
}

interface NetworkNode {
  x: number;
  y: number;
  radius: number;
}

const LEFT_NODES: NetworkNode[] = [
  { x: 54, y: 48, radius: 2.2 },
  { x: 70, y: 37, radius: 2.8 },
  { x: 88, y: 31, radius: 1.9 },
  { x: 106, y: 34, radius: 2.4 },
  { x: 124, y: 43, radius: 1.9 },
  { x: 43, y: 68, radius: 2.6 },
  { x: 63, y: 61, radius: 1.8 },
  { x: 82, y: 53, radius: 3.1 },
  { x: 103, y: 55, radius: 2.1 },
  { x: 129, y: 63, radius: 2.5 },
  { x: 37, y: 91, radius: 1.9 },
  { x: 57, y: 83, radius: 2.7 },
  { x: 77, y: 74, radius: 2.2 },
  { x: 98, y: 72, radius: 2.9 },
  { x: 121, y: 82, radius: 2.2 },
  { x: 42, y: 114, radius: 2.3 },
  { x: 64, y: 106, radius: 2.9 },
  { x: 86, y: 96, radius: 1.9 },
  { x: 108, y: 98, radius: 2.6 },
  { x: 128, y: 108, radius: 1.8 },
  { x: 57, y: 131, radius: 2.5 },
  { x: 80, y: 122, radius: 2.0 },
  { x: 101, y: 119, radius: 2.8 },
  { x: 119, y: 130, radius: 2.1 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 5], [0, 6], [1, 2], [1, 6], [1, 7], [2, 3], [2, 7],
  [3, 4], [3, 8], [4, 8], [4, 9], [5, 6], [5, 10], [5, 11], [6, 7],
  [6, 11], [6, 12], [7, 8], [7, 12], [7, 13], [8, 9], [8, 13], [9, 14],
  [10, 11], [10, 15], [11, 12], [11, 15], [11, 16], [12, 13], [12, 16],
  [12, 17], [13, 14], [13, 17], [13, 18], [14, 18], [14, 19], [15, 16],
  [15, 20], [16, 17], [16, 20], [16, 21], [17, 18], [17, 21], [17, 22],
  [18, 19], [18, 22], [18, 23], [19, 23], [20, 21], [21, 22], [22, 23],
  [1, 5], [3, 7], [6, 10], [8, 12], [11, 17], [13, 19], [16, 22],
];

const RIGHT_NODES = LEFT_NODES.map((node) => ({
  ...node,
  x: 300 - node.x,
  radius: node.radius * 1.08,
}));

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreBand(score: number, system: "fast" | "slow") {
  if (score >= 70) return system === "fast" ? "Sharp" : "Deep";
  if (score >= 50) return system === "fast" ? "Reactive" : "Analytical";
  return "Building";
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function NetworkHalf({
  nodes,
  gradientId,
  glowId,
  score,
  reduceMotion,
}: {
  nodes: NetworkNode[];
  gradientId: string;
  glowId: string;
  score: number;
  reduceMotion: boolean;
}) {
  const normalizedScore = clampScore(score);
  const opacity = 0.5 + normalizedScore / 250;
  const scale = 0.92 + normalizedScore / 1250;
  const centerX = nodes === LEFT_NODES ? 82 : 218;
  const activeNodeCount = Math.round(7 + normalizedScore * 0.17);
  const activity = 0.38 + normalizedScore / 110;
  const pulseDuration = Math.max(2, 4.6 - normalizedScore * 0.026);
  const animatedNodeStride = normalizedScore >= 75 ? 1 : normalizedScore >= 50 ? 2 : 3;
  const signalStride = normalizedScore >= 75 ? 7 : normalizedScore >= 50 ? 10 : 14;

  return (
    <g
      opacity={opacity}
      filter={`url(#${glowId})`}
      transform={`translate(${centerX} 84) scale(${scale}) translate(${-centerX} -84)`}
    >
      {CONNECTIONS.map(([from, to], index) => {
        const active = from < activeNodeCount && to < activeNodeCount;
        const baseOpacity = active ? 0.25 + (index % 4) * 0.075 : 0.06;
        return (
          <line
            key={`${from}-${to}-${index}`}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke={`url(#${gradientId})`}
            strokeWidth={index % 5 === 0 ? 1 : 0.65}
            opacity={baseOpacity}
          >
            {!reduceMotion && active && index % 7 === 0 && (
              <animate
                attributeName="opacity"
                values={`${(baseOpacity * 0.44).toFixed(3)};${Math.min(0.84, baseOpacity * (1.25 + activity)).toFixed(3)};${(baseOpacity * 0.44).toFixed(3)}`}
                dur={`${(pulseDuration + (index % 3) * 0.38).toFixed(2)}s`}
                begin={`${((index % 6) * 0.21).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            )}
          </line>
        );
      })}
      {!reduceMotion && CONNECTIONS.map(([from, to], index) => {
        const active = from < activeNodeCount && to < activeNodeCount;
        if (!active || index % signalStride !== 0) return null;
        const start = nodes[from];
        const end = nodes[to];
        const duration = pulseDuration * 0.82 + (index % 4) * 0.25;
        return (
          <circle
            key={`signal-${from}-${to}-${index}`}
            r={0.9 + normalizedScore / 225}
            fill={`url(#${gradientId})`}
          >
            <animateMotion
              path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
              dur={`${duration.toFixed(2)}s`}
              begin={`${((index % 7) * 0.27).toFixed(2)}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.98;0"
              dur={`${duration.toFixed(2)}s`}
              begin={`${((index % 7) * 0.27).toFixed(2)}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
      {nodes.map((node, index) => {
        const active = index < activeNodeCount;
        return (
          <g key={`${node.x}-${node.y}`}>
            {active && index % 7 === 0 && (
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius * 2.7}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="0.7"
                opacity="0.36"
              >
                {!reduceMotion && (
                  <>
                    <animate
                      attributeName="r"
                      values={`${(node.radius * 1.85).toFixed(2)};${(node.radius * (3.35 + activity * 1.15)).toFixed(2)};${(node.radius * 1.85).toFixed(2)}`}
                      dur={`${(pulseDuration + (index % 4) * 0.31).toFixed(2)}s`}
                      begin={`${((index % 5) * 0.25).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.07;0.62;0.07"
                      dur={`${(pulseDuration + (index % 4) * 0.31).toFixed(2)}s`}
                      begin={`${((index % 5) * 0.25).toFixed(2)}s`}
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
              fill={`url(#${gradientId})`}
              opacity={active ? 0.68 + (index % 3) * 0.1 : 0.12}
            >
              {!reduceMotion && active && index % animatedNodeStride === 0 && (
                <>
                  <animate
                    attributeName="r"
                    values={`${(node.radius * 0.92).toFixed(2)};${(node.radius * (1.2 + activity * 0.2)).toFixed(2)};${(node.radius * 0.92).toFixed(2)}`}
                    dur={`${(pulseDuration + (index % 5) * 0.22).toFixed(2)}s`}
                    begin={`${((index % 8) * 0.18).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values={`${(0.42 + activity * 0.08).toFixed(2)};${Math.min(1, 0.82 + activity * 0.24).toFixed(2)};${(0.42 + activity * 0.08).toFixed(2)}`}
                    dur={`${(pulseDuration + (index % 5) * 0.22).toFixed(2)}s`}
                    begin={`${((index % 8) * 0.18).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>
          </g>
        );
      })}
    </g>
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
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const fastGradientId = `${id}-fast-gradient`;
  const slowGradientId = `${id}-slow-gradient`;
  const fastGlowId = `${id}-fast-glow`;
  const slowGlowId = `${id}-slow-glow`;
  const fast = clampScore(fastScore);
  const slow = clampScore(slowScore);
  const difference = fast - slow;
  const absoluteDifference = Math.abs(difference);
  const balance = absoluteDifference <= 10 ? "Balanced" : absoluteDifference <= 25 ? "Slight tilt" : "Imbalanced";
  const balanceDetail = absoluteDifference <= 10
    ? "Fast and deliberate processing are moving together."
    : difference > 0
      ? "Fast processing currently leads."
      : "Deliberate processing currently leads.";
  const balanceActivity = Math.max(0.15, 1 - absoluteDifference / 70);
  const bridgeDuration = Math.max(2, 4.5 - ((fast + slow) / 2) * 0.026);
  const fastFieldOpacity = Math.min(0.78, 0.18 + fast / 150);
  const slowFieldOpacity = Math.min(0.78, 0.18 + slow / 150);
  const fastFieldDuration = Math.max(1.8, 3.5 - fast * 0.015);
  const slowFieldDuration = Math.max(1.8, 3.5 - slow * 0.015);

  return (
    <div className="py-1">
      <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[radial-gradient(ellipse_at_center,hsl(var(--muted)/0.2),transparent_68%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
        <div className="relative h-[224px] w-full">
          <div className="pointer-events-none absolute inset-0 z-0 grid grid-cols-2" aria-hidden="true">
            <div className="flex items-center justify-center">
              <motion.div
                className="h-[142px] w-[132px] rounded-[48%] bg-[radial-gradient(ellipse_at_center,hsl(var(--area-fast)/0.48),hsl(var(--area-fast)/0.13)_54%,transparent_74%)] blur-[13px]"
                animate={reduceMotion ? undefined : {
                  opacity: [fastFieldOpacity * 0.36, fastFieldOpacity, fastFieldOpacity * 0.36],
                  scale: [0.86, 1.14, 0.86],
                }}
                transition={reduceMotion ? undefined : {
                  duration: fastFieldDuration,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={reduceMotion ? { opacity: fastFieldOpacity * 0.56 } : undefined}
              />
            </div>
            <div className="flex items-center justify-center">
              <motion.div
                className="h-[142px] w-[132px] rounded-[48%] bg-[radial-gradient(ellipse_at_center,hsl(var(--area-slow)/0.48),hsl(var(--area-slow)/0.13)_54%,transparent_74%)] blur-[13px]"
                animate={reduceMotion ? undefined : {
                  opacity: [slowFieldOpacity * 0.36, slowFieldOpacity, slowFieldOpacity * 0.36],
                  scale: [0.86, 1.14, 0.86],
                }}
                transition={reduceMotion ? undefined : {
                  duration: slowFieldDuration,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={reduceMotion ? { opacity: slowFieldOpacity * 0.56 } : undefined}
              />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-2" aria-hidden="true">
            {[
              { opacity: fastFieldOpacity, duration: fastFieldDuration, color: "border-[hsl(var(--area-fast)/0.5)]" },
              { opacity: slowFieldOpacity, duration: slowFieldDuration, color: "border-[hsl(var(--area-slow)/0.5)]" },
            ].map((field, index) => (
              <div key={field.color} className="flex items-center justify-center">
                <motion.div
                  className={`h-[148px] w-[136px] rounded-[48%] border ${field.color}`}
                  animate={reduceMotion ? undefined : {
                    opacity: [0.1, Math.min(0.72, field.opacity), 0.1],
                    scale: [0.88, 1.1, 0.88],
                  }}
                  transition={reduceMotion ? undefined : {
                    duration: field.duration + index * 0.24,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </div>
            ))}
          </div>
          <svg
            viewBox="0 0 300 160"
            className="relative z-[1] h-full w-full"
            role="img"
            aria-label={`System 1 score ${fast}; System 2 score ${slow}`}
          >
            <defs>
              <linearGradient id={fastGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--area-fast))" stopOpacity="0.7" />
                <stop offset="100%" stopColor="hsl(var(--area-fast))" />
              </linearGradient>
              <linearGradient id={slowGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--area-slow))" stopOpacity="0.7" />
                <stop offset="100%" stopColor="hsl(var(--area-slow))" />
              </linearGradient>
              <filter id={fastGlowId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id={slowGlowId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.25" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <path
              d="M150 23 C122 18 84 22 58 38 C30 54 23 82 29 107 C35 132 59 145 92 145 C119 145 139 137 150 127"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              opacity="0.08"
            />
            <path
              d="M150 23 C178 18 216 22 242 38 C270 54 277 82 271 107 C265 132 241 145 208 145 C181 145 161 137 150 127"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              opacity="0.08"
            />
            <line x1="150" y1="27" x2="150" y2="127" stroke="hsl(var(--foreground))" strokeWidth="0.7" opacity="0.06" />

            <NetworkHalf
              nodes={LEFT_NODES}
              gradientId={fastGradientId}
              glowId={fastGlowId}
              score={fast}
              reduceMotion={Boolean(reduceMotion)}
            />
            <NetworkHalf
              nodes={RIGHT_NODES}
              gradientId={slowGradientId}
              glowId={slowGlowId}
              score={slow}
              reduceMotion={Boolean(reduceMotion)}
            />

            <g opacity={0.12 + balanceActivity * 0.25} stroke="hsl(var(--foreground))" strokeWidth="0.65">
              {[{ x1: 128, y: 63, x2: 172 }, { x1: 121, y: 82, x2: 179 }, { x1: 128, y: 108, x2: 172 }].map((bridge, index) => (
                <line key={bridge.y} x1={bridge.x1} y1={bridge.y} x2={bridge.x2} y2={bridge.y}>
                  {!reduceMotion && (
                    <animate
                      attributeName="opacity"
                      values={`${(0.18 + balanceActivity * 0.12).toFixed(2)};${Math.min(1, 0.62 + balanceActivity * 0.38).toFixed(2)};${(0.18 + balanceActivity * 0.12).toFixed(2)}`}
                      dur={`${(bridgeDuration + index * 0.42).toFixed(2)}s`}
                      begin={`${(index * 0.31).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              ))}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 items-center pt-1">
            <div className="text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[hsl(var(--area-fast))]">System 1</p>
              <p className="mt-1 text-[34px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-[hsl(var(--area-fast))] drop-shadow-lg">{fast}</p>
              <p className="mt-1.5 text-[9px] text-muted-foreground/60">Baseline {Math.round(fastBaseline)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[hsl(var(--area-slow))]">System 2</p>
              <p className="mt-1 text-[34px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-[hsl(var(--area-slow))] drop-shadow-lg">{slow}</p>
              <p className="mt-1.5 text-[9px] text-muted-foreground/60">Baseline {Math.round(slowBaseline)}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/[0.055] border-t border-white/[0.055] px-4">
          <div className="grid grid-cols-[34px_1fr_auto_auto] items-center gap-2 py-3">
            <span className="text-[9px] font-semibold tracking-[0.16em] text-[hsl(var(--area-fast))]">S1</span>
            <span className="text-[11px] text-foreground/80">Fast processing</span>
            <span className="text-[9px] tabular-nums text-[hsl(var(--area-fast))]">{deltaLabel(fastDelta)}</span>
            <span className="min-w-[54px] text-right text-[10px] font-medium text-muted-foreground/70">{scoreBand(fast, "fast")}</span>
          </div>
          <div className="grid grid-cols-[34px_1fr_auto_auto] items-center gap-2 py-3">
            <span className="text-[9px] font-semibold tracking-[0.16em] text-[hsl(var(--area-slow))]">S2</span>
            <span className="text-[11px] text-foreground/80">Deliberate processing</span>
            <span className="text-[9px] tabular-nums text-[hsl(var(--area-slow))]">{deltaLabel(slowDelta)}</span>
            <span className="min-w-[54px] text-right text-[10px] font-medium text-muted-foreground/70">{scoreBand(slow, "slow")}</span>
          </div>
          <div className="grid grid-cols-[34px_1fr_auto] items-center gap-2 py-3">
            <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground/55">BAL</span>
            <span className="text-[11px] text-foreground/80">{balanceDetail}</span>
            <span className="text-[10px] font-medium text-muted-foreground/70">{balance}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[8px] leading-relaxed text-muted-foreground/45">
        Functional task-performance signals, not fixed cognitive traits.
      </p>

      <DualProcessTrendChart currentS1={fast} currentS2={slow} />
    </div>
  );
}
