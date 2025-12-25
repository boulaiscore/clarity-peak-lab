import React from "react";

function classify(score: number) {
  if (score >= 85) return "Elite";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function ReportDualProcess({ profile, metrics }: any) {
  const fast = metrics.fast_thinking ?? 50;
  const slow = metrics.slow_thinking ?? 50;
  const baselineFast = metrics.baseline_fast_thinking ?? fast;
  const baselineSlow = metrics.baseline_slow_thinking ?? slow;
  const fastDelta = fast - baselineFast;
  const slowDelta = slow - baselineSlow;
  const total = fast + slow;
  const fastPct = total > 0 ? (fast / total) * 100 : 50;
  const slowPct = total > 0 ? (slow / total) * 100 : 50;

  return (
    <section className="report-page">
      <h2 className="report-section-title">Dual-Process Architecture</h2>
      <p className="report-subtitle">System 1 (Fast) vs System 2 (Slow) cognitive integration</p>

      <div className="dual-process-section">
        <div className="dual-process-card fast">
          <div className="dual-process-header">
            <span className="dual-process-system">System 1 · Fast</span>
            <span className="dual-process-level">{classify(fast)}</span>
          </div>
          <div className="dual-process-score-row">
            <span className="dual-process-score">{Math.round(fast)}</span>
            {fastDelta !== 0 && (
              <span className={`dual-process-delta ${fastDelta >= 0 ? "positive" : "negative"}`}>
                {fastDelta >= 0 ? "+" : ""}{Math.round(fastDelta)}
              </span>
            )}
          </div>
          <div className="dual-process-meta">Baseline: {Math.round(baselineFast)}</div>
          <div className="dual-process-bar">
            <div className="dual-process-bar-fill" style={{ width: `${fast}%` }} />
          </div>
        </div>

        <div className="dual-process-card slow">
          <div className="dual-process-header">
            <span className="dual-process-system">System 2 · Slow</span>
            <span className="dual-process-level">{classify(slow)}</span>
          </div>
          <div className="dual-process-score-row">
            <span className="dual-process-score">{Math.round(slow)}</span>
            {slowDelta !== 0 && (
              <span className={`dual-process-delta ${slowDelta >= 0 ? "positive" : "negative"}`}>
                {slowDelta >= 0 ? "+" : ""}{Math.round(slowDelta)}
              </span>
            )}
          </div>
          <div className="dual-process-meta">Baseline: {Math.round(baselineSlow)}</div>
          <div className="dual-process-bar">
            <div className="dual-process-bar-fill" style={{ width: `${slow}%` }} />
          </div>
        </div>

        <div className="integration-row">
          <span className="integration-label">Balance</span>
          <div className="integration-bar">
            <div className="integration-fast" style={{ width: `${fastPct}%` }}>
              {Math.round(fastPct)}%
            </div>
            <div className="integration-slow" style={{ width: `${slowPct}%` }}>
              {Math.round(slowPct)}%
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
