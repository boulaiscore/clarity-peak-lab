import React from "react";

interface ReportMetaCognitiveProps {
  metrics: {
    decision_quality?: number;
    clarity_score?: number;
    bias_resistance?: number;
    philosophical_reasoning?: number;
    spatial_reasoning?: number;
    visual_processing?: number;
    reaction_speed?: number;
  };
}

export function ReportMetaCognitive({ metrics }: ReportMetaCognitiveProps) {
  const skills = [
    { name: "Decision Quality", value: metrics.decision_quality ?? 50 },
    { name: "Clarity", value: metrics.clarity_score ?? 50 },
    { name: "Bias Resistance", value: metrics.bias_resistance ?? 50 },
    { name: "Philosophical", value: metrics.philosophical_reasoning ?? 50 },
    { name: "Spatial", value: metrics.spatial_reasoning ?? 50 },
    { name: "Visual", value: metrics.visual_processing ?? 50 },
    { name: "Reaction", value: metrics.reaction_speed ?? 50 },
  ];

  const centerX = 100;
  const centerY = 100;
  const maxRadius = 75;
  const angleStep = (2 * Math.PI) / skills.length;

  const points = skills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (skill.value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <section className="report-page">
      <h2 className="report-section-title">Meta-Cognitive Metrics</h2>
      <p className="report-subtitle">Detailed assessment of granular cognitive skills</p>

      <div className="metacog-section">
        <svg viewBox="0 0 200 200" className="metacog-radar">
          {/* Grid polygons */}
          {[25, 50, 75, 100].map((pct) => (
            <polygon
              key={pct}
              points={skills.map((_, i) => {
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
          {skills.map((_, i) => (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + maxRadius * Math.cos(i * angleStep - Math.PI / 2)}
              y2={centerY + maxRadius * Math.sin(i * angleStep - Math.PI / 2)}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          ))}
          {/* Data polygon */}
          <path d={pathD} fill="rgba(77, 182, 172, 0.25)" stroke="#4db6ac" strokeWidth="2" />
          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4db6ac" />
          ))}
        </svg>

        <div className="metacog-list">
          {skills.map((skill) => (
            <div key={skill.name} className="metacog-item">
              <span className="metacog-name">{skill.name}</span>
              <div className="metacog-bar-container">
                <div className="metacog-bar" style={{ width: `${skill.value}%` }} />
              </div>
              <span className="metacog-value">{Math.round(skill.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}