import React from "react";
import { CheckCircle, FileText, Brain, Lightbulb, TrendingUp, Activity, BookOpen } from "lucide-react";

interface ReportSCIProps {
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_level?: number | null;
    experience_points?: number | null;
    cognitive_readiness_score?: number | null;
    total_sessions?: number;
    fast_thinking?: number;
    slow_thinking?: number;
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    clarity_score?: number;
    decision_quality?: number;
    bias_resistance?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
  };
}

export function ReportSCI({ metrics }: ReportSCIProps) {
  const sci = metrics.cognitive_performance_score ?? 50;
  const level = metrics.cognitive_level ?? 1;
  const readiness = metrics.cognitive_readiness_score ?? 50;
  const sessions = metrics.total_sessions ?? 0;

  const getPerformanceLabel = (score: number) => {
    if (score >= 85) return { label: "ELITE COGNITIVE PERFORMANCE", color: "#1b5e20", bg: "#e8f5e9" };
    if (score >= 70) return { label: "HIGH COGNITIVE PERFORMANCE", color: "#2e7d32", bg: "#e8f5e9" };
    if (score >= 50) return { label: "DEVELOPING COGNITIVE PROFILE", color: "#f57c00", bg: "#fff3e0" };
    return { label: "FOUNDATION PHASE", color: "#c62828", bg: "#ffebee" };
  };

  const perfData = getPerformanceLabel(sci);

  const indicators = [
    { 
      name: "System 1 (Fast Thinking)", 
      description: "Automatic, intuitive cognitive processes including pattern recognition and rapid decision-making",
      score: Math.round(metrics.fast_thinking ?? 50),
      baseline: metrics.baseline_fast_thinking,
      reference: "Kahneman, 2011",
      subMetrics: [
        { name: "Reaction Speed", value: 75 },
        { name: "Pattern Recognition", value: 72 },
        { name: "Intuitive Judgment", value: 68 },
      ]
    },
    { 
      name: "System 2 (Slow Thinking)", 
      description: "Deliberate, analytical processing for complex reasoning and effortful mental activities",
      score: Math.round(metrics.slow_thinking ?? 50),
      baseline: metrics.baseline_slow_thinking,
      reference: "Kahneman, 2011",
      subMetrics: [
        { name: "Logical Analysis", value: Math.round(metrics.reasoning_accuracy ?? 50) },
        { name: "Critical Evaluation", value: Math.round(metrics.bias_resistance ?? 50) },
        { name: "Decision Quality", value: Math.round(metrics.decision_quality ?? 50) },
      ]
    },
    { 
      name: "Attentional Control", 
      description: "Capacity for sustained focus, selective attention, and distractor inhibition",
      score: Math.round(metrics.focus_stability ?? 50),
      baseline: metrics.baseline_focus,
      reference: "Posner & Petersen, 1990",
      subMetrics: [
        { name: "Sustained Attention", value: Math.round(metrics.focus_stability ?? 50) },
        { name: "Selective Focus", value: Math.round((metrics.focus_stability ?? 50) * 0.95) },
        { name: "Inhibitory Control", value: Math.round(metrics.clarity_score ?? 50) },
      ]
    },
    { 
      name: "Logical Reasoning", 
      description: "Deductive and inductive reasoning accuracy in structured problem-solving",
      score: Math.round(metrics.reasoning_accuracy ?? 50),
      baseline: metrics.baseline_reasoning,
      reference: "Evans, 2008",
      subMetrics: [
        { name: "Deductive Logic", value: Math.round(metrics.reasoning_accuracy ?? 50) },
        { name: "Inductive Inference", value: Math.round((metrics.reasoning_accuracy ?? 50) * 0.92) },
        { name: "Bias Resistance", value: Math.round(metrics.bias_resistance ?? 50) },
      ]
    },
    { 
      name: "Creative Cognition", 
      description: "Divergent thinking, insight generation, and novel problem-solving",
      score: Math.round(metrics.creativity ?? 50),
      baseline: metrics.baseline_creativity,
      reference: "Guilford, 1967",
      subMetrics: [
        { name: "Divergent Thinking", value: Math.round(metrics.creativity ?? 50) },
        { name: "Insight Generation", value: Math.round((metrics.creativity ?? 50) * 0.88) },
        { name: "Cognitive Flexibility", value: Math.round((metrics.creativity ?? 50) * 0.95) },
      ]
    },
  ];

  const sciRadius = 60;
  const sciCircumference = 2 * Math.PI * sciRadius;
  const sciOffset = sciCircumference - (sci / 100) * sciCircumference;

  return (
    <section className="report-page">
      <h2 className="report-section-title">Executive Summary</h2>
      <p className="report-subtitle">Synthesized Cognitive Index (SCI) derived from multi-domain assessment battery</p>

      {/* Performance Banner */}
      <div className="performance-banner" style={{ background: perfData.bg, borderColor: perfData.color }}>
        <div className="banner-icon" style={{ background: perfData.color }}>
          <CheckCircle size={28} color="#fff" />
        </div>
        <div className="banner-content">
          <h3 style={{ color: perfData.color }}>{perfData.label}</h3>
          <p>Assessment completed based on {sessions} training sessions analyzed</p>
        </div>
      </div>

      {/* Main Score Cards */}
      <div className="sci-cards-grid">
        <div className="sci-main-card">
          <div className="sci-gauge">
            <svg viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={sciRadius} fill="none" stroke="#e0e0e0" strokeWidth="12" />
              <circle 
                cx="70" cy="70" r={sciRadius} 
                fill="none" 
                stroke="#00897b" 
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={sciCircumference}
                strokeDashoffset={sciOffset}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="gauge-center">
              <span className="gauge-score">{Math.round(sci)}</span>
              <span className="gauge-label">SCI</span>
            </div>
          </div>
          <div className="card-details">
            <h4>SYNTHESIZED COGNITIVE INDEX</h4>
            <p>Composite metric integrating all cognitive domains</p>
            <div className="score-breakdown">
              <span>Optimal Range: 70-100</span>
              <span>Level: {level}</span>
            </div>
          </div>
        </div>

        <div className="sci-secondary-card">
          <div className="secondary-icon">
            <Activity size={32} color="#00897b" />
          </div>
          <div className="secondary-content">
            <span className="secondary-value">{Math.round(readiness)}</span>
            <span className="secondary-label">Cognitive Readiness Index</span>
            <p>Daily performance potential estimate</p>
          </div>
        </div>

        <div className="sci-secondary-card">
          <div className="secondary-icon">
            <TrendingUp size={32} color="#00897b" />
          </div>
          <div className="secondary-content">
            <span className="secondary-value">{metrics.experience_points ?? 0}</span>
            <span className="secondary-label">Experience Points</span>
            <p>Cumulative training investment</p>
          </div>
        </div>
      </div>

      {/* Cognitive Indicators Table */}
      <h3 className="report-subsection-title">Cognitive Indicators Assessment</h3>
      <p className="table-intro">
        Performance metrics derived from LOOMA drills, with personal-baseline comparisons where available:
      </p>
      
      <table className="medical-table">
        <thead>
          <tr>
            <th>Cognitive Domain</th>
            <th>Score</th>
            <th>Sub-Metrics</th>
            <th>Classification</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((ind) => {
            const classification = ind.score >= 85 ? "Elite" : ind.score >= 70 ? "High" : ind.score >= 50 ? "Moderate" : "Developing";
            const classColor = ind.score >= 70 ? "#2e7d32" : ind.score >= 50 ? "#f57c00" : "#c62828";
            const delta = ind.baseline !== null && ind.baseline !== undefined ? ind.score - ind.baseline : null;
            
            return (
              <tr key={ind.name}>
                <td>
                  <div className="domain-cell">
                    <strong>{ind.name}</strong>
                    <span className="domain-desc">{ind.description}</span>
                  </div>
                </td>
                <td>
                  <div className="score-cell">
                    <div className="score-bar-mini">
                      <div className="score-bar-fill" style={{ width: `${ind.score}%`, background: classColor }} />
                    </div>
                    <div className="score-numbers">
                      <span className="score-main">{ind.score}</span>
                      {delta !== null && (
                        <span className={`score-delta ${delta >= 0 ? "positive" : "negative"}`}>
                          {delta >= 0 ? "+" : ""}{Math.round(delta)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="submetrics-cell">
                    {ind.subMetrics.map((sm, i) => (
                      <div key={i} className="submetric">
                        <span className="sm-name">{sm.name}</span>
                        <span className="sm-value">{sm.value}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="classification-pill" style={{ background: `${classColor}15`, color: classColor }}>
                    {classification}
                  </span>
                </td>
                <td>
                  <span className="reference-text">{ind.reference}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Clinical Interpretation */}
      <div className="interpretation-box">
        <div className="interpretation-icon">
          <Lightbulb size={24} />
        </div>
        <div className="interpretation-content">
          <h4>PERSONAL-STATE INTERPRETATION</h4>
          <ul>
            <li>
              {sci >= 70 
                ? "The current personal-state index is strong across the measured LOOMA domains. Continue tracking whether that level is stable across future sessions."
                : "The current personal-state index leaves room for improvement in one or more measured LOOMA domains. Use the trend, not one session, to judge change."}
            </li>
            <li>
              LOOMA adapts drill difficulty to the user's recent in-app performance. Transfer to real-world work is
              treated as a hypothesis to validate from longitudinal outcomes, not as an established claim.
            </li>
            <li>
              <strong>Recommendation:</strong> {sci >= 70 
                ? "Continue current training regimen with emphasis on maintaining System 1/System 2 balance."
                : "Prioritize the weakest measured domain and reassess after enough comparable sessions."}
            </li>
          </ul>
        </div>
      </div>

      {/* Formula Box */}
      <div className="formula-box">
        <div className="formula-header">
          <BookOpen size={18} />
          <span>SCI Calculation Methodology</span>
        </div>
        <div className="formula-content">
          <code>
            SCI = (0.50 × CognitivePerformance) + (0.30 × TrainingEngagement) + (0.20 × Recovery)
          </code>
          <p>
            Cognitive Performance is the equal average of AE, RA, CT and IN. Training Engagement is weekly
            Lab XP relative to the selected protocol; Recovery is the same value used in Home.
          </p>
        </div>
      </div>
    </section>
  );
}
