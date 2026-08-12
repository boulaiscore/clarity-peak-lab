import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CognitiveAgeSphereProps {
  cognitiveAge: number;
  delta: number;
  chronologicalAge?: number;
}

interface AgeNode {
  x: number;
  y: number;
  radius: number;
}

const NODE_COUNT = 68;
const CENTER_X = 140;
const CENTER_Y = 112;

// A deterministic neural ring. Keeping the geometry stable makes the Age,
// Network and Systems views feel like parts of the same instrument.
const AGE_NODES: AgeNode[] = Array.from({ length: NODE_COUNT }, (_, index) => {
  const angle = (index / NODE_COUNT) * Math.PI * 2;
  const bandOffset = ((index * 17) % 29) - 14;
  const organicOffset = Math.sin(angle * 3 + 0.7) * 4 + Math.cos(angle * 5 - 0.3) * 2.5;
  const radius = 83 + bandOffset + organicOffset;

  return {
    x: CENTER_X + Math.cos(angle) * radius * 1.08,
    y: CENTER_Y + Math.sin(angle) * radius * 0.92,
    radius: 1.15 + ((index * 7) % 9) * 0.16,
  };
});

const AGE_CONNECTIONS: [number, number][] = (() => {
  const connections: [number, number][] = [];

  AGE_NODES.forEach((_, index) => {
    connections.push([index, (index + 1) % NODE_COUNT]);
    if (index % 2 === 0) connections.push([index, (index + 2) % NODE_COUNT]);
    if (index % 5 === 0) connections.push([index, (index + 4) % NODE_COUNT]);
  });

  return connections;
})();

function getComparison(cognitiveAge: number, chronologicalAge?: number) {
  if (!chronologicalAge) return null;

  const difference = chronologicalAge - cognitiveAge;
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference < 0.05) {
    return {
      label: "Aligned with chronological age",
      tone: "text-muted-foreground/75",
      direction: "neutral" as const,
    };
  }

  return difference > 0
    ? {
        label: `${absoluteDifference.toFixed(1)} years younger`,
        tone: "text-[hsl(var(--success))]",
        direction: "younger" as const,
      }
    : {
        label: `${absoluteDifference.toFixed(1)} years older`,
        tone: "text-[hsl(var(--area-fast))]",
        direction: "older" as const,
      };
}

