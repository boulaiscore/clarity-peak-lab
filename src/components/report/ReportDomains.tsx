import React from "react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportDomainsProps {
  metrics: {
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
  };
}

export function ReportDomains({ metrics, aggregates }: ReportDomainsProps) {
  const domains = [
    {
      name: "Focus Arena",
      key: "focus" as Area,
      score: metrics.focus_stability ?? 50,
      baseline: metrics.baseline_focus ?? null,
      color: "var(--report-focus)",
      description: "Attention stability, reaction speed, visual processing",
    },
    {
      name: "Critical Reasoning",
      key: "reasoning" as Area,
      score: metrics.reasoning_accuracy ?? 50,
      baseline: metrics.baseline_reasoning ?? null,
      color: "var(--report-reasoning)",
      description: "Logic precision, bias resistance, argument clarity",
    },
    {
      name: "Creativity Hub",
      key: "creativity" as Area,
      score: metrics.creativity ?? 50,
      baseline: metrics.baseline_creativity ?? null,
      color: "var(--report-creativity)",
      description: "Divergent thinking, analogical depth, insight speed",
    },
  ];

  const getLevel = (score: number) => {
    if (score >= 85) return "Elite";
    if (score >= 70) return "High";
    if (score >= 50) return "Moderate";
    return "Developing";
  };

  const getDelta = (current: number, baseline: number | null) => {
    if (baseline === null) return null;
    return current - baseline;
  };

  return (
    <section className="report-page">
      <h2 className="report-section-title">Cognitive Domain Breakdown</h2>
      <p className="report-subtitle">Performance across NeuroLab training areas</p>

      <div className="domains-grid">
        {domains.map((domain) => {
          const delta = getDelta(domain.score, domain.baseline);
          const sessions = aggregates.sessionsByArea[domain.key] ?? 0;
          const avgScore = aggregates.avgScoreByArea[domain.key] ?? 0;

          return (
            <div key={domain.key} className="domain-card">
              <div className="domain-header" style={{ borderLeftColor: domain.color }}>
                <h3 className="domain-name">{domain.name}</h3>
                <span className="domain-level">{getLevel(domain.score)}</span>
              </div>

              <div className="domain-score-row">
                <span className="domain-score">{Math.round(domain.score)}</span>
                {delta !== null && (
                  <span className={`domain-delta ${delta >= 0 ? "positive" : "negative"}`}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="domain-bar-container">
                <div
                  className="domain-bar"
                  style={{
                    width: `${Math.min(100, domain.score)}%`,
                    backgroundColor: domain.color,
                  }}
                />
              </div>

              <p className="domain-description">{domain.description}</p>

              <div className="domain-stats">
                <div className="domain-stat">
                  <span className="stat-value">{sessions}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="domain-stat">
                  <span className="stat-value">{Math.round(avgScore)}%</span>
                  <span className="stat-label">Avg Score</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
