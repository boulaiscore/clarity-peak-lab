import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface OpenAwarenessPhaseProps {
  duration: number;
  onComplete: () => void;
}

/**
 * Open Awareness Phase
 * Observational state without reaction
 * Final message: "Activity stabilized."
 */
export function OpenAwarenessPhase({ duration, onComplete }: OpenAwarenessPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showComplete, setShowComplete] = useState(false);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      // Show completion message briefly before ending
      setShowComplete(true);
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(completeTimer);
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (showComplete) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#06070A]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-3 h-3 rounded-full bg-white/60"
            />
          </div>
          <p className="text-lg font-medium text-white/80">
            Activity stabilized.
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#06070A]">
      {/* Timer */}
      <div className="absolute top-6 right-6 text-sm text-white/30 font-mono">
        {formatTime(timeLeft)}
      </div>
      
      {/* Phase indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-widest">Phase 3/3</span>
      </div>
      
      {/* Open field - subtle radial gradient */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Very subtle expanding rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: "1px solid rgba(255,255,255,0.04)",
            }}
            animate={{
              scale: [1 + i * 0.2, 1.2 + i * 0.2, 1 + i * 0.2],
              opacity: [0.15 - i * 0.04, 0.25 - i * 0.04, 0.15 - i * 0.04],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
        
        {/* Center point - very subtle */}
        <div className="w-2 h-2 rounded-full bg-white/10" />
      </div>
      
      {/* Copy */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-sm text-white/30 text-center max-w-xs"
      >
        Observe without reaction. Let the system settle.
      </motion.p>
    </div>
  );
}
