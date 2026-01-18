import { useRef, useEffect, useMemo } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
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
  
  // Convert signal position to angle on ellipse
  const signalAngle = useMotionValue(0);
  const smoothAngle = useSpring(signalAngle, { stiffness: 100, damping: 20 });
  
  // Orbit parameters
  const orbitRx = 130; // horizontal radius
  const orbitRy = 100; // vertical radius (elliptical)
  const centerX = 160;
  const centerY = 160;
  
  // Update signal angle continuously
  useEffect(() => {
    let frame: number;
    let currentAngle = signalAngle.get();
    
    const animate = () => {
      currentAngle += 0.015 * orbitSpeedMultiplier; // Base rotation speed
      if (currentAngle > Math.PI * 2) currentAngle -= Math.PI * 2;
      signalAngle.set(currentAngle);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [orbitSpeedMultiplier, signalAngle]);
  
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
  
  // Signal particle position based on angle + offset from signalPosition
  const signalOffset = (signalPosition - 0.5) * 30; // pixels offset from orbit
  
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
            <feGaussianBlur stdDeviation="3" result="blur" />
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
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
        
        {/* Target band highlight */}
        <path
          d={bandPath}
          fill="none"
          stroke="url(#bandGradient)"
          strokeWidth="24"
          strokeLinecap="round"
          className="opacity-60"
        />
        
        {/* Target band inner edge glow when signal is in band */}
        {inBand && (
          <path
            d={bandPath}
            fill="none"
            stroke="rgba(34, 211, 238, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}
        
        {/* Signal particle */}
        <motion.g filter="url(#signalGlow)">
          <motion.circle
            cx={0}
            cy={0}
            r="8"
            fill={inBand ? "rgb(34, 211, 238)" : "rgb(251, 146, 60)"}
            style={{
              x: useSpring(
                useMotionValue(centerX + (orbitRx + signalOffset) * Math.cos(smoothAngle.get())),
                { stiffness: 200, damping: 25 }
              ),
              y: useSpring(
                useMotionValue(centerY + (orbitRy + signalOffset * 0.77) * Math.sin(smoothAngle.get())),
                { stiffness: 200, damping: 25 }
              ),
            }}
          />
          {/* Signal particle trail */}
          <motion.circle
            cx={0}
            cy={0}
            r="12"
            fill="none"
            stroke={inBand ? "rgba(34, 211, 238, 0.3)" : "rgba(251, 146, 60, 0.3)"}
            strokeWidth="2"
            style={{
              x: useSpring(
                useMotionValue(centerX + (orbitRx + signalOffset) * Math.cos(smoothAngle.get())),
                { stiffness: 150, damping: 20 }
              ),
              y: useSpring(
                useMotionValue(centerY + (orbitRy + signalOffset * 0.77) * Math.sin(smoothAngle.get())),
                { stiffness: 150, damping: 20 }
              ),
            }}
          />
        </motion.g>
      </svg>
      
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
    </div>
  );
}
