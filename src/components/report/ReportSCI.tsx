import React from "react";

interface ReportSCIProps {
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_level?: number | null;
    experience_points?: number | null;
    cognitive_readiness_score?: number | null;
  };
}

export function ReportSCI({ metrics }: ReportSCIProps) {
  const sci = metrics.cognitive_performance_score ?? 50;
  const level = metrics.cognitive_level ?? 1;
  const xp = metrics.experience_points ?? 0;
  const readiness = metrics.cognitive_readiness_score ?? 50;

  const getPerformanceLabel = (score: number) => {
    if (score >= 85) return "Elite";
    if (score >= 70) return "High";
    if (score >= 50) return "Moderate";
    return "Developing";
  };

  return (
    <section className="report-page">
      <h2 className="report-section-title">Strategic Cognitive Index</h2>
      <p className="report-subtitle">
        Composite metric of dual-process integration and cognitive performance
      </p>

      <div className="sci-container">
        <div className="sci-gauge">
          <div className="sci-score">{Math.round(sci)}</div>
          <div className="sci-label">{getPerformanceLabel(sci)}</div>
        </div>

        <div className="sci-details">
          <div className="sci-stat">
            <span className="sci-stat-label">Cognitive Level</span>
            <span className="sci-stat-value">{level}</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-label">Experience Points</span>
            <span className="sci-stat-value">{xp.toLocaleString()}</span>
          </div>
          <div className="sci-stat">
            <span className="sci-stat-label">Readiness Score</span>
            <span className="sci-stat-value">{Math.round(readiness)}</span>
          </div>
        </div>
      </div>

      <p className="report-footnote">
        SCI = Weighted composite of Fast/Slow thinking integration, domain performance, and training consistency.
      </p>
    </section>
  );
}
