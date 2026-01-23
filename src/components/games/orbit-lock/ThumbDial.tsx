import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ThumbDialProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function ThumbDial({ value, onChange, disabled, className }: ThumbDialProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use spring for smooth, physical feel
  const motionY = useMotionValue(0);
  const springY = useSpring(motionY, { 
    stiffness: 300, 
    damping: 30,
    mass: 0.5 
  });
  
  // Responsive track height
  const trackHeight = isMobile ? 160 : 200; // px
  const knobSize = isMobile ? 40 : 48;
  const usableHeight = trackHeight - knobSize;
  
  // Sync external value to motion
  useEffect(() => {
    if (!isDragging) {
      const targetY = (1 - value) * usableHeight;
      motionY.set(targetY);
    }
  }, [value, isDragging, usableHeight, motionY]);
  
  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientY = 'touches' in event 
      ? (event as TouchEvent).touches[0]?.clientY ?? info.point.y
      : info.point.y;
    
    const relativeY = clientY - rect.top - knobSize / 2;
    const clampedY = Math.max(0, Math.min(usableHeight, relativeY));
    const newValue = 1 - (clampedY / usableHeight);
    
    motionY.set(clampedY);
    onChange(Math.max(0, Math.min(1, newValue)));
    
    // Haptic feedback at edges
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (newValue <= 0.02 || newValue >= 0.98) {
        navigator.vibrate(10);
      }
    }
  }, [disabled, onChange, usableHeight, motionY]);
  
  const handleDragStart = () => {
    setIsDragging(true);
    // Soft haptic on grab
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center select-none touch-none",
        className
      )}
      style={{ height: trackHeight, width: isMobile ? 48 : 56 }}
    >
      {/* Glass track background */}
      <div className="absolute inset-x-2 top-0 bottom-0 rounded-full bg-gradient-to-b from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
        {/* Gradient fill showing intensity */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-cyan-500/40 via-cyan-400/20 to-transparent"
          style={{ height: `${value * 100}%` }}
        />
        
        {/* Track notches */}
        <div className="absolute inset-x-0 top-4 bottom-4 flex flex-col justify-between items-center px-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="w-1.5 h-0.5 rounded-full bg-white/20" 
            />
          ))}
        </div>
      </div>
      
      {/* Knob */}
      <motion.div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ 
          y: springY,
          width: knobSize,
          height: knobSize,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: usableHeight }}
        dragElastic={0.05}
        onDragStart={handleDragStart}
        onDrag={handlePan}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 1.05 }}
      >
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-200",
          isDragging 
            ? "bg-cyan-400/30 shadow-[0_0_24px_4px_rgba(34,211,238,0.3)]" 
            : "bg-transparent"
        )} />
        
        {/* Main knob */}
        <div className={cn(
          "absolute inset-1 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 border border-white/20 shadow-lg",
          "flex items-center justify-center"
        )}>
          {/* Inner circle indicator */}
          <div className={cn(
            "w-4 h-4 rounded-full border-2 transition-colors duration-200",
            isDragging 
              ? "border-cyan-400 bg-cyan-400/20" 
              : "border-white/40 bg-white/5"
          )} />
        </div>
        
        {/* Grip lines */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none">
          <div className="h-px bg-white/10 rounded-full" />
          <div className="h-px bg-white/10 rounded-full" />
          <div className="h-px bg-white/10 rounded-full" />
        </div>
      </motion.div>
      
      {/* Labels */}
      <div className="absolute -right-6 top-1 text-[8px] text-cyan-400/60 font-mono">+</div>
      <div className="absolute -right-6 bottom-1 text-[8px] text-cyan-400/60 font-mono">−</div>
    </div>
  );
}
