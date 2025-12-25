import React from "react";
import { CheckCircle, FileText, Brain, Lightbulb } from "lucide-react";

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
  };
}

export function ReportSCI({ metrics }: ReportSCIProps) {
  const sci = metrics.cognitive_performance_score ?? 50;
  const level = metrics.cognitive_level ?? 1;
  const readiness = metrics.cognitive_readiness_score ?? 50;
  const sessions = metrics.total_sessions ?? 0;

  const getPerformanceLabel = (score: number) => {
    if (score >= 85) return "ELITE PERFORMANCE";
    if (score >= 70) return "HIGH PERFORMANCE";
    if (score >= 50) return "MODERATE PERFORMANCE";
    return "DEVELOPING";
  };

  const indicators = [
    { name: "Fast Thinking", range: "0-100", score: Math.round(metrics.fast_thinking ?? 50) },
    { name: "Slow Thinking", range: "0-100", score: Math.round(metrics.slow_thinking ?? 50) },
    { name: "Focus Stability", range: "0-100", score: Math.round(metrics.focus_stability ?? 50) },
    { name: "Reasoning", range: "0-100", score: Math.round(metrics.reasoning_accuracy ?? 50) },
  ];

  const sciRadius = 54;
  const sciCircumference = 2 * Math.PI * sciRadius;
  const sciOffset = sciCircumference - (sci / 100) * sciCircumference;

  return (
    <section className="report-page">
      <div className="summary-header">
        <div className="summary-check">
          <CheckCircle size={28} />
        </div>
        <div>
          <h2 className="summary-title">{getPerformanceLabel(sci)}</h2>
          <p className="summary-subtitle">Your Results</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-icon">
            <FileText size={24} color="#4db6ac" />
          </div>
          <div className="summary-card-content">
            <h3>COGNITIVE INDEX</h3>
            <div className="summary-card-score">
              {Math.round(sci)}<span>/100</span>
            </div>
            <p className="summary-card-desc">Optimal range: 70-100</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon">
            <Brain size={24} color="#4db6ac" />
          </div>
          <div className="summary-card-content">
            <h3>READINESS SCORE</h3>
            <div className="summary-card-score">
              {Math.round(readiness)}<span>/100</span>
            </div>
            <p className="summary-card-desc">Daily cognitive readiness</p>
          </div>
        </div>
      </div>

      <h3 className="report-subsection-title">Evaluated Indicators</h3>
      <table className="indicators-table">
        <thead>
          <tr>
            <th>Indicator</th>
            <th>Range</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((ind) => (
            <tr key={ind.name}>
              <td>{ind.name}</td>
              <td>{ind.range}</td>
              <td>
                <div className="indicator-bar">
                  <div 
                    className="indicator-bar-fill" 
                    style={{ width: `${ind.score}px`, maxWidth: '60px' }}
                  />
                  <span>{ind.score}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="conclusions-box">
        <div className="conclusions-icon">
          <Lightbulb size={24} />
        </div>
        <div className="conclusions-content">
          <h3>CONCLUSIONS</h3>
          <ul>
            <li>
              {sci >= 70 
                ? "You show excellent cognitive performance. Continue training to maintain and enhance your abilities."
                : "There is room for improvement in your cognitive profile. Regular training can help optimize your performance."}
            </li>
            <li>We recommend continuing with personalized brain training sessions from NeuroLoop.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}