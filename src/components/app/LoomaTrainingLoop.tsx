import { motion, useMotionValue, useTransform } from "framer-motion";
import { Battery, BookMarked, Dumbbell } from "lucide-react";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { useEffect, useRef } from "react";

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

// Icon positions (in degrees, 0° = right, clockwise positive in screen coords)
const RECOVER_ANGLE = 340; // -20° normalized
const TRAIN_ANGLE = 100;
const REASON_ANGLE = 220; // -140° normalized

// Gap is 70°, centered at -50° (310°) after rotating icons 30° counter-clockwise
// Leading edge: gapCenter + 35° = -15° = 345° (at rotation 0)
// Trailing edge: gapCenter - 35° = -85° = 275° (at rotation 0)
// 
// Icon positions (rotated 30° counter-clockwise from original):
// - Recover: -20° - 30° = -50° (310°)
// - Train: 100° - 30° = 70°
// - Reason: -140° - 30° = -170° (190°)
//
// Activation points (when trailing edge reaches icon):
// - Recover (310°): R = 310 - 275 = 35°
// - Train (70°): R = 70 - 275 + 360 = 155°  
// - Reason (190°): R = 190 - 275 + 360 = 275°

function getActiveIcon(rotationDeg: number): "recover" | "train" | "reason" {
  const rot = ((rotationDeg % 360) + 360) % 360;
  
  // Active zones based on when trailing edge passes each icon:
  // Recover: [35, 155) - after gap passes recover, until gap passes train
  // Train: [155, 275) - after gap passes train, until gap passes reason
  // Reason: [275, 360) ∪ [0, 35) - after gap passes reason, until gap passes recover
  
  if (rot >= 35 && rot < 155) {
    return "recover";
  } else if (rot >= 155 && rot < 275) {
    return "train";
  } else {
    return "reason"; // [275, 360) ∪ [0, 35)
  }
}

// Recover color follows the full cycle
function getRecoverColor(rotationDeg: number): string {
  const rot = ((rotationDeg % 360) + 360) % 360;
  
  let hue: number;
  let saturation = 85;
  let lightness = 50;
  
  if (rot >= 35 && rot < 155) {
    // Recover zone - starts transitioning from red TO green when trailing edge touches
    const t = (rot - 35) / 120;
    hue = t * 140; // 0 (red) -> 140 (green) - starts red, becomes green
    saturation = 75 + t * 10; // 75 -> 85
    lightness = 45 + t * 5; // 45 -> 50
  } else if (rot >= 155 && rot < 275) {
    // Train zone - green fading to orange
    const t = (rot - 155) / 120;
    hue = 140 - t * 100; // 140 (green) -> 40 (orange)
    saturation = 85 - t * 10; // 85 -> 75
    lightness = 50 - t * 5; // 50 -> 45
  } else if (rot >= 275) {
    // Reason zone (275-360) - orange to red
    const t = (rot - 275) / 85;
    hue = 40 - t * 40; // 40 -> 0 (red)
    saturation = 75;
    lightness = 45;
  } else {
    // Before recover activates (0-35) - stays red
    hue = 0;
    saturation = 75;
    lightness = 45;
  }
  
  return `hsl(${Math.max(0, Math.min(140, hue))}, ${saturation}%, ${lightness}%)`;
}

export function LoomaTrainingLoop() {
  const cx = 50;
  const cy = 50;
  const r = 42;

  const recoverAngle = -45; // Rotated 5° clockwise from -50°
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

  // Animate rotation continuously using requestAnimationFrame for smooth looping
  const lastTimeRef = useRef<number | null>(null);
  const ROTATION_DURATION = 12000; // 12 seconds per full rotation
  
  useEffect(() => {
    let animationId: number;
    
    const animate = (currentTime: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      // Calculate how much to rotate based on time elapsed
      const degreesPerMs = 360 / ROTATION_DURATION;
      const newRotation = (rotation.get() + deltaTime * degreesPerMs) % 360;
      rotation.set(newRotation);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      lastTimeRef.current = null;
    };
  }, [rotation]);

  return (
    <div className="py-6 pl-12 pr-4 flex flex-col items-center overflow-visible ml-1">
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

            {/* Open loop (like LOOMA logo) - white color */}
            <path d={loopD} fill="none" stroke="white" strokeWidth="2.25" strokeLinecap="round" opacity="0.9" />
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

        {/* Train icon - at 75° */}
        <motion.div 
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2" 
          style={polarToPercent(cx, cy, r, 75)}
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

        {/* Reason icon - at -165° */}
        <motion.div 
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2" 
          style={polarToPercent(cx, cy, r, -165)}
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
              className="absolute right-full top-1/3 mr-1.5 -translate-y-1/2 text-[7px] font-bold uppercase tracking-wider w-[70px] text-right"
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
                <span className="block">Quality time with</span>
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