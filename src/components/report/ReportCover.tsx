import React, { useMemo } from "react";
import { Brain } from "lucide-react";

function goalsBadge(goals: string[]) {
  const hasFast = goals?.includes("fast_thinking");
  const hasSlow = goals?.includes("slow_thinking");
  if (hasFast && hasSlow) return "Dual-Process Optimization";
  if (hasFast) return "System 1 Enhancement";
  if (hasSlow) return "System 2 Development";
  return "Integrated Cognitive Training";
}

function getCognitiveProfile(sci: number) {
  if (sci >= 85) return { label: "Elite Performer", risk: "LOW RISK" };
  if (sci >= 70) return { label: "High Performer", risk: "LOW RISK" };
  if (sci >= 55) return { label: "Developing", risk: "MODERATE RISK" };
  return { label: "Foundation", risk: "HIGH RISK" };
}

export function ReportCover({ profile, metrics, generatedAt }: any) {
  const badge = useMemo(() => goalsBadge(profile.training_goals ?? []), [profile]);
  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const level = metrics.cognitive_level ?? 1;
  const sessions = metrics.total_sessions ?? 0;
  const cogProfile = getCognitiveProfile(sci);
  
  // 4 cognitive domains for radar
  const domains = [
    { name: "System 1", value: metrics.fast_thinking ?? 50 },
    { name: "Reasoning", value: metrics.reasoning_accuracy ?? 50 },
    { name: "System 2", value: metrics.slow_thinking ?? 50 },
    { name: "Focus", value: metrics.focus_stability ?? 50 },
  ];

  // Diamond radar chart - 4 axes
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 90;
  
  // Get points for each risk level polygon (diamond shape)
  const getPolygonPoints = (radius: number) => {
    return [
      { x: centerX, y: centerY - radius },           // top
      { x: centerX + radius, y: centerY },           // right
      { x: centerX, y: centerY + radius },           // bottom
      { x: centerX - radius, y: centerY },           // left
    ].map(p => `${p.x},${p.y}`).join(" ");
  };

  // Data polygon based on actual values
  const dataPoints = domains.map((d, i) => {
    const radius = (d.value / 100) * maxRadius;
    if (i === 0) return { x: centerX, y: centerY - radius };           // top
    if (i === 1) return { x: centerX + radius, y: centerY };           // right
    if (i === 2) return { x: centerX, y: centerY + radius };           // bottom
    return { x: centerX - radius, y: centerY };                        // left
  });
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Risk level colors (outer to inner: green → yellow → orange → red)
  const riskLevels = [
    { radius: maxRadius, color: "#7CB342" },      // green - outer
    { radius: maxRadius * 0.75, color: "#C0CA33" }, // lime
    { radius: maxRadius * 0.5, color: "#FDD835" },  // yellow
    { radius: maxRadius * 0.25, color: "#E53935" }, // red - inner
  ];

  return (
    <section className="report-page report-cover-cognifit">
      {/* Teal header banner */}
      <div className="cognifit-header">
        <div className="cognifit-logo">
          <Brain size={28} />
          <span>NeuroLoop</span>
        </div>
        <div className="cognifit-title-section">
          <h1>GENERAL COGNITIVE ASSESSMENT</h1>
          <p>RESULTS REPORT</p>
        </div>
      </div>

      {/* Main content area */}
      <div className="cognifit-content">
        {/* Left side - User info */}
        <div className="cognifit-user-panel">
          <h2 className="cognifit-user-name">{profile.name ?? "Participant"}</h2>
          <div className="cognifit-user-details">
            <div className="detail-row">
              <span className="detail-label">DATE OF ASSESSMENT:</span>
              <span className="detail-value">{generatedAt.toLocaleDateString("en-GB")}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">COGNITIVE LEVEL:</span>
              <span className="detail-value">Level {level}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">TRAINING SESSIONS:</span>
              <span className="detail-value">{sessions}</span>
            </div>
          </div>
        </div>

        {/* Right side - Radar chart */}
        <div className="cognifit-chart-panel">
          <svg viewBox="0 0 300 300" className="cognifit-radar">
            {/* Risk level polygons (diamonds) */}
            {riskLevels.map((level, i) => (
              <polygon
                key={i}
                points={getPolygonPoints(level.radius)}
                fill={level.color}
                stroke="none"
              />
            ))}
            
            {/* User data overlay polygon */}
            <polygon
              points={dataPath}
              fill="rgba(255, 255, 255, 0.3)"
              stroke="#fff"
              strokeWidth="3"
            />
            
            {/* Data points */}
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#2d3748" strokeWidth="2" />
            ))}
            
            {/* Domain labels */}
            <text x={centerX} y={35} textAnchor="middle" className="radar-label">System 1</text>
            <text x={265} y={centerY + 5} textAnchor="middle" className="radar-label">Reasoning</text>
            <text x={centerX} y={275} textAnchor="middle" className="radar-label">System 2</text>
            <text x={35} y={centerY + 5} textAnchor="middle" className="radar-label">Focus</text>
          </svg>

          {/* Legend */}
          <div className="cognifit-legend">
            <div className="legend-item">
              <div className="legend-box user-profile"></div>
              <span>YOUR PROFILE</span>
            </div>
          </div>
          <div className="cognifit-risk-legend">
            <div className="risk-item">
              <div className="risk-box low"></div>
              <span>LOW RISK</span>
            </div>
            <div className="risk-item">
              <div className="risk-box moderate"></div>
              <span>MODERATE RISK</span>
            </div>
            <div className="risk-item">
              <div className="risk-box high"></div>
              <span>HIGH RISK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="cognifit-footer">
        This assessment is based on cognitive training performance data collected through the NeuroLoop platform.
        Results are for educational and self-improvement purposes only.
      </div>
    </section>
  );
}
