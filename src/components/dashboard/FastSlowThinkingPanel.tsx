interface FastSlowThinkingPanelProps {
  fastThinkingScore: number;
  slowThinkingScore: number;
}

export function FastSlowThinkingPanel({ fastThinkingScore, slowThinkingScore }: FastSlowThinkingPanelProps) {
  const getInsight = () => {
    if (slowThinkingScore > fastThinkingScore + 10) {
      return "Slow Thinking is your strongest asset.";
    } else if (fastThinkingScore > slowThinkingScore + 10) {
      return "Fast Thinking leads. Balance with deliberate analysis.";
    } else {
      return "Fast and Slow systems are well balanced.";
    }
  };

  const renderGauge = (score: number, label: string, sublabel: string, color: string) => (
    <div className="flex-1 flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="hsl(0, 0%, 12%)"
            strokeWidth="6"
            strokeDasharray="188.5"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - (score / 100) * 188.5 * 0.75}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold text-foreground number-display">{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-foreground mt-2">{label}</span>
      <span className="text-[9px] text-muted-foreground text-center mt-1 px-2 leading-tight">
        {sublabel}
      </span>
    </div>
  );

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30">
      <h3 className="label-uppercase text-center mb-1">
        Fast vs Slow Thinking
      </h3>
      <p className="text-[9px] text-muted-foreground/60 text-center mb-5 uppercase tracking-wider">
        Kahneman Dual-Process
      </p>

      <div className="flex gap-6">
        {renderGauge(
          fastThinkingScore,
          "System 1",
          "Pattern recognition, intuition",
          "hsl(38, 92%, 50%)"
        )}
        
        <div className="w-px bg-border/30 self-stretch" />
        
        {renderGauge(
          slowThinkingScore,
          "System 2",
          "Structured reasoning, analysis",
          "hsl(165, 82%, 51%)"
        )}
      </div>

      {/* Insight */}
      <div className="mt-5 py-2.5 px-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[11px] text-center text-foreground/80">{getInsight()}</p>
      </div>
    </div>
  );
}