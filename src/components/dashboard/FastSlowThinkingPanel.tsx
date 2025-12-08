interface FastSlowThinkingPanelProps {
  fastThinkingScore: number;
  slowThinkingScore: number;
}

export function FastSlowThinkingPanel({ fastThinkingScore, slowThinkingScore }: FastSlowThinkingPanelProps) {
  const getInsight = () => {
    if (slowThinkingScore > fastThinkingScore + 10) {
      return "Your Slow Thinking is currently your strongest asset.";
    } else if (fastThinkingScore > slowThinkingScore + 10) {
      return "Your Fast Thinking leads. Consider balancing with deliberate analysis.";
    } else {
      return "Your Fast and Slow thinking systems are well balanced.";
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/50 border border-border/30 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-1 text-center">
        Fast vs Slow Thinking
      </h3>
      <p className="text-[10px] text-text-secondary/60 text-center mb-6">
        Based on Kahneman's dual-process theory
      </p>

      <div className="flex gap-4">
        {/* Fast Thinking Gauge */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                strokeDasharray="188.5"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Value arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#F97316"
                strokeWidth="10"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (fastThinkingScore / 100) * 188.5}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 1s ease-out",
                  filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.4))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{fastThinkingScore}</span>
            </div>
          </div>
          <span className="text-xs font-medium text-foreground mt-2">System 1</span>
          <span className="text-[10px] text-text-secondary text-center mt-1 px-2">
            Pattern recognition, intuition, snap judgments
          </span>
        </div>

        {/* Divider */}
        <div className="w-px bg-border/30 self-stretch" />

        {/* Slow Thinking Gauge */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                strokeDasharray="188.5"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Value arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#6C5CE7"
                strokeWidth="10"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (slowThinkingScore / 100) * 188.5}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 1s ease-out",
                  filter: "drop-shadow(0 0 6px rgba(108, 92, 231, 0.4))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{slowThinkingScore}</span>
            </div>
          </div>
          <span className="text-xs font-medium text-foreground mt-2">System 2</span>
          <span className="text-[10px] text-text-secondary text-center mt-1 px-2">
            Structured reasoning, deep analysis, deliberate thinking
          </span>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-6 p-3 rounded-xl bg-accent-primary/5 border border-accent-primary/20">
        <p className="text-xs text-center text-foreground/90">{getInsight()}</p>
      </div>
    </div>
  );
}