export function CognitiveAgeSphere({ cognitiveAge, delta, chronologicalAge }: CognitiveAgeSphereProps) {
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-age-gradient`;
  const glowId = `${id}-age-glow`;
  const softGlowId = `${id}-age-soft-glow`;
  const ringMaskId = `${id}-age-ring-mask`;
  const comparison = getComparison(cognitiveAge, chronologicalAge);
  const ageDifference = chronologicalAge ? cognitiveAge - chronologicalAge : delta;
  const direction = comparison?.direction ?? (ageDifference < -0.05 ? "younger" : ageDifference > 0.05 ? "older" : "neutral");
  const accent = direction === "older" ? "hsl(var(--area-fast))" : "hsl(var(--success))";
  const secondaryAccent = direction === "older" ? "hsl(var(--recovery))" : "hsl(var(--recovery))";
  const pulseDuration = direction === "neutral" ? 3.2 : 2.75;
  const signalStride = direction === "neutral" ? 12 : 9;

  return (
    <div className="overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_center,hsl(var(--recovery)/0.09),transparent_69%)]">
      <div className="relative h-[252px] w-full">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
          <motion.div
            className="h-[196px] w-[226px] rounded-[46%] bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--recovery)/0.19)_53%,hsl(var(--success)/0.32)_67%,transparent_76%)] blur-[13px]"
            animate={reduceMotion ? undefined : {
              opacity: [0.38, 0.9, 0.38],
              scale: [0.91, 1.08, 0.91],
            }}
            transition={reduceMotion ? undefined : {
              duration: pulseDuration,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            style={reduceMotion ? { opacity: 0.62 } : undefined}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center" aria-hidden="true">
          <motion.div
            className="h-[192px] w-[222px] rounded-[47%] border border-[hsl(var(--recovery)/0.45)] shadow-[0_0_34px_hsl(var(--success)/0.2)]"
            animate={reduceMotion ? undefined : {
              opacity: [0.16, 0.68, 0.16],
              scale: [0.92, 1.07, 0.92],
            }}
            transition={reduceMotion ? undefined : {
              duration: pulseDuration,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>

        <motion.svg
          viewBox="0 0 280 224"
          className="relative z-[1] h-full w-full"
          role="img"
          aria-label={`Cognitive Age ${cognitiveAge.toFixed(1)} years`}
          animate={reduceMotion ? undefined : { scale: [0.985, 1.018, 0.985] }}
          transition={reduceMotion ? undefined : {
            duration: pulseDuration,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor={secondaryAccent} stopOpacity="0.62" />
              <stop offset="52%" stopColor={accent} stopOpacity="0.96" />
              <stop offset="100%" stopColor={secondaryAccent} stopOpacity="0.72" />
            </linearGradient>
            <filter id={glowId} x="-55%" y="-55%" width="210%" height="210%">
              <feGaussianBlur stdDeviation="2.15" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id={softGlowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <mask id={ringMaskId}>
              <rect width="280" height="224" fill="black" />
              <path
                d="M140 13 C187 9 228 29 244 66 C260 103 252 151 221 183 C190 214 145 222 102 212 C60 202 29 174 25 133 C20 91 38 47 76 27 C96 17 117 14 140 13Z"
                fill="white"
              />
              <path
                d="M140 69 C171 66 195 82 201 107 C207 133 188 154 158 160 C126 166 94 153 82 130 C69 105 82 82 106 73 C116 69 128 68 140 69Z"
                fill="black"
              />
            </mask>
          </defs>

          <g mask={`url(#${ringMaskId})`}>
            <path
              d="M140 13 C187 9 228 29 244 66 C260 103 252 151 221 183 C190 214 145 222 102 212 C60 202 29 174 25 133 C20 91 38 47 76 27 C96 17 117 14 140 13Z"
              fill={`url(#${gradientId})`}
              fillOpacity="0.105"
            >
              {!reduceMotion && (
                <animate attributeName="fill-opacity" values="0.07;0.19;0.07" dur={`${pulseDuration}s`} repeatCount="indefinite" />
              )}
            </path>

            <ellipse
              cx="139"
              cy="111"
              rx="103"
              ry="91"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="15"
              opacity="0.11"
              filter={`url(#${softGlowId})`}
            />

            <g filter={`url(#${glowId})`}>
              {AGE_CONNECTIONS.map(([from, to], index) => {
                const start = AGE_NODES[from];
                const end = AGE_NODES[to];
                const baseOpacity = 0.16 + (index % 5) * 0.055;
                return (
                  <line
                    key={`${from}-${to}-${index}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={index % 7 === 0 ? 0.95 : 0.58}
                    opacity={baseOpacity}
                  >
                    {!reduceMotion && index % 8 === 0 && (
                      <animate
                        attributeName="opacity"
                        values={`${(baseOpacity * 0.38).toFixed(3)};${Math.min(0.86, baseOpacity * 2.25).toFixed(3)};${(baseOpacity * 0.38).toFixed(3)}`}
                        dur={`${(pulseDuration + (index % 4) * 0.31).toFixed(2)}s`}
                        begin={`${((index % 7) * 0.2).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </line>
                );
              })}

              {!reduceMotion && AGE_CONNECTIONS.map(([from, to], index) => {
                if (index % signalStride !== 0) return null;
                const start = AGE_NODES[from];
                const end = AGE_NODES[to];
                const duration = pulseDuration * 0.7 + (index % 4) * 0.23;
                return (
                  <circle key={`signal-${from}-${to}-${index}`} r="1.65" fill={accent} opacity="0">
                    <animateMotion
                      path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                      dur={`${duration.toFixed(2)}s`}
                      begin={`${((index % 8) * 0.24).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      dur={`${duration.toFixed(2)}s`}
                      begin={`${((index % 8) * 0.24).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}

              {AGE_NODES.map((node, index) => {
                const animated = index % 2 === 0;
                return (
                  <g key={`${node.x}-${node.y}-${index}`}>
                    {index % 9 === 0 && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.radius * 2.7}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth="0.7"
                        opacity="0.32"
                      >
                        {!reduceMotion && (
                          <>
                            <animate
                              attributeName="r"
                              values={`${(node.radius * 1.7).toFixed(2)};${(node.radius * 4.25).toFixed(2)};${(node.radius * 1.7).toFixed(2)}`}
                              dur={`${(pulseDuration + (index % 5) * 0.27).toFixed(2)}s`}
                              begin={`${((index % 6) * 0.22).toFixed(2)}s`}
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.06;0.72;0.06"
                              dur={`${(pulseDuration + (index % 5) * 0.27).toFixed(2)}s`}
                              begin={`${((index % 6) * 0.22).toFixed(2)}s`}
                              repeatCount="indefinite"
                            />
                          </>
                        )}
                      </circle>
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius}
                      fill={`url(#${gradientId})`}
                      opacity={0.62 + (index % 4) * 0.09}
                    >
                      {!reduceMotion && animated && (
                        <>
                          <animate
                            attributeName="r"
                            values={`${(node.radius * 0.82).toFixed(2)};${(node.radius * 1.5).toFixed(2)};${(node.radius * 0.82).toFixed(2)}`}
                            dur={`${(pulseDuration + (index % 6) * 0.19).toFixed(2)}s`}
                            begin={`${((index % 9) * 0.16).toFixed(2)}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.42;1;0.42"
                            dur={`${(pulseDuration + (index % 6) * 0.19).toFixed(2)}s`}
                            begin={`${((index % 9) * 0.16).toFixed(2)}s`}
                            repeatCount="indefinite"
                          />
                        </>
                      )}
                    </circle>
                  </g>
                );
              })}
            </g>
          </g>

          <path
            d="M140 13 C187 9 228 29 244 66 C260 103 252 151 221 183 C190 214 145 222 102 212 C60 202 29 174 25 133 C20 91 38 47 76 27 C96 17 117 14 140 13Z"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.15"
            opacity="0.42"
          />
          <path
            d="M140 69 C171 66 195 82 201 107 C207 133 188 154 158 160 C126 166 94 153 82 130 C69 105 82 82 106 73 C116 69 128 68 140 69Z"
            fill="hsl(var(--background))"
            fillOpacity="1"
            stroke={`url(#${gradientId})`}
            strokeWidth="0.75"
            strokeOpacity="0.12"
          />
        </motion.svg>

        {/*
          Keep the reading area optically still. The animated neural system is
          deliberately confined to the outer ring, as in WHOOP's Age surface,
          so no node, connection or glow can compete with the value.
        */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[108px] w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.045] bg-background shadow-[0_0_26px_16px_hsl(var(--background)),inset_0_1px_0_rgba(255,255,255,0.025)]"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center pb-1 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">Cognitive Age</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[48px] font-semibold leading-none tabular-nums tracking-[-0.055em] text-foreground drop-shadow-[0_2px_14px_rgba(0,0,0,0.72)]">
              {cognitiveAge.toFixed(1)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground/65">years</span>
          </div>
          {comparison && (
            <span className={`mt-2.5 rounded-full border border-white/[0.08] bg-background/55 px-2.5 py-1 text-[9px] font-semibold backdrop-blur-sm ${comparison.tone}`}>
              {comparison.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
