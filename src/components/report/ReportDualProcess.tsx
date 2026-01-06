import React from "react";

function classify(score: number) {
  if (score >= 85) return { label: "ELITE", color: "#10b981", description: "Top-tier performance" };
  if (score >= 70) return { label: "HIGH", color: "#22c55e", description: "Strong capability" };
  if (score >= 50) return { label: "MODERATE", color: "#f59e0b", description: "Functional, room to grow" };
  return { label: "DEVELOPING", color: "#ef4444", description: "Priority training area" };
}

function getBalanceInterpretation(fastPct: number, slowPct: number) {
  const diff = Math.abs(fastPct - slowPct);
  if (diff <= 10) return { status: "Balanced", description: "Optimal integration between intuitive and analytical thinking", color: "#10b981" };
  if (diff <= 25) return { status: "Slight Imbalance", description: fastPct > slowPct ? "Tendency toward rapid, intuitive responses" : "Tendency toward deliberate, analytical processing", color: "#f59e0b" };
  return { status: "Significant Imbalance", description: fastPct > slowPct ? "Over-reliance on intuition; analytical thinking needs development" : "Over-reliance on analysis; intuitive responses need development", color: "#ef4444" };
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
  
  const fastClass = classify(fast);
  const slowClass = classify(slow);
  const balanceInfo = getBalanceInterpretation(fastPct, slowPct);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Dual-Process Architecture</h2>
      <p className="report-subtitle">
        Cognitive processing follows two distinct systems: fast intuitive responses and slow analytical thinking.
      </p>

      {/* Interpretation Guide */}
      <div className="interpretation-guide" style={{ 
        background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>
          Score Interpretation Guide
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>85-100 Elite</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>70-84 High</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>50-69 Moderate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>&lt;50 Developing</span>
          </div>
        </div>
      </div>

      <div className="dual-process-section">
        <div className="dual-process-card fast">
          <div className="dual-process-header">
            <span className="dual-process-system">System 1 · Fast Thinking</span>
            <span className="dual-process-level" style={{ color: fastClass.color }}>{fastClass.label}</span>
          </div>
          <div className="dual-process-score-row">
            <span className="dual-process-score">{Math.round(fast)}</span>
            <span className="dual-process-max">/100</span>
            {fastDelta !== 0 && (
              <span className={`dual-process-delta ${fastDelta >= 0 ? "positive" : "negative"}`}>
                {fastDelta >= 0 ? "+" : ""}{Math.round(fastDelta)}
              </span>
            )}
          </div>
          <div className="dual-process-meta">
            Intuitive, automatic processing · Reaction speed, pattern recognition
          </div>
          <div className="dual-process-interpretation" style={{ fontSize: "12px", color: fastClass.color, marginTop: "8px", fontStyle: "italic" }}>
            {fastClass.description}
          </div>
          <div className="dual-process-bar">
            <div className="dual-process-bar-fill" style={{ width: `${fast}%`, background: fastClass.color }} />
          </div>
        </div>

        <div className="dual-process-card slow">
          <div className="dual-process-header">
            <span className="dual-process-system">System 2 · Slow Thinking</span>
            <span className="dual-process-level" style={{ color: slowClass.color }}>{slowClass.label}</span>
          </div>
          <div className="dual-process-score-row">
            <span className="dual-process-score">{Math.round(slow)}</span>
            <span className="dual-process-max">/100</span>
            {slowDelta !== 0 && (
              <span className={`dual-process-delta ${slowDelta >= 0 ? "positive" : "negative"}`}>
                {slowDelta >= 0 ? "+" : ""}{Math.round(slowDelta)}
              </span>
            )}
          </div>
          <div className="dual-process-meta">
            Deliberate, analytical processing · Complex reasoning, deep analysis
          </div>
          <div className="dual-process-interpretation" style={{ fontSize: "12px", color: slowClass.color, marginTop: "8px", fontStyle: "italic" }}>
            {slowClass.description}
          </div>
          <div className="dual-process-bar">
            <div className="dual-process-bar-fill" style={{ width: `${slow}%`, background: slowClass.color }} />
          </div>
        </div>

        <div className="integration-row">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="integration-label">System Balance</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: balanceInfo.color }}>{balanceInfo.status}</span>
          </div>
          <div className="integration-bar">
            <div className="integration-fast" style={{ width: `${fastPct}%` }}>
              Fast {Math.round(fastPct)}%
            </div>
            <div className="integration-slow" style={{ width: `${slowPct}%` }}>
              Slow {Math.round(slowPct)}%
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "8px", textAlign: "center" }}>
            {balanceInfo.description}
          </div>
        </div>

        {/* Optimal Balance Note */}
        <div style={{ 
          marginTop: "20px", 
          padding: "12px 16px", 
          background: "rgba(16, 185, 129, 0.1)", 
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "8px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)"
        }}>
          <strong style={{ color: "#10b981" }}>Optimal Performance:</strong> Elite cognitive performers typically score 70+ in both systems with a balanced ratio (45-55% each). System 1 handles routine decisions efficiently while System 2 engages for complex analysis.
        </div>
      </div>
    </section>
  );
}
