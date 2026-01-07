import { useState, useRef, useCallback, useEffect } from "react";
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const startHold = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault(); // Prevent scrolling on mobile
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        stopHold();
        // Strong haptic on complete
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
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
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Prevent context menu on long press (mobile)
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    const preventContextMenu = (e: Event) => e.preventDefault();
    button.addEventListener('contextmenu', preventContextMenu);
    
    return () => {
      button.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      className={`relative w-full h-14 rounded-2xl font-semibold text-sm overflow-hidden select-none touch-none ${
        disabled 
          ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10" 
          : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white active:scale-[0.98]"
      } ${className}`}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      onTouchCancel={stopHold}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Progress overlay */}
      <motion.div
        className="absolute inset-0 bg-white/25"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        style={{ transformOrigin: "left" }}
      />
      
      {/* Glow effect when holding */}
      {isHolding && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-teal-400/30 to-cyan-400/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap">
        <motion.div
          animate={isHolding ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, repeat: isHolding ? Infinity : 0 }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
        <span>{isHolding ? "Hold..." : "Complete"}</span>
      </div>

      {/* Circular progress indicator - larger for mobile */}
      {isHolding && (
        <motion.svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10"
          viewBox="0 0 36 36"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="white"
            strokeWidth="3"
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
