import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Battery, BookMarked, Dumbbell } from "lucide-react";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { useEffect } from "react";

type Step = {
  key: "train" | "learn" | "repeat";
  label: string;
  Icon: typeof Dumbbell;
  angleDeg: number;
};

const STEPS: Step[] = [
  { key: "train", label: "Train", Icon: Dumbbell, angleDeg: 100 }, // SW
  { key: "learn", label: "Learn", Icon: BookMarked, angleDeg: -140 }, // NW
];

function polarToPercent(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  return { left: `${x}%`, top: `${y}%` };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const delta = (((endDeg - startDeg) % 360) + 360) % 360;
  const largeArcFlag = delta > 180 ? 1 : 0;
  const sweepFlag = 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// Helper to interpolate HSL colors based on rotation
// Full cycle: recover (green) -> train (yellow) -> reason (orange/red) -> recover (back to green)
function getRecoverColor(rotationDeg: number): string {
  // Normalize rotation to 0-360
  const rot = ((rotationDeg % 360) + 360) % 360;
  
  // Gap starts at recover (-20° = 340°), moves clockwise
  // Key positions (where gap center arrives):
  // - 0° rotation: gap at recover (340°) - GREEN
  // - ~120° rotation: gap at train (100°) - gap has left recover, heading to train - YELLOW
  // - ~240° rotation: gap at reason (220°) - ORANGE/RED  
  // - ~360° rotation: gap back at recover - transitioning back to GREEN
  
  // Phase 1: 0-30° - Recover is active, bright green fading slightly
  // Phase 2: 30-150° - Traveling through train zone, green -> yellow
  // Phase 3: 150-280° - Traveling through reason zone, yellow -> orange -> red
  // Phase 4: 280-360° - Approaching recover, red -> orange -> yellow -> green
  
  let hue: number;
  let saturation = 85;
  let lightness = 50;
  
  if (rot < 30) {
    // Just left recover - still bright green, slowly starting to fade
    hue = 140 - (rot / 30) * 20; // 140 -> 120
    saturation = 85;
    lightness = 50 - (rot / 30) * 5; // 50 -> 45
  } else if (rot < 150) {
    // Train zone - green/yellow fading to yellow
    const t = (rot - 30) / 120;
    hue = 120 - t * 60; // 120 -> 60 (yellow)
    saturation = 85 - t * 10; // slightly desaturate
    lightness = 45;
  } else if (rot < 280) {
    // Reason zone - yellow to orange to red
    const t = (rot - 150) / 130;
    hue = 60 - t * 60; // 60 -> 0 (red)
    saturation = 75;
    lightness = 45;
  } else {
    // Approaching recover - red transitioning back to green
    const t = (rot - 280) / 80; // 0 to 1 as we approach recover
    // Transition from red (0) through orange/yellow back to green (140)
    // Use a curve that goes: red -> orange -> yellow -> green
    hue = t * 140; // 0 -> 140
    saturation = 75 + t * 10; // 75 -> 85
    lightness = 45 + t * 5; // 45 -> 50
  }
  
  return `hsl(${Math.max(0, Math.min(140, hue))}, ${saturation}%, ${lightness}%)`;
}

// Determine which icon is "active" based on gap position
function getActiveIcon(rotationDeg: number): "recover" | "train" | "reason" {
  const rot = ((rotationDeg % 360) + 360) % 360;
  
  // Based on where the gap is in its rotation:
  // 0-40°: recover zone (gap near recover)
  // 40-160°: train zone (gap near train)
  // 160-280°: reason zone (gap near reason)
  // 280-360°: approaching recover again
  
  if (rot < 40 || rot >= 320) {
    return "recover";
  } else if (rot >= 40 && rot < 160) {
    return "train";
  } else {
    return "reason";
  }
}

export function LoomaTrainingLoop() {
  const cx = 50;
  const cy = 50;
  const r = 42;

  const recoverAngle = -20;
  const gapDeg = 70;

  const startDeg = recoverAngle + gapDeg / 2;
  const endDeg = recoverAngle - gapDeg / 2 + 360;

  const loopD = arcPath(cx, cy, r, startDeg, endDeg);
  const recoverPos = polarToPercent(cx, cy, r, recoverAngle);

  // Motion value for rotation (0 to 360)
  const rotation = useMotionValue(0);
  
  // Derive which icon is active
  const activeIcon = useTransform(rotation, (r) => getActiveIcon(r));
  
  // Derive recover color based on rotation progress - now gradual throughout
  const recoverColor = useTransform(rotation, (r) => getRecoverColor(r));

  // Animate rotation continuously
  useEffect(() => {
    const controls = animate(rotation, 360, {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    });
    return controls.stop;
  }, [rotation]);

  return (
    <div className="py-6 pl-8 pr-4 flex flex-col items-center overflow-hidden ml-1">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Rotating arc only - z-0 to stay behind icons */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ rotate: rotation }}
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
            <path d={loopD} fill="none" stroke="url(#loomaLoopGradient)" strokeWidth="2.25" strokeLinecap="round" />

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
        <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={recoverPos}>
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-full bg-background flex items-center justify-center"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: recoverColor,
                boxShadow: useTransform(recoverColor, (c) => `0 0 15px ${c}40`),
              }}
            >
              <motion.div style={{ color: recoverColor }}>
                <Battery className="w-5 h-5" />
              </motion.div>
            </motion.div>
            <motion.span 
              className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 text-[7px] font-bold uppercase tracking-wider max-w-[80px]"
              style={{ color: recoverColor }}
            >
              Recover
              <motion.span 
                className="block font-normal normal-case tracking-normal text-[8px] mt-0.5"
                style={{ color: useTransform(recoverColor, (c) => c.replace('50%)', '35%)')) }}
              >
                Digital detox or walk
              </motion.span>
            </motion.span>
          </div>
        </div>

        {/* Train icon */}
        <motion.div 
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2" 
          style={polarToPercent(cx, cy, r, 100)}
        >
          <div className="relative">
            <motion.div
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: useTransform(activeIcon, (icon) => 
                  icon === "train" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                ),
                boxShadow: useTransform(activeIcon, (icon) => 
                  icon === "train" ? "0 0 20px rgba(59, 130, 246, 0.5)" : "0 0 10px rgba(59, 130, 246, 0.1)"
                ),
              }}
            >
              <motion.div
                style={{
                  color: useTransform(activeIcon, (icon) => 
                    icon === "train" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                  ),
                }}
              >
                <Dumbbell className="w-4 h-4" />
              </motion.div>
            </motion.div>
            <motion.span 
              className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider whitespace-nowrap text-center"
              style={{
                color: useTransform(activeIcon, (icon) => 
                  icon === "train" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                ),
              }}
            >
              Train
              <motion.span 
                className="block font-normal normal-case tracking-normal text-[8px] mt-0.5"
                style={{
                  color: useTransform(activeIcon, (icon) => 
                    icon === "train" ? "hsl(210, 100%, 50%)" : "hsl(210, 40%, 40%)"
                  ),
                }}
              >
                Boost Readiness & Sharpness
              </motion.span>
            </motion.span>
          </div>
        </motion.div>

        {/* Reason icon */}
        <motion.div 
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2" 
          style={polarToPercent(cx, cy, r, -140)}
        >
          <div className="relative">
            <motion.div
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: useTransform(activeIcon, (icon) => 
                  icon === "reason" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                ),
                boxShadow: useTransform(activeIcon, (icon) => 
                  icon === "reason" ? "0 0 20px rgba(59, 130, 246, 0.5)" : "0 0 10px rgba(59, 130, 246, 0.1)"
                ),
              }}
            >
              <motion.div
                style={{
                  color: useTransform(activeIcon, (icon) => 
                    icon === "reason" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                  ),
                }}
              >
                <BookMarked className="w-4 h-4" />
              </motion.div>
            </motion.div>
            <motion.span
              className="absolute right-full top-1/3 mr-1.5 -translate-y-1/2 text-[7px] font-bold uppercase tracking-wider w-[90px] text-right"
              style={{
                color: useTransform(activeIcon, (icon) => 
                  icon === "reason" ? "hsl(210, 100%, 60%)" : "hsl(210, 40%, 50%)"
                ),
              }}
            >
              REASON
              <motion.span
                className="block mt-0.5 text-[8px] font-normal normal-case tracking-normal leading-tight"
                style={{
                  color: useTransform(activeIcon, (icon) => 
                    icon === "reason" ? "hsl(210, 100%, 50%)" : "hsl(210, 40%, 40%)"
                  ),
                }}
              >
                Quality time with
                <span className="block">books &amp; podcasts</span>
              </motion.span>
            </motion.span>
          </div>
        </motion.div>

        {/* Center: LOOMA Logo */}
        <div className="relative z-10 flex items-center justify-center">
          <LoomaLogo size={32} className="text-foreground/80" />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center mt-8 uppercase tracking-wider">The LOOMA Loop</p>
    </div>
  );
}