import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface HoldToCompleteButtonProps {
  onComplete: () => void;
  holdDuration?: number; // in milliseconds
  disabled?: boolean;
  className?: string;
}

export function HoldToCompleteButton({
  onComplete,
  holdDuration = 1500,
  disabled = false,
  className = "",
}: HoldToCompleteButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = useCallback(() => {
    if (disabled) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        stopHold();
        onComplete();
      }
    }, 16); // ~60fps
  }, [disabled, holdDuration, onComplete]);

  const stopHold = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  return (
    <motion.button
      className={`relative flex-1 h-14 rounded-xl font-medium text-sm overflow-hidden ${
        disabled 
          ? "bg-muted text-muted-foreground cursor-not-allowed" 
          : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
      } ${className}`}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
    >
      {/* Progress overlay */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        style={{ transformOrigin: "left" }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Check className="w-4 h-4" />
        <span>{isHolding ? "Hold..." : "Hold to Complete"}</span>
      </div>

      {/* Circular progress indicator */}
      {isHolding && (
        <motion.svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8"
          viewBox="0 0 36 36"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="100.53"
            strokeDashoffset={100.53 - (100.53 * progress) / 100}
            transform="rotate(-90 18 18)"
          />
        </motion.svg>
      )}
    </motion.button>
  );
}
