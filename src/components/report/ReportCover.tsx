import React, { useMemo } from "react";
import { Brain, Activity, Zap, Target } from "lucide-react";

function goalsBadge(goals: string[]) {
  const hasFast = goals?.includes("fast_thinking");
  const hasSlow = goals?.includes("slow_thinking");
  if (hasFast && hasSlow) return "Dual-Process Optimization";
  if (hasFast) return "System 1 Enhancement";
  if (hasSlow) return "System 2 Development";
  return "Integrated Cognitive Training";
}

function getCognitiveProfile(sci: number) {
  if (sci >= 85) return { label: "Elite Performer", tier: "A" };
  if (sci >= 70) return { label: "High Performer", tier: "B" };
  if (sci >= 55) return { label: "Developing", tier: "C" };
  return { label: "Foundation", tier: "D" };
}

export function ReportCover({ profile, metrics, generatedAt }: any) {
  const badge = useMemo(() => goalsBadge(profile.training_goals ?? []), [profile]);
  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const level = metrics.cognitive_level ?? 1;
  const sessions = metrics.total_sessions ?? 0;
  const cogProfile = getCognitiveProfile(sci);
  
  const domains = [
    { name: "System 1", value: metrics.fast_thinking ?? 50, icon: Zap, color: "#ffa726" },
    { name: "System 2", value: metrics.slow_thinking ?? 50, icon: Target, color: "#29b6f6" },
    { name: "Focus", value: metrics.focus_stability ?? 50, icon: Activity, color: "#7e57c2" },
    { name: "Reasoning", value: metrics.reasoning_accuracy ?? 50, icon: Brain, color: "#42a5f5" },
  ];

  // Radar chart setup - increased viewBox for labels
  const centerX = 140;
  const centerY = 140;
  const maxRadius = 70;
  const angleStep = (2 * Math.PI) / domains.length;
  
  const points = domains.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (d.value / 100) * maxRadius;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <section className="report-page report-cover">
      <div className="report-cover-header">
        <div className="report-cover-brand">
          <div className="report-cover-logo">NeuroLoop</div>
          <div className="report-cover-tagline">by SuperHuman Labs</div>
        </div>
        <div className="report-cover-meta">
          <span className="report-cover-version">v2.0</span>
          <span className="report-cover-date">{generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      <div className="report-cover-main">
        <div className="report-cover-icon">
          <Brain size={40} color="#fff" />
        </div>
        <h1 className="report-cover-title">COGNITIVE<br />PERFORMANCE<br />ASSESSMENT</h1>
        <p className="report-cover-subtitle">Evidence-Based Neuropsychological Profile</p>

        <div className="report-cover-user-section">
          <div className="report-cover-user-info">
            <div className="report-cover-tier">Tier {cogProfile.tier}</div>
            <h2>{profile.name ?? "Participant"}</h2>
            <div className="report-cover-user-meta">
              <div className="meta-row">
                <span className="meta-label">Assessment Date</span>
                <span className="meta-value">{generatedAt.toLocaleDateString("en-GB")}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Cognitive Level</span>
                <span className="meta-value">Level {level}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Training Sessions</span>
                <span className="meta-value">{sessions} completed</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Protocol Focus</span>
                <span className="meta-value">{badge}</span>
              </div>
            </div>
          </div>

          <div className="report-cover-chart">
            <svg viewBox="0 0 280 280" className="report-cover-radar">
              {/* Grid circles */}
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
                  strokeDasharray={pct === 50 ? "4,2" : "0"}
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
              {/* Data polygon */}
              <path d={pathD} fill="rgba(0, 137, 123, 0.2)" stroke="#00897b" strokeWidth="2.5" />
              {/* Data points */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill={domains[i].color} stroke="#fff" strokeWidth="2" />
              ))}
              {/* Labels */}
              {domains.map((d, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const lx = centerX + (maxRadius + 35) * Math.cos(angle);
                const ly = centerY + (maxRadius + 35) * Math.sin(angle);
                return (
                  <g key={i}>
                    <text
                      x={lx}
                      y={ly - 8}
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#2d3748"
                    >
                      {d.name}
                    </text>
                    <text
                      x={lx}
                      y={ly + 8}
                      fontSize="13"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={d.color}
                    >
                      {Math.round(d.value)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="report-cover-footer">
          <div className="report-cover-sci">
            <span className="sci-value">{sci}</span>
            <span className="sci-label">SCI Score</span>
          </div>
          <div className="report-cover-classification">
            <span className="class-label">{cogProfile.label}</span>
            <span className="class-desc">Based on {sessions} training sessions</span>
          </div>
          <div className="report-cover-ref">
            <span className="ref-label">Reference Framework</span>
            <span className="ref-value">Kahneman Dual-Process Theory</span>
          </div>
        </div>
      </div>

      <div className="report-cover-disclaimer">
        This assessment is based on cognitive training performance data collected through the NeuroLoop platform.
        Results are for educational and self-improvement purposes only and do not constitute clinical diagnosis.
      </div>
    </section>
  );
}
