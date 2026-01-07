import { useMemo } from "react";
import { motion } from "framer-motion";

interface DetoxWaveformProps {
  className?: string;
  barCount?: number;
}

export function DetoxWaveform({ className = "", barCount = 40 }: DetoxWaveformProps) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      baseHeight: 20 + Math.random() * 60,
      delay: i * 0.03,
      duration: 0.8 + Math.random() * 0.6,
    }));
  }, [barCount]);

  return (
    <div className={`flex items-end justify-center gap-[2px] h-12 ${className}`}>
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-[3px] rounded-full"
          style={{
            background: `linear-gradient(to top, 
              hsl(180, 70%, 45%), 
              hsl(175, 80%, 55%), 
              hsl(50, 90%, 60%)
            )`,
          }}
          initial={{ height: `${bar.baseHeight * 0.3}%` }}
          animate={{
            height: [
              `${bar.baseHeight * 0.3}%`,
              `${bar.baseHeight}%`,
              `${bar.baseHeight * 0.5}%`,
              `${bar.baseHeight * 0.8}%`,
              `${bar.baseHeight * 0.3}%`,
            ],
            opacity: [0.6, 1, 0.7, 0.9, 0.6],
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}
