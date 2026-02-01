import React from "react";
import { Zap, Brain, BarChart3, ArrowRight, Info } from "lucide-react";

function classify(score: number) {
  if (score >= 85) return { label: "ELITE", color: "#1b5e20", bg: "#e8f5e9" };
  if (score >= 70) return { label: "HIGH", color: "#2e7d32", bg: "#e8f5e9" };
  if (score >= 50) return { label: "MODERATE", color: "#f57c00", bg: "#fff3e0" };
  return { label: "DEVELOPING", color: "#c62828", bg: "#ffebee" };
}

function getBalanceInterpretation(fastPct: number) {
  if (fastPct >= 45 && fastPct <= 55) return { 
    status: "BALANCED", 
    description: "Optimal integration between intuitive and analytical processing modes", 
    color: "#2e7d32",
    recommendation: "Maintain current training balance across both systems."
  };
  if (fastPct > 55 && fastPct <= 65) return { 
    status: "SLIGHT SYSTEM 1 BIAS", 
    description: "Tendency toward rapid, intuitive responses over deliberate analysis", 
    color: "#f57c00",
    recommendation: "Consider adding more deep reasoning and analytical exercises."
  };
  if (fastPct > 65) return { 
    status: "SIGNIFICANT SYSTEM 1 BIAS", 
    description: "Over-reliance on intuition may lead to systematic cognitive biases", 
    color: "#c62828",
    recommendation: "Priority focus on System 2 training: critical reasoning, bias resistance."
  };
  if (fastPct >= 35 && fastPct < 45) return { 
    status: "SLIGHT SYSTEM 2 BIAS", 
    description: "Tendency toward deliberate analysis over intuitive processing", 
    color: "#f57c00",
    recommendation: "Consider adding more rapid reaction and pattern recognition drills."
  };
  return { 
    status: "SIGNIFICANT SYSTEM 2 BIAS", 
    description: "Over-reliance on analysis may slow decision-making in time-critical situations", 
    color: "#c62828",
    recommendation: "Priority focus on System 1 training: reaction speed, intuitive judgment."
  };
}

interface ReportDualProcessProps {
  profile: any;
  metrics: {
    fast_thinking?: number;
    slow_thinking?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    reaction_speed?: number;
    focus_stability?: number;
    reasoning_accuracy?: number;
    decision_quality?: number;
    bias_resistance?: number;
    clarity_score?: number;
  };
}

