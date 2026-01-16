import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RhythmicBreathingPhaseProps {
  duration: number;
  onComplete: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale";

const BREATH_CYCLE = {
  inhale: 4000, // 4 seconds
  hold: 4000,   // 4 seconds
  exhale: 4000, // 4 seconds
};

/**
 * Rhythmic Breathing Phase
 * Regulation-focused, not relaxation-focused
 * Copy: "Reduce noise. Stabilize activity."
 */
export function RhythmicBreathingPhase({ duration, onComplete }: RhythmicBreathingPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [cycleCount, setCycleCount] = useState(0);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);
  
  // Breathing cycle
  useEffect(() => {
    const cycleDuration = BREATH_CYCLE[breathPhase];
    
    const timer = setTimeout(() => {
      if (breathPhase === "inhale") {
        setBreathPhase("hold");
      } else if (breathPhase === "hold") {
        setBreathPhase("exhale");
      } else {
        setBreathPhase("inhale");
        setCycleCount(c => c + 1);
      }
    }, cycleDuration);
    
    return () => clearTimeout(timer);
  }, [breathPhase]);
  
  const getBreathText = useCallback(() => {
    switch (breathPhase) {
      case "inhale": return "Inhale";
      case "hold": return "Hold";
      case "exhale": return "Release";
    }
  }, [breathPhase]);
  
  const getCircleScale = () => {
    switch (breathPhase) {
      case "inhale": return 1.3;
      case "hold": return 1.3;
      case "exhale": return 1;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#06070A]">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Timer */}
      <div className="absolute top-6 right-6 text-sm text-white/30 font-mono">
        {formatTime(timeLeft)}
      </div>
      
      {/* Phase indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-widest">Phase 1/3</span>
      </div>
      
      {/* Central breathing circle */}
      <motion.div
        className="relative w-48 h-48"
        animate={{ scale: getCircleScale() }}
        transition={{ duration: BREATH_CYCLE[breathPhase] / 1000, ease: "easeInOut" }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        
        {/* Inner filled circle */}
        <motion.div
          className="absolute inset-4 rounded-full bg-white/5"
          animate={{ 
            opacity: breathPhase === "hold" ? 0.15 : 0.05,
          }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={breathPhase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-lg font-medium text-white/80 tracking-wide"
            >
              {getBreathText()}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Copy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-sm text-white/40 text-center"
      >
        Reduce noise. Stabilize activity.
      </motion.p>
      
      {/* Cycle indicator */}
      <div className="absolute bottom-8 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i < cycleCount ? "bg-white/40" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
