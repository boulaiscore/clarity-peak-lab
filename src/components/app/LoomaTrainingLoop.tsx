import { motion } from "framer-motion";
import { Battery, BookMarked, Dumbbell } from "lucide-react";
import { LoomaLogo } from "@/components/ui/LoomaLogo";

type Step = {
  key: "train" | "learn" | "repeat";
  label: string;
  Icon: typeof Dumbbell;
  angleDeg: number;
};

const STEPS: Step[] = [
  { key: "train", label: "Train", Icon: Dumbbell, angleDeg: 100 },      // SW
  { key: "learn", label: "Learn", Icon: BookMarked, angleDeg: -140 },   // NW
];

function polarToPercent(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  return { left: `${x}%`, top: `${y}%` };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // Draw arc from start -> end (clockwise if end > start when normalized)
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const delta = ((endDeg - startDeg) % 360 + 360) % 360;
  const largeArcFlag = delta > 180 ? 1 : 0;
  const sweepFlag = 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function LoomaTrainingLoop() {
  // SVG viewBox is 0..100. Using % positioning maps 1:1 to the viewBox.
  const cx = 50;
  const cy = 50;
  const r = 42;

  // Recover sits at the "end" of the open loop (top-right), like the LOOMA logo dot.
  const recoverAngle = -20;
  const gapDeg = 70;

  const startDeg = recoverAngle + gapDeg / 2;
  const endDeg = recoverAngle - gapDeg / 2 + 360; // ensure positive sweep

  const loopD = arcPath(cx, cy, r, startDeg, endDeg);
  const recoverPos = polarToPercent(cx, cy, r, recoverAngle);

  return (
    <div className="py-6 flex flex-col items-center">
      <div className="relative w-52 h-52 flex items-center justify-center">
        {/* Rotating arc only - z-0 to stay behind icons */}
        <motion.div
          className="absolute inset-0 z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
            {/* Subtle reference circle */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted/20"
              strokeDasharray="3 3"
            />

            {/* Open loop (like LOOMA logo) */}
            <path
              d={loopD}
              fill="none"
              stroke="url(#loomaLoopGradient)"
              strokeWidth="2.25"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="loomaLoopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="35%" stopColor="hsl(210, 80%, 55%)" />
                <stop offset="70%" stopColor="hsl(142, 71%, 45%)" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Static icons on circumference - z-10 to stay above arc */}
        {/* Recover - at the gap end (like LOOMA dot) */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={recoverPos}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-full bg-background border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              animate={{
                boxShadow: [
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                  "0 0 20px rgba(16, 185, 129, 0.4)",
                  "0 0 10px rgba(16, 185, 129, 0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Battery className="w-5 h-5 text-emerald-500" />
            </motion.div>
            <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 text-[7px] font-bold uppercase tracking-wider text-emerald-500">
              Recover
            </span>
          </div>
        </div>

        {/* Other steps placed exactly on circumference */}
        {STEPS.map(({ key, label, Icon, angleDeg }) => {
          const pos = polarToPercent(cx, cy, r, angleDeg);
          return (
            <div
              key={key}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={pos}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-background border-2 border-blue-400/50 flex items-center justify-center shadow-lg shadow-blue-400/10">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>

                {/* Labels positioned based on angle */}
                {key === "train" && (
                  <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider text-blue-400">
                    {label}
                  </span>
                )}
                {key === "learn" && (
                  <span className="absolute left-1/2 bottom-full mb-1 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider text-blue-400">
                    {label}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Center: LOOMA Logo */}
        <div className="relative z-10 flex items-center justify-center">
          <LoomaLogo size={32} className="text-foreground/80" />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center mt-3 uppercase tracking-wider">
        The LOOMA Loop
      </p>
    </div>
  );
}
