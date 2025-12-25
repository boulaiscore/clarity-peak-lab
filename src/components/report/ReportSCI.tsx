import React from "react";

interface ReportSCIProps {
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_level?: number | null;
    experience_points?: number | null;
    cognitive_readiness_score?: number | null;
    total_sessions?: number;
  };
}

export function ReportSCI({ metrics }: ReportSCIProps) {
  const sci = metrics.cognitive_performance_score ?? 50;
  const level = metrics.cognitive_level ?? 1;
  const xp = metrics.experience_points ?? 0;
  const readiness = metrics.cognitive_readiness_score ?? 50;
  const sessions = metrics.total_sessions ?? 0;

  const getPerformanceLabel = (score: number) => {
    if (score >= 85) return "Elite";
    if (score >= 70) return "High";
    if (score >= 50) return "Moderate";
    return "Developing";
  };

  return (
    <section className="report-page">
      <h2 className="report-section-title">Strategic Cognitive Index</h2>
      <p className="report-subtitle">Composite metric of dual-process integration and performance</p>

      <div className="sci-section">
        <div className="sci-gauge">
          <div className="sci-score">{Math.round(sci)}</div>
          <div className="sci-label">{getPerformanceLabel(sci)}</div>
        </div>

        <div className="sci-grid">
          <div className="sci-stat">
            <span className="sci-stat-value">{level}</span>
            <span className="sci-stat-label">Level</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-value">{xp.toLocaleString()}</span>
            <span className="sci-stat-label">XP</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-value">{Math.round(readiness)}</span>
            <span className="sci-stat-label">Readiness</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-value">{sessions}</span>
            <span className="sci-stat-label">Sessions</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-value">{Math.round(sci / 10)}/10</span>
            <span className="sci-stat-label">Rating</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-value">{sci >= 70 ? "✓" : "—"}</span>
            <span className="sci-stat-label">Elite Path</span>
          </div>
        </div>
      </div>
    </section>
  );
}
