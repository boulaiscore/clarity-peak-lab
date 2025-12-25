import React from "react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportActionableProps {
  profile: { training_goals?: string[] | null };
  metrics: { fast_thinking?: number; slow_thinking?: number; focus_stability?: number; reasoning_accuracy?: number; creativity?: number };
  aggregates: { sessionsByArea: Record<Area, number> };
}

export function ReportActionable({ profile, metrics, aggregates }: ReportActionableProps) {
  const fast = metrics.fast_thinking ?? 50;
  const slow = metrics.slow_thinking ?? 50;
  const total = fast + slow;
  const fastPct = total > 0 ? (fast / total) * 100 : 50;
  const slowPct = 100 - fastPct;
  const systemDiff = fast - slow;
  let balanceInsight = "Balanced cognitive integration.";
  if (systemDiff > 10) balanceInsight = `Fast thinking dominates (+${Math.round(systemDiff)}). Consider adding deep reasoning exercises.`;
  else if (systemDiff < -10) balanceInsight = `Slow thinking dominates (+${Math.round(Math.abs(systemDiff))}). Consider adding reaction drills.`;

  const areas = [
    { key: "focus" as Area, name: "Focus", score: metrics.focus_stability ?? 50 },
    { key: "reasoning" as Area, name: "Reasoning", score: metrics.reasoning_accuracy ?? 50 },
    { key: "creativity" as Area, name: "Creativity", score: metrics.creativity ?? 50 },
  ];
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const leastTrained = [...areas].sort((a, b) => (aggregates.sessionsByArea[a.key] ?? 0) - (aggregates.sessionsByArea[b.key] ?? 0))[0];
  const protocol = [weakest.score < 50 ? `Prioritize ${weakest.name} training` : null, aggregates.sessionsByArea[leastTrained.key] < 5 ? `Increase ${leastTrained.name} sessions` : null, systemDiff > 15 ? "Add slow thinking sessions" : null, systemDiff < -15 ? "Add fast thinking drills" : null, "Maintain daily consistency"].filter(Boolean);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Actionable Intelligence</h2>
      <p className="report-subtitle">Data-driven recommendations for optimization</p>
      <div className="actionable-row">
        <div className="actionable-card strength"><div className="actionable-card-label">Top Strength</div><div className="actionable-card-value">{strongest.name}</div><div className="actionable-card-score">Score: {Math.round(strongest.score)}</div></div>
        <div className="actionable-card gap"><div className="actionable-card-label">Critical Gap</div><div className="actionable-card-value">{weakest.name}</div><div className="actionable-card-score">Score: {Math.round(weakest.score)}</div></div>
      </div>
      <div className="balance-section">
        <div className="report-subsection-title" style={{ marginTop: 0 }}>System Balance</div>
        <div className="balance-bar-container"><div className="balance-fast" style={{ width: `${fastPct}%` }}>Fast {Math.round(fast)}</div><div className="balance-slow" style={{ width: `${slowPct}%` }}>Slow {Math.round(slow)}</div></div>
        <p className="balance-insight">{balanceInsight}</p>
      </div>
      <div className="report-subsection-title">7-Day Protocol</div>
      <ul className="protocol-list">{protocol.map((item, i) => (<li key={i} className="protocol-item">{item}</li>))}</ul>
    </section>
  );
}