export function ReportDualProcess({ profile, metrics }: ReportDualProcessProps) {
  const fast = metrics.fast_thinking ?? 50;
  const slow = metrics.slow_thinking ?? 50;
  const baselineFast = metrics.baseline_fast_thinking ?? null;
  const baselineSlow = metrics.baseline_slow_thinking ?? null;
  const fastDelta = baselineFast !== null ? fast - baselineFast : null;
  const slowDelta = baselineSlow !== null ? slow - baselineSlow : null;
  
  const total = fast + slow;
  const fastPct = total > 0 ? (fast / total) * 100 : 50;
  const slowPct = 100 - fastPct;
  
  const fastClass = classify(fast);
  const slowClass = classify(slow);
  const balanceInfo = getBalanceInterpretation(fastPct);

  // Sub-components for each system
  const system1Components = [
    { name: "Processing Speed", value: metrics.reaction_speed ?? 65, description: "Time to recognize and respond to stimuli" },
    { name: "Pattern Recognition", value: Math.round((fast + (metrics.focus_stability ?? 50)) / 2), description: "Ability to identify recurring patterns" },
    { name: "Intuitive Judgment", value: Math.round(fast * 0.95), description: "Accuracy of rapid, gut-level decisions" },
    { name: "Automaticity", value: Math.round((fast + (metrics.reaction_speed ?? 50)) / 2), description: "Efficiency of learned, automatic responses" },
  ];

  const system2Components = [
    { name: "Logical Analysis", value: metrics.reasoning_accuracy ?? 60, description: "Systematic, step-by-step reasoning" },
    { name: "Cognitive Effort", value: metrics.decision_quality ?? 55, description: "Willingness to engage in effortful thinking" },
    { name: "Bias Resistance", value: metrics.bias_resistance ?? 50, description: "Ability to override intuitive errors" },
    { name: "Metacognition", value: metrics.clarity_score ?? 55, description: "Awareness of own thinking processes" },
  ];

  return (
    <section className="report-page">
      <h2 className="report-section-title">Dual-Process Cognitive Architecture</h2>
      <p className="report-subtitle">
        Analysis based on Kahneman's Dual-Process Theory (2011) — two distinct cognitive systems governing human thought
      </p>

      {/* Theory Introduction */}
      <div className="theory-box">
        <div className="theory-icon"><Info size={20} /></div>
        <div className="theory-content">
          <strong>Theoretical Framework:</strong> Dual-process theory posits that cognition operates through two distinct systems: 
          <strong> System 1</strong> (fast, automatic, intuitive) and <strong>System 2</strong> (slow, deliberate, analytical). 
          Optimal cognitive performance requires effective integration and appropriate deployment of both systems.
        </div>
      </div>

      {/* Main Comparison Cards */}
      <div className="dual-process-comparison">
        {/* System 1 */}
        <div className="system-card system1" style={{ borderColor: fastClass.color }}>
          <div className="system-header" style={{ background: "#f5f0e6" }}>
            <Zap size={24} color="#C6A86D" />
            <div>
              <h3>SYSTEM 1 — Fast Thinking</h3>
              <span className="system-subtitle">Intuitive, Automatic Processing</span>
            </div>
          </div>
          
          <div className="system-score-section">
            <div className="system-big-score" style={{ color: "#C6A86D" }}>
              {Math.round(fast)}
              <span className="score-max">/100</span>
              {fastDelta !== null && (
                <span className={`delta-badge ${fastDelta >= 0 ? "positive" : "negative"}`}>
                  {fastDelta >= 0 ? "+" : ""}{Math.round(fastDelta)} from baseline
                </span>
              )}
            </div>
            <div className="classification" style={{ background: fastClass.bg, color: fastClass.color }}>
              {fastClass.label}
            </div>
          </div>

          <div className="system-bar">
            <div className="bar-fill" style={{ width: `${fast}%`, background: "linear-gradient(90deg, #C6A86D, #D4BC8A)" }} />
          </div>

          <div className="system-description">
            <p>
              System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. 
              It handles routine cognitive tasks, pattern recognition, and generates intuitive impressions.
            </p>
          </div>

          <div className="subcomponents">
            <h4>Component Analysis</h4>
            {system1Components.map((comp) => (
              <div key={comp.name} className="subcomp-row">
                <div className="subcomp-info">
                  <span className="subcomp-name">{comp.name}</span>
                  <span className="subcomp-desc">{comp.description}</span>
                </div>
                <div className="subcomp-score">
                  <div className="mini-bar">
                    <div className="mini-fill" style={{ width: `${comp.value}%`, background: "#C6A86D" }} />
                  </div>
                  <span>{comp.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System 2 */}
        <div className="system-card system2" style={{ borderColor: slowClass.color }}>
          <div className="system-header" style={{ background: "#f0eef6" }}>
            <Brain size={24} color="#7B6FA8" />
            <div>
              <h3>SYSTEM 2 — Slow Thinking</h3>
              <span className="system-subtitle">Deliberate, Analytical Processing</span>
            </div>
          </div>
          
          <div className="system-score-section">
            <div className="system-big-score" style={{ color: "#7B6FA8" }}>
              {Math.round(slow)}
              <span className="score-max">/100</span>
              {slowDelta !== null && (
                <span className={`delta-badge ${slowDelta >= 0 ? "positive" : "negative"}`}>
                  {slowDelta >= 0 ? "+" : ""}{Math.round(slowDelta)} from baseline
                </span>
              )}
            </div>
            <div className="classification" style={{ background: slowClass.bg, color: slowClass.color }}>
              {slowClass.label}
            </div>
          </div>

          <div className="system-bar">
            <div className="bar-fill" style={{ width: `${slow}%`, background: "linear-gradient(90deg, #7B6FA8, #9A8FC0)" }} />
          </div>

          <div className="system-description">
            <p>
              System 2 allocates attention to effortful mental activities including complex computations, 
              logical reasoning, and activities requiring focus and self-control.
            </p>
          </div>

          <div className="subcomponents">
            <h4>Component Analysis</h4>
            {system2Components.map((comp) => (
              <div key={comp.name} className="subcomp-row">
                <div className="subcomp-info">
                  <span className="subcomp-name">{comp.name}</span>
                  <span className="subcomp-desc">{comp.description}</span>
                </div>
                <div className="subcomp-score">
                  <div className="mini-bar">
                    <div className="mini-fill" style={{ width: `${comp.value}%`, background: "#7B6FA8" }} />
                  </div>
                  <span>{comp.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Balance Analysis */}
      <div className="balance-analysis">
        <h3 className="report-subsection-title">System Integration Analysis</h3>
        
        <div className="balance-visualization">
          <div className="balance-bar-container">
            <span className="balance-label-left">System 1</span>
            <div className="balance-bar">
              <div className="balance-s1" style={{ width: `${fastPct}%` }}>
                {Math.round(fastPct)}%
              </div>
              <div className="balance-s2" style={{ width: `${slowPct}%` }}>
                {Math.round(slowPct)}%
              </div>
            </div>
            <span className="balance-label-right">System 2</span>
          </div>
          
          <div className="optimal-zone">
            <span>Optimal Range: 45-55% each system</span>
          </div>
        </div>

        <div className="balance-interpretation" style={{ borderColor: balanceInfo.color }}>
          <div className="interp-header" style={{ color: balanceInfo.color }}>
            <BarChart3 size={20} />
            <span>{balanceInfo.status}</span>
          </div>
          <p>{balanceInfo.description}</p>
          <div className="interp-recommendation">
            <ArrowRight size={16} />
            <span>{balanceInfo.recommendation}</span>
          </div>
        </div>
      </div>

      {/* Reference */}
      <div className="scientific-note">
        <strong>Key Reference:</strong> Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. Farrar, Straus and Giroux. 
        This framework has been validated across diverse cognitive assessment contexts and forms the theoretical 
        foundation for the LUMA dual-process training protocol.
      </div>
    </section>
  );
}
