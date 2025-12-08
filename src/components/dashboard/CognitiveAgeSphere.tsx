import { useEffect, useState } from "react";

interface CognitiveAgeSphereProps {
  cognitiveAge: number;
  delta: number;
}

export function CognitiveAgeSphere({ cognitiveAge, delta }: CognitiveAgeSphereProps) {
  const [animatedAge, setAnimatedAge] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAge(cognitiveAge * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [cognitiveAge]);

  const isYounger = delta < 0;
  const deltaText = isYounger
    ? `${Math.abs(delta).toFixed(1)} years younger than your chronological age`
    : delta > 0
    ? `${delta.toFixed(1)} years older than your chronological age`
    : "Matching your chronological age";

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent-primary/30 animate-pulse"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main sphere */}
      <div className="relative">
        {/* Outer glow rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 blur-xl scale-125" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 blur-2xl scale-150 animate-pulse" />

        {/* Main circle */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-surface to-background border border-accent-primary/30 flex flex-col items-center justify-center shadow-glow">
          {/* Inner ring */}
          <div className="absolute inset-2 rounded-full border border-accent-secondary/20" />
          <div className="absolute inset-4 rounded-full border border-accent-primary/10" />

          <span className="text-text-secondary text-xs uppercase tracking-widest font-medium mb-1">
            Cognitive Age
          </span>
          <span className="text-4xl sm:text-5xl font-bold text-gradient bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            {animatedAge.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-sm font-medium ${
                isYounger ? "text-success" : delta > 0 ? "text-amber-400" : "text-text-secondary"
              }`}
            >
              {isYounger ? "↓" : delta > 0 ? "↑" : "→"} {Math.abs(delta).toFixed(1)} yrs
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm text-center mt-6 max-w-xs px-4">
        {deltaText}
      </p>
      <p className="text-text-secondary/60 text-xs text-center mt-2 max-w-sm px-4">
        Based on your recent reasoning speed, clarity, decision quality and focus.
      </p>

      {/* Disclaimer */}
      <div className="mt-4 px-4 py-2 rounded-lg bg-surface/50 border border-border/30">
        <p className="text-[10px] text-text-secondary/50 text-center">
          Cognitive Age is an index for training and self-optimization. It is not a medical measurement.
        </p>
      </div>
    </div>
  );
}
