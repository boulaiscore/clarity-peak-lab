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
    { name: "Decision Quality", value: metrics.decision_quality ?? 50, key: "decision" },
    { name: "Clarity Score", value: metrics.clarity_score ?? 50, key: "clarity" },
    { name: "Bias Resistance", value: metrics.bias_resistance ?? 50, key: "bias" },
    { name: "Philosophical Depth", value: metrics.philosophical_reasoning ?? 50, key: "philosophical" },
    { name: "Spatial Reasoning", value: metrics.spatial_reasoning ?? 50, key: "spatial" },
    { name: "Visual Processing", value: metrics.visual_processing ?? 50, key: "visual" },
    { name: "Reaction Speed", value: metrics.reaction_speed ?? 50, key: "reaction" },
  ];

  // Calculate radar chart points
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  const angleStep = (2 * Math.PI) / skills.length;

  const points = skills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (skill.value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      labelX: centerX + (maxRadius + 25) * Math.cos(angle),
      labelY: centerY + (maxRadius + 25) * Math.sin(angle),
      name: skill.name,
      value: skill.value,
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Grid circles
  const gridCircles = [25, 50, 75, 100];

  return (
    <section className="report-page">
      <h2 className="report-section-title">Meta-Cognitive Metrics</h2>
      <p className="report-subtitle">Granular cognitive skill assessment</p>

      <div className="metacog-container">
        <svg viewBox="0 0 300 300" className="radar-chart">
          {/* Grid circles */}
          {gridCircles.map((pct) => (
            <circle
              key={pct}
              cx={centerX}
              cy={centerY}
              r={(pct / 100) * maxRadius}
              fill="none"
              stroke="var(--report-grid)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Axis lines */}
          {points.map((p, i) => (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + maxRadius * Math.cos(i * angleStep - Math.PI / 2)}
              y2={centerY + maxRadius * Math.sin(i * angleStep - Math.PI / 2)}
              stroke="var(--report-grid)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}

          {/* Data polygon */}
          <path d={pathD} fill="var(--report-accent)" fillOpacity="0.3" stroke="var(--report-accent)" strokeWidth="2" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--report-accent)" />
          ))}
        </svg>

        <div className="metacog-list">
          {skills.map((skill) => (
            <div key={skill.key} className="metacog-item">
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
