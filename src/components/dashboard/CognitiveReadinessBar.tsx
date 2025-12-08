interface CognitiveReadinessBarProps {
  score: number;
  level: "LOW" | "MODERATE" | "HIGH";
}

export function CognitiveReadinessBar({ score, level }: CognitiveReadinessBarProps) {
  const getHintText = () => {
    switch (level) {
      case "HIGH":
        return "Great window for deep work and complex decisions.";
      case "MODERATE":
        return "Good for routine tasks. Save complex decisions for peak.";
      case "LOW":
        return "Consider rest before demanding cognitive work.";
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case "HIGH":
        return "text-primary";
      case "MODERATE":
        return "text-warning";
      case "LOW":
        return "text-destructive";
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="label-uppercase">Cognitive Readiness</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-foreground number-display">{score}</span>
          <span className={`text-[10px] font-medium uppercase tracking-wider ${getLevelColor()}`}>
            {level}
          </span>
        </div>
      </div>

      {/* Readiness bar */}
      <div className="relative h-2 rounded-full overflow-hidden bg-muted">
        {/* Progress */}
        <div 
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
          style={{ 
            width: `${score}%`,
            background: score >= 70 
              ? 'hsl(165, 82%, 51%)' 
              : score >= 40 
                ? 'hsl(38, 92%, 50%)' 
                : 'hsl(0, 72%, 51%)'
          }}
        />
      </div>

      {/* Zone markers */}
      <div className="flex justify-between mt-1.5 px-0.5">
        <span className="text-[9px] text-muted-foreground/50">0</span>
        <span className="text-[9px] text-muted-foreground/50">100</span>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-muted-foreground/70 text-center mt-3">
        {getHintText()}
      </p>
    </div>
  );
}