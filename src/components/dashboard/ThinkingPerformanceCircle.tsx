interface PerformanceRing {
  name: string;
  value: number;
  color: string;
}

interface ThinkingPerformanceCircleProps {
  criticalThinking: number;
  clarity: number;
  focus: number;
  decisionQuality: number;
  creativity: number;
  philosophicalReasoning: number;
}

export function ThinkingPerformanceCircle({
  criticalThinking,
  clarity,
  focus,
  decisionQuality,
  creativity,
  philosophicalReasoning,
}: ThinkingPerformanceCircleProps) {
  const rings: PerformanceRing[] = [
    { name: "Critical Thinking", value: criticalThinking, color: "#6C5CE7" },
    { name: "Clarity", value: clarity, color: "#4D55FF" },
    { name: "Focus", value: focus, color: "#6FF7B4" },
    { name: "Decision Quality", value: decisionQuality, color: "#F97316" },
    { name: "Creativity", value: creativity, color: "#EC4899" },
    { name: "Philosophical", value: philosophicalReasoning, color: "#8B5CF6" },
  ];

  const size = 200;
  const strokeWidth = 8;
  const gap = 4;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className="p-6 rounded-2xl bg-surface/50 border border-border/30 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4 text-center">
        Thinking Performance Profile
      </h3>

      <div className="flex justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {rings.map((ring, index) => {
            const radius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap)) - 10;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (ring.value / 100) * circumference;

            return (
              <g key={ring.name}>
                {/* Background ring */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={strokeWidth}
                />
                {/* Value ring */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: "stroke-dashoffset 1s ease-out",
                    filter: `drop-shadow(0 0 4px ${ring.color}40)`,
                  }}
                />
              </g>
            );
          })}
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            className="fill-text-secondary text-[10px] font-medium"
            style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
          >
            Weekly
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            className="fill-foreground text-xs font-semibold"
            style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
          >
            Profile
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {rings.map((ring) => (
          <div key={ring.name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ring.color }}
            />
            <span className="text-[10px] text-text-secondary truncate">{ring.name}</span>
            <span className="text-[10px] font-medium text-foreground ml-auto">{ring.value}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-text-secondary/60 text-center mt-4">
        Your cognitive performance profile this week.
      </p>
    </div>
  );
}
