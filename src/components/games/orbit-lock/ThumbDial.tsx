import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThumbDialProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function ThumbDial({ value, onChange, disabled, className }: ThumbDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 640);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth < 640;
  
  // Responsive sizing
  const trackLength = isMobile ? 200 : 200; // px - horizontal on mobile, vertical on desktop
  const knobSize = isMobile ? 44 : 48;
  const usableLength = trackLength - knobSize;
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { 
    stiffness: 300, 
    damping: 30,
    mass: 0.5 
  });
  
  // Sync external value to motion
  useEffect(() => {
    if (!isDragging) {
      if (isMobile) {
        // Horizontal: left = 0, right = 1
        const targetX = value * usableLength;
        motionValue.set(targetX);
      } else {
        // Vertical: top = 1, bottom = 0
        const targetY = (1 - value) * usableLength;
        motionValue.set(targetY);
      }
    }
  }, [value, isDragging, usableLength, motionValue, isMobile]);
  
  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    if (isMobile) {
      // Horizontal slider on mobile
      const clientX = 'touches' in event 
        ? (event as TouchEvent).touches[0]?.clientX ?? info.point.x
        : info.point.x;
      
      const relativeX = clientX - rect.left - knobSize / 2;
      const clampedX = Math.max(0, Math.min(usableLength, relativeX));
      const newValue = clampedX / usableLength;
      
      motionValue.set(clampedX);
      onChange(Math.max(0, Math.min(1, newValue)));
    } else {
      // Vertical slider on desktop
      const clientY = 'touches' in event 
        ? (event as TouchEvent).touches[0]?.clientY ?? info.point.y
        : info.point.y;
      
      const relativeY = clientY - rect.top - knobSize / 2;
      const clampedY = Math.max(0, Math.min(usableLength, relativeY));
      const newValue = 1 - (clampedY / usableLength);
      
      motionValue.set(clampedY);
      onChange(Math.max(0, Math.min(1, newValue)));
    }
    
    // Haptic feedback at edges
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (value <= 0.02 || value >= 0.98) {
        navigator.vibrate(10);
      }
    }
  }, [disabled, onChange, usableLength, motionValue, isMobile, knobSize, value]);
  
  const handleDragStart = () => {
    setIsDragging(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mobile: horizontal layout
  if (isMobile) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative flex items-center select-none touch-none",
          className
        )}
        style={{ width: trackLength, height: 56 }}
      >
        {/* Glass track background - horizontal */}
        <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
          {/* Gradient fill showing intensity */}
          <motion.div 
            className="absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-500/40 via-cyan-400/20 to-transparent"
            style={{ width: `${value * 100}%` }}
          />
          
          {/* Track notches */}
          <div className="absolute inset-y-0 left-4 right-4 flex flex-row justify-between items-center py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-1.5 w-0.5 rounded-full bg-white/20" 
              />
            ))}
          </div>
        </div>
        
        {/* Knob - moves horizontally */}
        <motion.div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ 
            x: springValue,
            width: knobSize,
            height: knobSize,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: usableLength }}
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
            <div className={cn(
              "w-4 h-4 rounded-full border-2 transition-colors duration-200",
              isDragging 
                ? "border-cyan-400 bg-cyan-400/20" 
                : "border-white/40 bg-white/5"
            )} />
          </div>
          
          {/* Grip lines - vertical for horizontal slider */}
          <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 flex flex-row gap-1 pointer-events-none">
            <div className="w-px bg-white/10 rounded-full" />
            <div className="w-px bg-white/10 rounded-full" />
            <div className="w-px bg-white/10 rounded-full" />
          </div>
        </motion.div>
        
        {/* Labels */}
        <div className="absolute left-1 -bottom-5 text-[8px] text-cyan-400/60 font-mono">−</div>
        <div className="absolute right-1 -bottom-5 text-[8px] text-cyan-400/60 font-mono">+</div>
      </div>
    );
  }

  // Desktop: vertical layout
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center select-none touch-none",
        className
      )}
      style={{ height: trackLength, width: 56 }}
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
          y: springValue,
          width: knobSize,
          height: knobSize,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: usableLength }}
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
