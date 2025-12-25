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

  const centerX = 90;
  const centerY = 90;
  const maxRadius = 70;
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
  const gridCircles = [25, 50, 75, 100];

  return (
    <section className="report-page">
      <h2 className="report-section-title">Meta-Cognitive Metrics</h2>
      <p className="report-subtitle">Granular cognitive skill assessment</p>

      <div className="metacog-section">
        <svg viewBox="0 0 180 180" className="metacog-radar">
          {gridCircles.map((pct) => (
            <circle
              key={pct}
              cx={centerX}
              cy={centerY}
              r={(pct / 100) * maxRadius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          {skills.map((_, i) => (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + maxRadius * Math.cos(i * angleStep - Math.PI / 2)}
              y2={centerY + maxRadius * Math.sin(i * angleStep - Math.PI / 2)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          <path d={pathD} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
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
