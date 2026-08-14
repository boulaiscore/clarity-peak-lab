import { useId } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Same neural-network animation used in Monitor → Systems (FastSlowBrainMap),
 * rendered as a single hemisphere for the Train (Lab) system cards.
 */

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

interface SystemNetworkVisualProps {
  system: "fast" | "slow";
  score?: number;
}

export function SystemNetworkVisual({ system, score = 78 }: SystemNetworkVisualProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const isFast = system === "fast";
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-grad`;
  const glowId = `${id}-glow`;

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const activeNodeCount = Math.round(7 + normalizedScore * 0.17);
  const activity = 0.38 + normalizedScore / 110;
  const basePulse = Math.max(2, 4.6 - normalizedScore * 0.026);
  const pulseDuration = isFast ? basePulse * 0.55 : basePulse * 1.35;
  const animatedNodeStride = normalizedScore >= 75 ? 1 : normalizedScore >= 50 ? 2 : 3;
  const signalStride = normalizedScore >= 75 ? 7 : normalizedScore >= 50 ? 10 : 14;
  const color = isFast ? "hsl(var(--area-fast))" : "hsl(var(--area-slow))";
  const nodes = LEFT_NODES;

  return (
    <div className="pointer-events-none relative h-[68px] w-[116px] shrink-0" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="28 20 116 124"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g
          opacity={0.5 + normalizedScore / 250}
          filter={`url(#${glowId})`}
          transform={isFast ? undefined : "translate(172 0) scale(-1 1)"}
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
      </svg>
    </div>
  );
}
