import { useRef, useEffect, useMemo } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitPlayfieldProps {
  // Signal position on orbit (0-1, where 0.5 is target band center)
  signalPosition: number;
  // Target band boundaries (normalized 0-1)
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
  // Orbit speed for signal particle (radians per frame approx)
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
  orbitSpeedMultiplier = 1,
}: OrbitPlayfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Orbit parameters
  const orbitRx = 130; // horizontal radius
  const orbitRy = 100; // vertical radius (elliptical)
  const centerX = 160;
  const centerY = 160;
  
  // Convert signal position to angle on ellipse - continuous rotation
  const signalAngle = useMotionValue(0);
  
  // Update signal angle continuously for orbiting effect
  useEffect(() => {
    let frame: number;
    let currentAngle = signalAngle.get();
    
    const animate = () => {
      currentAngle += 0.02 * orbitSpeedMultiplier; // Base rotation speed
      if (currentAngle > Math.PI * 2) currentAngle -= Math.PI * 2;
      signalAngle.set(currentAngle);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [orbitSpeedMultiplier, signalAngle]);
  
  // Signal offset from orbit (based on drift from band center)
  const signalOffset = (signalPosition - 0.5) * 50; // pixels offset from orbit
  
  // Use useTransform to derive x/y from the angle - this updates reactively!
  const signalX = useTransform(signalAngle, (angle) => 
    centerX + (orbitRx + signalOffset) * Math.cos(angle)
  );
  const signalY = useTransform(signalAngle, (angle) => 
    centerY + (orbitRy + signalOffset * 0.77) * Math.sin(angle)
  );
  
  // Smooth springs for the signal position
  const smoothX = useSpring(signalX, { stiffness: 200, damping: 25 });
  const smoothY = useSpring(signalY, { stiffness: 200, damping: 25 });
  
  // Calculate band arc path
  const bandPath = useMemo(() => {
    const startAngle = bandStart * Math.PI * 2;
    const endAngle = bandEnd * Math.PI * 2;
    
    const startX = centerX + orbitRx * Math.cos(startAngle);
    const startY = centerY + orbitRy * Math.sin(startAngle);
    const endX = centerX + orbitRx * Math.cos(endAngle);
    const endY = centerY + orbitRy * Math.sin(endAngle);
    
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
    
    return `M ${startX} ${startY} A ${orbitRx} ${orbitRy} 0 ${largeArc} 1 ${endX} ${endY}`;
  }, [bandStart, bandEnd]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-80 h-80 mx-auto"
    >
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Glint distraction - diagonal sweep */}
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
      
      {/* Pulse distraction - expanding rings from edges */}
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
          {/* Gradient for target band */}
          <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.1)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.3)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.1)" />
          </linearGradient>
          
          {/* Glow filter for signal */}
          <filter id="signalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Core nucleus glow */}
          <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        
        {/* Core nucleus at center */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r="35" 
          fill="url(#nucleusGradient)"
        />
        <circle 
          cx={centerX} 
          cy={centerY} 
          r="8" 
          fill="rgba(139, 92, 246, 0.6)"
          className="animate-pulse"
        />
        
        {/* Orbit ring (thin, semi-transparent) */}
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
        
        {/* Target band highlight */}
        <path
          d={bandPath}
          fill="none"
          stroke="url(#bandGradient)"
          strokeWidth="28"
          strokeLinecap="round"
          className="opacity-70"
        />
        
        {/* Target band inner edge glow when signal is in band */}
        {inBand && (
          <path
            d={bandPath}
            fill="none"
            stroke="rgba(34, 211, 238, 0.8)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}
      </svg>
      
      {/* Signal particle - rendered outside SVG for proper Framer Motion transforms */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))",
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className={cn(
            "absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2",
            inBand ? "bg-cyan-400/20" : "bg-orange-400/20"
          )}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Main signal dot */}
        <div
          className={cn(
            "absolute w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg",
            inBand 
              ? "bg-cyan-400 shadow-cyan-400/50" 
              : "bg-orange-400 shadow-orange-400/50"
          )}
        />
        {/* Inner highlight */}
        <div
          className={cn(
            "absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2",
            inBand ? "bg-cyan-200" : "bg-orange-200"
          )}
        />
      </motion.div>
      
      {/* Act progress indicator (top) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider">
          Act {currentAct}/3
        </span>
      </div>
      
      {/* Mini progress bar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
          style={{ width: `${actProgress * 100}%` }}
        />
      </div>
      
      {/* Drift direction indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <span className={cn(
          "text-[10px] font-medium transition-colors",
          inBand ? "text-cyan-400/70" : "text-orange-400/70"
        )}>
          {inBand ? "● LOCKED" : "○ DRIFTING"}
        </span>
      </div>
    </div>
  );
}
