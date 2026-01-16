import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AttentionAnchorPhaseProps {
  duration: number;
  onComplete: () => void;
}

/**
 * Attention Anchoring Phase
 * A neutral focal point for attention stabilization
 * No interaction required
 */
export function AttentionAnchorPhase({ duration, onComplete }: AttentionAnchorPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#06070A]">
      {/* Timer */}
      <div className="absolute top-6 right-6 text-sm text-white/30 font-mono">
        {formatTime(timeLeft)}
      </div>
      
      {/* Phase indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-widest">Phase 2/3</span>
      </div>
      
      {/* Central anchor point */}
      <div className="relative">
        {/* Outer subtle ring - very slow pulse */}
        <motion.div
          className="absolute inset-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
          style={{ 
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner anchor dot */}
        <motion.div
          className="w-4 h-4 rounded-full bg-white/20"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Copy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-24 text-sm text-white/30 text-center max-w-xs"
      >
        Fix attention here. Let peripheral noise settle.
      </motion.p>
    </div>
  );
}
