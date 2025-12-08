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
    { name: "Critical Thinking", value: criticalThinking, color: "hsl(165, 82%, 51%)" },
    { name: "Clarity", value: clarity, color: "hsl(165, 70%, 40%)" },
    { name: "Focus", value: focus, color: "hsl(38, 92%, 50%)" },
    { name: "Decision Quality", value: decisionQuality, color: "hsl(165, 60%, 35%)" },
    { name: "Creativity", value: creativity, color: "hsl(280, 60%, 50%)" },
    { name: "Philosophical", value: philosophicalReasoning, color: "hsl(200, 70%, 50%)" },
  ];

  const size = 180;
  const strokeWidth = 6;
  const gap = 3;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/30">
      <h3 className="label-uppercase text-center mb-4">
        Performance Profile
      </h3>

      <div className="flex justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {rings.map((ring, index) => {
            const radius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap)) - 8;
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
                  stroke="hsl(0, 0%, 12%)"
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
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
        {rings.map((ring) => (
          <div key={ring.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-[10px] text-muted-foreground">{ring.name}</span>
            </div>
            <span className="text-[11px] font-medium text-foreground number-display">{ring.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}