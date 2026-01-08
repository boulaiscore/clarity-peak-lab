import React from "react";
import { Heart, Moon, Activity, Brain, AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";

interface ReportWellbeingProps {
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_readiness_score?: number | null;
    total_sessions?: number;
    physio_component_score?: number | null;
  };
  wearable: {
    hrv_ms?: number | null;
    sleep_efficiency?: number | null;
    sleep_duration_min?: number | null;
    resting_hr?: number | null;
    activity_score?: number | null;
  } | null;
  aggregates: {
    accuracyRatePct: number;
    sessionsByArea: Record<string, number>;
  } | null;
}

type WellbeingLevel = "GOOD" | "MODERATE" | "LOW";

function getPhysicalWellbeing(wearable: ReportWellbeingProps["wearable"]): { level: WellbeingLevel; score: number; factors: string[] } {
  if (!wearable) return { level: "MODERATE", score: 50, factors: ["No wearable data available"] };
  
  let score = 50;
  const factors: string[] = [];
  
  // HRV
  if (wearable.hrv_ms) {
    if (wearable.hrv_ms >= 50) { score += 15; factors.push("Excellent HRV indicating recovery"); }
    else if (wearable.hrv_ms >= 30) { score += 8; factors.push("Adequate HRV levels"); }
    else { score -= 5; factors.push("Low HRV may indicate stress"); }
  }
  
  // Sleep
  if (wearable.sleep_efficiency) {
    if (wearable.sleep_efficiency >= 85) { score += 15; factors.push("Optimal sleep efficiency"); }
    else if (wearable.sleep_efficiency >= 75) { score += 8; factors.push("Good sleep quality"); }
    else { score -= 5; factors.push("Suboptimal sleep efficiency"); }
  }
  
  // Activity
  if (wearable.activity_score) {
    if (wearable.activity_score >= 70) { score += 10; factors.push("High physical activity"); }
    else if (wearable.activity_score >= 40) { score += 5; factors.push("Moderate activity levels"); }
  }
  
  score = Math.max(0, Math.min(100, score));
  const level: WellbeingLevel = score >= 70 ? "GOOD" : score >= 50 ? "MODERATE" : "LOW";
  return { level, score, factors };
}

function getPsychologicalWellbeing(metrics: ReportWellbeingProps["metrics"], aggregates: ReportWellbeingProps["aggregates"]): { level: WellbeingLevel; score: number; factors: string[] } {
  let score = 50;
  const factors: string[] = [];
  
  // Training consistency
  const totalSessions = metrics.total_sessions || 0;
  if (totalSessions >= 20) { score += 15; factors.push("Strong training consistency"); }
  else if (totalSessions >= 10) { score += 8; factors.push("Regular training pattern"); }
  else { factors.push("Building training habit"); }
  
  // Accuracy as proxy for engagement
  const accuracy = aggregates?.accuracyRatePct || 50;
  if (accuracy >= 75) { score += 15; factors.push("High cognitive engagement"); }
  else if (accuracy >= 60) { score += 8; factors.push("Moderate task focus"); }
  
  // Readiness score
  const readiness = metrics.cognitive_readiness_score || 50;
  if (readiness >= 70) { score += 10; factors.push("Positive cognitive readiness"); }
  
  score = Math.max(0, Math.min(100, score));
  const level: WellbeingLevel = score >= 70 ? "GOOD" : score >= 50 ? "MODERATE" : "LOW";
  return { level, score, factors };
}

function getCognitiveWellbeing(metrics: ReportWellbeingProps["metrics"]): { level: WellbeingLevel; score: number; factors: string[] } {
  const sci = metrics.cognitive_performance_score || 50;
  const factors: string[] = [];
  
  if (sci >= 70) factors.push("High cognitive performance index");
  else if (sci >= 50) factors.push("Average cognitive functioning");
  else factors.push("Developing cognitive profile");
  
  const level: WellbeingLevel = sci >= 70 ? "GOOD" : sci >= 50 ? "MODERATE" : "LOW";
  return { level, score: Math.round(sci), factors };
}

function getLevelIcon(level: WellbeingLevel) {
  switch (level) {
    case "GOOD": return <CheckCircle size={24} className="level-icon good" />;
    case "MODERATE": return <MinusCircle size={24} className="level-icon moderate" />;
    case "LOW": return <AlertTriangle size={24} className="level-icon low" />;
  }
}

function getLevelColor(level: WellbeingLevel) {
  switch (level) {
    case "GOOD": return { bg: "#e8f5e9", border: "#4caf50", text: "#2e7d32" };
    case "MODERATE": return { bg: "#fff8e1", border: "#ffc107", text: "#f57c00" };
    case "LOW": return { bg: "#ffebee", border: "#f44336", text: "#c62828" };
  }
}

