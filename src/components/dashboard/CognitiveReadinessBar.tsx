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
        return "Good for routine tasks. Save complex decisions for peak readiness.";
      case "LOW":
        return "Consider rest or light cognitive exercises before demanding work.";
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case "HIGH":
        return "text-success";
      case "MODERATE":
        return "text-amber-400";
      case "LOW":
        return "text-red-400";
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/50 border border-border/30 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Cognitive Readiness Today</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground">{score}</span>
          <span className={`text-xs font-medium ${getLevelColor()}`}>({level})</span>
        </div>
      </div>

      {/* Readiness bar */}
      <div className="relative h-4 rounded-full overflow-hidden bg-surface">
        {/* Zone backgrounds */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-red-500/20" />
          <div className="flex-1 bg-amber-500/20" />
          <div className="flex-1 bg-success/20" />
        </div>

        {/* Zone labels */}
        <div className="absolute inset-0 flex text-[8px] font-medium">
          <div className="flex-1 flex items-center justify-center text-red-400/60">LOW</div>
          <div className="flex-1 flex items-center justify-center text-amber-400/60">MODERATE</div>
          <div className="flex-1 flex items-center justify-center text-success/60">HIGH</div>
        </div>

        {/* Indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full shadow-lg transition-all duration-1000"
          style={{ left: `calc(${score}% - 2px)` }}
        />
      </div>

      {/* Zone markers */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-text-secondary/50">0</span>
        <span className="text-[10px] text-text-secondary/50">40</span>
        <span className="text-[10px] text-text-secondary/50">70</span>
        <span className="text-[10px] text-text-secondary/50">100</span>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-text-secondary/60 text-center mt-4">
        {getHintText()}
      </p>
    </div>
  );
}
