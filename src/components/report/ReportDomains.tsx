import React from "react";
import { Focus, Brain, Lightbulb, Target, Eye, Gauge, Puzzle, Zap } from "lucide-react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportDomainsProps {
  metrics: {
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
    visual_processing?: number;
    spatial_reasoning?: number;
    reaction_speed?: number;
    clarity_score?: number;
    decision_quality?: number;
    bias_resistance?: number;
    philosophical_reasoning?: number;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
    topExercisesByArea?: Record<Area, { exerciseId: string; count: number }[]>;
  };
}

export function ReportDomains({ metrics, aggregates }: ReportDomainsProps) {
  const domains = [
    {
      name: "Focus Arena",
      key: "focus" as Area,
      score: metrics.focus_stability ?? 50,
      baseline: metrics.baseline_focus ?? null,
      color: "#7e57c2",
      icon: Focus,
      description: "Attention stability, concentration, visual processing",
      subMetrics: [
        { name: "Sustained Attention", score: metrics.focus_stability ?? 50 },
        { name: "Visual Processing", score: metrics.visual_processing ?? 50 },
        { name: "Reaction Speed", score: metrics.reaction_speed ?? 50 },
        { name: "Distractor Inhibition", score: Math.round((metrics.focus_stability ?? 50) * 0.95) },
      ],
      reference: "Posner & Petersen (1990) Attention Network Theory",
    },
    {
      name: "Critical Reasoning",
      key: "reasoning" as Area,
      score: metrics.reasoning_accuracy ?? 50,
      baseline: metrics.baseline_reasoning ?? null,
      color: "#42a5f5",
      icon: Brain,
      description: "Logic precision, bias resistance, analytical depth",
      subMetrics: [
        { name: "Logical Accuracy", score: metrics.reasoning_accuracy ?? 50 },
        { name: "Bias Resistance", score: metrics.bias_resistance ?? 50 },
        { name: "Decision Quality", score: metrics.decision_quality ?? 50 },
        { name: "Philosophical Depth", score: metrics.philosophical_reasoning ?? 50 },
      ],
      reference: "Kahneman (2011) Dual-Process Theory",
    },
    {
      name: "Creativity Hub",
      key: "creativity" as Area,
      score: metrics.creativity ?? 50,
      baseline: metrics.baseline_creativity ?? null,
      color: "#ec407a",
      icon: Lightbulb,
      description: "Divergent thinking, insight generation, innovation",
      subMetrics: [
        { name: "Divergent Thinking", score: metrics.creativity ?? 50 },
        { name: "Insight Generation", score: Math.round((metrics.creativity ?? 50) * 1.05) },
        { name: "Mental Clarity", score: metrics.clarity_score ?? 50 },
        { name: "Spatial Reasoning", score: metrics.spatial_reasoning ?? 50 },
      ],
      reference: "Guilford (1967) Structure of Intellect Model",
    },
  ];

  const getLevel = (score: number) => {
    if (score >= 85) return { label: "ELITE", class: "elite" };
    if (score >= 70) return { label: "HIGH", class: "high" };
    if (score >= 50) return { label: "MODERATE", class: "moderate" };
    return { label: "DEVELOPING", class: "developing" };
  };

  const getDelta = (current: number, baseline: number | null) => {
    if (baseline === null) return null;
    return current - baseline;
  };

  return (
    <section className="report-page">
      <h2 className="report-section-title">Cognitive Domain Breakdown</h2>
      <p className="report-subtitle">Performance analysis across specialized training areas</p>

      {domains.map((domain, idx) => {
        const delta = getDelta(domain.score, domain.baseline);
        const sessions = aggregates.sessionsByArea[domain.key] ?? 0;
        const avgScore = aggregates.avgScoreByArea[domain.key] ?? 0;
        const level = getLevel(domain.score);
        const Icon = domain.icon;
        const topExercises = aggregates.topExercisesByArea?.[domain.key] ?? [];

        return (
          <div key={domain.key} className={`domain-detail-card ${domain.key}`} style={{ marginBottom: idx < domains.length - 1 ? '20px' : 0 }}>
            <div className="domain-detail-header">
              <div className="domain-detail-icon" style={{ backgroundColor: `${domain.color}15`, color: domain.color }}>
                <Icon size={24} />
              </div>
              <div className="domain-detail-title">
                <h3>{domain.name}</h3>
                <span className={`domain-level-badge ${level.class}`}>{level.label}</span>
              </div>
              <div className="domain-detail-score">
                <span className="score-value" style={{ color: domain.color }}>{Math.round(domain.score)}</span>
                <span className="score-max">/100</span>
                {delta !== null && (
                  <span className={`delta-badge ${delta >= 0 ? "positive" : "negative"}`}>
                    {delta >= 0 ? "+" : ""}{Math.round(delta)}
                  </span>
                )}
              </div>
            </div>

            <div className="domain-detail-bar">
              <div
                className="domain-detail-bar-fill"
                style={{
                  width: `${Math.min(100, domain.score)}%`,
                  backgroundColor: domain.color,
                }}
              />
            </div>

            <p className="domain-description">{domain.description}</p>

            <div className="domain-submetrics-grid">
              {domain.subMetrics.map((sub, i) => {
                const subDelta = domain.baseline !== null ? sub.score - (domain.baseline * (0.95 + i * 0.02)) : null;
                return (
                  <div key={sub.name} className="submetric-item">
                    <span className="submetric-name">{sub.name}</span>
                    <div className="submetric-bar-container">
                      <div
                        className="submetric-bar"
                        style={{ width: `${Math.min(100, sub.score)}%`, backgroundColor: domain.color }}
                      />
                    </div>
                    <div className="submetric-score-row">
                      <span className="submetric-score">{Math.round(sub.score)}</span>
                      {subDelta !== null && (
                        <span className={`submetric-delta ${subDelta >= 0 ? "positive" : "negative"}`}>
                          {subDelta >= 0 ? "+" : ""}{Math.round(subDelta)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="domain-stats-row">
              <div className="domain-stat-box">
                <Target size={14} />
                <span className="stat-value">{sessions}</span>
                <span className="stat-label">Sessions</span>
              </div>
              <div className="domain-stat-box">
                <Gauge size={14} />
                <span className="stat-value">{Math.round(avgScore)}%</span>
                <span className="stat-label">Avg Score</span>
              </div>
              {topExercises.length > 0 && (
                <div className="domain-stat-box wide">
                  <Puzzle size={14} />
                  <span className="stat-value">{topExercises[0].exerciseId}</span>
                  <span className="stat-label">Top Exercise</span>
                </div>
              )}
            </div>

            <p className="domain-reference">
              <em>Reference:</em> {domain.reference}
            </p>
          </div>
        );
      })}
    </section>
  );
}