export function ReportWellbeing({ metrics, wearable, aggregates }: ReportWellbeingProps) {
  const physical = getPhysicalWellbeing(wearable);
  const psychological = getPsychologicalWellbeing(metrics, aggregates);
  const cognitive = getCognitiveWellbeing(metrics);

  const overallScore = Math.round((physical.score + psychological.score + cognitive.score) / 3);
  const overallLevel: WellbeingLevel = overallScore >= 70 ? "GOOD" : overallScore >= 50 ? "MODERATE" : "LOW";

  const areas = [
    { key: "physical", label: "Physical Well-being", icon: <Heart size={20} />, data: physical, description: "Sleep, HRV, activity, and cardiovascular health indicators" },
    { key: "psychological", label: "Psychological Well-being", icon: <Moon size={20} />, data: psychological, description: "Training consistency, engagement, and motivation patterns" },
    { key: "cognitive", label: "Cognitive Well-being", icon: <Brain size={20} />, data: cognitive, description: "Overall cognitive performance and functioning" },
  ];

  return (
    <section className="report-page">
      <h2 className="report-section-title">Well-being Indicators</h2>
      <p className="report-subtitle">
        Holistic assessment of factors influencing cognitive performance (WHO Quality of Life Framework)
      </p>

      {/* Overall Assessment */}
      <div className="wellbeing-overview" style={{ background: getLevelColor(overallLevel).bg, borderColor: getLevelColor(overallLevel).border }}>
        <div className="overview-main">
          {getLevelIcon(overallLevel)}
          <div className="overview-text">
            <h3 style={{ color: getLevelColor(overallLevel).text }}>
              {overallLevel === "GOOD" ? "GOOD OVERALL WELL-BEING" : overallLevel === "MODERATE" ? "MODERATE OVERALL WELL-BEING" : "ATTENTION RECOMMENDED"}
            </h3>
            <p>
              Based on analysis of physical, psychological, and cognitive indicators, the participant shows 
              {overallLevel === "GOOD" ? " healthy patterns supporting optimal cognitive function." : 
               overallLevel === "MODERATE" ? " adequate well-being with some areas for improvement." :
               " indicators that may benefit from attention and intervention."}
            </p>
          </div>
          <div className="overview-score">
            <span className="score-value" style={{ color: getLevelColor(overallLevel).text }}>{overallScore}</span>
            <span className="score-label">Composite Score</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="wellbeing-grid">
        {areas.map((area) => {
          const colors = getLevelColor(area.data.level);
          return (
            <div key={area.key} className="wellbeing-card" style={{ borderLeftColor: colors.border }}>
              <div className="card-header">
                <div className="header-icon" style={{ background: colors.bg, color: colors.text }}>
                  {area.icon}
                </div>
                <div className="header-text">
                  <h4>{area.label}</h4>
                  <span className="level-badge" style={{ background: colors.bg, color: colors.text }}>
                    {area.data.level} WELL-BEING
                  </span>
                </div>
                <div className="header-score" style={{ color: colors.text }}>
                  {area.data.score}
                </div>
              </div>
              <p className="card-description">{area.description}</p>
              <div className="card-factors">
                <span className="factors-label">Key Observations:</span>
                <ul>
                  {area.data.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Matrix */}
      <h3 className="report-subsection-title">Risk Classification Matrix</h3>
      <div className="risk-matrix">
        <div className="matrix-header">
          <span></span>
          <span className="risk-label low">LOW RISK</span>
          <span className="risk-label moderate">MODERATE RISK</span>
          <span className="risk-label high">HIGH RISK</span>
        </div>
        {areas.map((area) => (
          <div key={area.key} className="matrix-row">
            <span className="area-label">{area.label}</span>
            <div className={`matrix-cell ${area.data.level === "GOOD" ? "active" : ""}`}>
              {area.data.level === "GOOD" && <CheckCircle size={16} />}
            </div>
            <div className={`matrix-cell ${area.data.level === "MODERATE" ? "active" : ""}`}>
              {area.data.level === "MODERATE" && <MinusCircle size={16} />}
            </div>
            <div className={`matrix-cell ${area.data.level === "LOW" ? "active" : ""}`}>
              {area.data.level === "LOW" && <AlertTriangle size={16} />}
            </div>
          </div>
        ))}
      </div>

      {/* Scientific Note */}
      <div className="scientific-note">
        <strong>Reference:</strong> The well-being assessment framework is based on the WHO's definition of health as 
        "a state of complete physical, mental and social well-being" (WHO, 1946) and contemporary research linking 
        these factors to cognitive performance (Thayer et al., 2009; Walker, 2017).
      </div>
    </section>
  );
}
