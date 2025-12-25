import React from "react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportActionableProps {
  profile: {
    training_goals?: string[] | null;
  };
  metrics: {
    fast_thinking?: number;
    slow_thinking?: number;
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
  };
}

export function ReportActionable({ profile, metrics, aggregates }: ReportActionableProps) {
  const fast = metrics.fast_thinking ?? 50;
  const slow = metrics.slow_thinking ?? 50;

  // Determine system balance
  const systemDiff = fast - slow;
  let balanceInsight = "";
  let balanceRecommendation = "";

  if (Math.abs(systemDiff) < 10) {
    balanceInsight = "Your Fast and Slow thinking systems are well balanced.";
    balanceRecommendation = "Continue balanced training across both systems.";
  } else if (systemDiff > 10) {
    balanceInsight = `Fast Thinking dominates by ${Math.round(systemDiff)} points.`;
    balanceRecommendation = "Increase Slow Thinking exercises: deep reasoning, philosophical challenges, reflective tasks.";
  } else {
    balanceInsight = `Slow Thinking dominates by ${Math.round(Math.abs(systemDiff))} points.`;
    balanceRecommendation = "Add more Fast Thinking drills: reaction tasks, visual processing, quick decisions.";
  }

  // Find strongest and weakest areas
  const areas = [
    { key: "focus" as Area, name: "Focus Arena", score: metrics.focus_stability ?? 50, baseline: metrics.baseline_focus },
    { key: "reasoning" as Area, name: "Critical Reasoning", score: metrics.reasoning_accuracy ?? 50, baseline: metrics.baseline_reasoning },
    { key: "creativity" as Area, name: "Creativity Hub", score: metrics.creativity ?? 50, baseline: metrics.baseline_creativity },
  ];

  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Training goals analysis
  const goals = profile.training_goals ?? [];
  const focusOnFast = goals.includes("fast_thinking");
  const focusOnSlow = goals.includes("slow_thinking");

  // Find least trained area
  const leastTrainedArea = [...areas].sort(
    (a, b) => (aggregates.sessionsByArea[a.key] ?? 0) - (aggregates.sessionsByArea[b.key] ?? 0)
  )[0];

  // Protocol recommendations
  const protocolItems = [
    weakest.score < 50 ? `Focus 3+ sessions on ${weakest.name} this week` : null,
    aggregates.sessionsByArea[leastTrainedArea.key] < 5 ? `Train ${leastTrainedArea.name} more frequently` : null,
    systemDiff > 15 ? "Add 2 Slow Thinking sessions (5-7 min each)" : null,
    systemDiff < -15 ? "Add 2 Fast Thinking sessions (2-3 min each)" : null,
    "Maintain daily training consistency",
  ].filter(Boolean);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Actionable Intelligence</h2>
      <p className="report-subtitle">Data-driven recommendations for cognitive optimization</p>

      <div className="actionable-grid">
        <div className="actionable-card strength">
          <h3 className="actionable-card-title">Top Strength</h3>
          <div className="actionable-highlight">{strongest.name}</div>
          <p className="actionable-detail">
            Score: {Math.round(strongest.score)} — Leverage this strength in high-stakes decisions.
          </p>
        </div>

        <div className="actionable-card gap">
          <h3 className="actionable-card-title">Critical Gap</h3>
          <div className="actionable-highlight">{weakest.name}</div>
          <p className="actionable-detail">
            Score: {Math.round(weakest.score)} — Prioritize training in this area for balanced cognition.
          </p>
        </div>
      </div>

      <div className="actionable-balance">
        <h3 className="actionable-subsection-title">System Balance Analysis</h3>
        <div className="balance-visual">
          <div className="balance-bar">
            <div className="balance-fast" style={{ width: `${(fast / (fast + slow)) * 100}%` }}>
              Fast {Math.round(fast)}
            </div>
            <div className="balance-slow" style={{ width: `${(slow / (fast + slow)) * 100}%` }}>
              Slow {Math.round(slow)}
            </div>
          </div>
        </div>
        <p className="balance-insight">{balanceInsight}</p>
        <p className="balance-recommendation">{balanceRecommendation}</p>
      </div>

      <div className="actionable-protocol">
        <h3 className="actionable-subsection-title">7-Day Protocol</h3>
        <ul className="protocol-list">
          {protocolItems.map((item, i) => (
            <li key={i} className="protocol-item">{item}</li>
          ))}
        </ul>
      </div>

      {goals.length > 0 && (
        <div className="training-goals-note">
          <span className="goals-label">Your training focus:</span>
          <span className="goals-value">
            {focusOnFast && focusOnSlow ? "Balanced (Fast + Slow)" : focusOnFast ? "Fast Thinking" : focusOnSlow ? "Slow Thinking" : "General"}
          </span>
        </div>
      )}
    </section>
  );
}
