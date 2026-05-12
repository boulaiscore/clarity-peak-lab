import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitPlayfieldProps {
  // Angular position on orbit (0-1, where 0.5 = center of band)
  signalPosition: number;
  // Target band boundaries (normalized 0-1, angular)
  bandStart: number;
  bandEnd: number;
  // Is signal currently in band
  inBand: boolean;
  // Distraction state
  showPulse: boolean;
  showGlint: boolean;
  // Progress within act (0-1)
  actProgress: number;
  // Current act (1-3)
  currentAct: number;
  // (kept for API compat — no longer used: orbit is no longer autonomous)
  orbitSpeedMultiplier?: number;
}

export function OrbitPlayfield({
  signalPosition,
  bandStart,
  bandEnd,
  inBand,
  showPulse,
  showGlint,
  actProgress,
  currentAct,
}: OrbitPlayfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Orbit parameters
  const orbitRx = 130;
  const orbitRy = 100;
  const centerX = 160;
  const centerY = 160;

  // Angular position is now driven directly by gameplay state.
  // Map signalPosition (0-1) → angle (0 → 2π).
  const angle = signalPosition * Math.PI * 2;
  const signalX = centerX + orbitRx * Math.cos(angle);
  const signalY = centerY + orbitRy * Math.sin(angle);

  // Band arc path (visible target zone on the orbit)
  const bandPath = useMemo(() => {
    const startAngle = bandStart * Math.PI * 2;
    const endAngle = bandEnd * Math.PI * 2;

    const startX = centerX + orbitRx * Math.cos(startAngle);
    const startY = centerY + orbitRy * Math.sin(startAngle);
    const endX = centerX + orbitRx * Math.cos(endAngle);
    const endY = centerY + orbitRy * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${startX} ${startY} A ${orbitRx} ${orbitRy} 0 ${largeArc} 1 ${endX} ${endY}`;
  }, [bandStart, bandEnd]);

  // Marker for band center (visual anchor for "lock target")
  const bandCenterAngle = ((bandStart + bandEnd) / 2) * Math.PI * 2;
  const targetX = centerX + orbitRx * Math.cos(bandCenterAngle);
  const targetY = centerY + orbitRy * Math.sin(bandCenterAngle);

  return (
    <div
      ref={containerRef}
      className="relative w-[280px] h-[280px] sm:w-80 sm:h-80 mx-auto"
    >
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Glint distraction */}
      {showGlint && (
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute w-[200%] h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45"
            initial={{ x: "-100%", y: "-100%" }}
            animate={{ x: "100%", y: "100%" }}
            transition={{ duration: 0.8, ease: "linear" }}
            style={{ top: "50%", left: "-50%" }}
          />
        </motion.div>
      )}

      {/* Pulse distraction */}
      {showPulse && (
        <>
          <motion.div
            className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 rounded-full border border-violet-400/50"
            initial={{ scale: 0.5, opacity: 0.8, x: -60 }}
            animate={{ scale: 2.5, opacity: 0, x: -60 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 rounded-full border border-violet-400/50"
            initial={{ scale: 0.5, opacity: 0.8, x: 60 }}
            animate={{ scale: 2.5, opacity: 0, x: 60 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </>
      )}

      {/* Main SVG playfield */}
      <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.15)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.45)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.15)" />
          </linearGradient>

          <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Core nucleus */}
        <circle cx={centerX} cy={centerY} r="35" fill="url(#nucleusGradient)" />
        <circle cx={centerX} cy={centerY} r="8" fill="rgba(139, 92, 246, 0.6)" className="animate-pulse" />

        {/* Orbit ring */}
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={orbitRx}
          ry={orbitRy}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2"
          strokeDasharray="8 4"
        />

        {/* Target band */}
        <path
          d={bandPath}
          fill="none"
          stroke="url(#bandGradient)"
          strokeWidth="28"
          strokeLinecap="round"
          className="opacity-80"
        />

        {/* Band glow when locked */}
        {inBand && (
          <path
            d={bandPath}
            fill="none"
            stroke="rgba(34, 211, 238, 0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}

        {/* Target center marker (small tick on band center) */}
        <circle cx={targetX} cy={targetY} r="3" fill="rgba(34, 211, 238, 0.9)" />
      </svg>

      {/* Signal particle — direct render, no spring */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${(signalX / 320) * 100}%`,
          top: `${(signalY / 320) * 100}%`,
          transform: "translate(-50%, -50%)",
          filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))",
          willChange: "left, top",
        }}
      >
        <motion.div
          className={cn(
            "absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2",
            inBand ? "bg-cyan-400/20" : "bg-orange-400/20"
          )}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className={cn(
            "absolute w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg",
            inBand ? "bg-cyan-400 shadow-cyan-400/50" : "bg-orange-400 shadow-orange-400/50"
          )}
        />
        <div
          className={cn(
            "absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2",
            inBand ? "bg-cyan-200" : "bg-orange-200"
          )}
        />
      </div>

      {/* Act label */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider">
          Act {currentAct}/3
        </span>
      </div>

      {/* Act mini progress */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
          style={{ width: `${actProgress * 100}%` }}
        />
      </div>

      {/* Lock state indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <span
          className={cn(
            "text-[10px] font-medium transition-colors",
            inBand ? "text-cyan-400/70" : "text-orange-400/70"
          )}
        >
          {inBand ? "● LOCKED" : "○ DRIFTING"}
        </span>
      </div>
    </div>
  );
}
