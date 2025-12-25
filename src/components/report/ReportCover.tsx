import React, { useMemo } from "react";
import { Brain } from "lucide-react";

function goalsBadge(goals: string[]) {
  const hasFast = goals?.includes("fast_thinking");
  const hasSlow = goals?.includes("slow_thinking");
  if (hasFast && hasSlow) return "Balanced Thinker";
  if (hasFast) return "Fast Thinker";
  if (hasSlow) return "Deep Thinker";
  return "Adaptive Learner";
}

function getRiskLevel(score: number) {
  if (score >= 70) return { label: "LOW RISK", color: "#81c784" };
  if (score >= 50) return { label: "MODERATE RISK", color: "#ffb74d" };
  return { label: "HIGH RISK", color: "#e57373" };
}

export function ReportCover({ profile, metrics, generatedAt }: any) {
  const badge = useMemo(() => goalsBadge(profile.training_goals ?? []), [profile]);
  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const level = metrics.cognitive_level ?? 1;
  
  const domains = [
    { name: "Fast Thinking", score: metrics.fast_thinking ?? 50 },
    { name: "Slow Thinking", score: metrics.slow_thinking ?? 50 },
    { name: "Focus", score: metrics.focus_stability ?? 50 },
    { name: "Reasoning", score: metrics.reasoning_accuracy ?? 50 },
  ];

  // Radar chart points
  const centerX = 90;
  const centerY = 90;
  const maxRadius = 70;
  const angleStep = (2 * Math.PI) / domains.length;
  
  const points = domains.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (d.score / 100) * maxRadius;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <section className="report-page report-cover">
      <div className="report-cover-header">
        <div className="report-cover-logo">NeuroLoop Pro</div>
        <div className="report-cover-date">{generatedAt.toLocaleDateString("en-GB")}</div>
      </div>

      <div className="report-cover-main">
        <div className="report-cover-icon">
          <Brain size={32} color="#fff" />
        </div>
        <h1 className="report-cover-title">GENERAL COGNITIVE<br />ASSESSMENT</h1>
        <p className="report-cover-subtitle">RESULTS REPORT</p>

        <div className="report-cover-user-section">
          <div className="report-cover-user-info">
            <h2>{profile.name ?? "User"}</h2>
            <div className="report-cover-user-meta">
              DATE OF ASSESSMENT: {generatedAt.toLocaleDateString("en-GB")}<br />
              COGNITIVE LEVEL: {level}<br />
              TRAINING FOCUS: {badge}
            </div>
          </div>

          <svg viewBox="0 0 180 180" className="report-cover-radar">
            {/* Grid */}
            {[25, 50, 75, 100].map((pct) => (
              <polygon
                key={pct}
                points={domains.map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const r = (pct / 100) * maxRadius;
                  return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
                }).join(" ")}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
            {/* Axes */}
            {domains.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + maxRadius * Math.cos(angle)}
                  y2={centerY + maxRadius * Math.sin(angle)}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              );
            })}
            {/* Data */}
            <path d={pathD} fill="rgba(77, 182, 172, 0.3)" stroke="#4db6ac" strokeWidth="2" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4db6ac" />
            ))}
            {/* Labels */}
            {domains.map((d, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const lx = centerX + (maxRadius + 20) * Math.cos(angle);
              const ly = centerY + (maxRadius + 20) * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={lx}
                  y={ly}
                  fontSize="8"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#718096"
                >
                  {d.name}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="report-cover-legend">
          <div className="legend-item">
            <div className="legend-dot low" />
            <span>LOW RISK</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot moderate" />
            <span>MODERATE RISK</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot high" />
            <span>HIGH RISK</span>
          </div>
        </div>
      </div>
    </section>
  );
}