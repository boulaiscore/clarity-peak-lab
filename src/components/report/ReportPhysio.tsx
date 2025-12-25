import React from "react";

interface ReportPhysioProps {
  metrics: {
    physio_component_score?: number | null;
    cognitive_readiness_score?: number | null;
    readiness_classification?: string | null;
  };
  wearable: {
    hrv_ms?: number | null;
    sleep_efficiency?: number | null;
    sleep_duration_min?: number | null;
    resting_hr?: number | null;
    activity_score?: number | null;
  } | null;
}

export function ReportPhysio({ metrics, wearable }: ReportPhysioProps) {
  const hasWearableData = wearable && (wearable.hrv_ms || wearable.sleep_efficiency);

  if (!hasWearableData) {
    return (
      <section className="report-page">
        <h2 className="report-section-title">Physiological Integration</h2>
        <p className="report-subtitle">Biometric factors affecting cognitive performance</p>
        <div className="no-wearable-message">
          <div className="wearable-icon">⌚</div>
          <p>Connect a wearable device (Garmin, Oura, Whoop) to unlock physiological insights.</p>
          <p className="wearable-benefits">
            Track HRV, sleep quality, and activity levels to understand their impact on your cognitive readiness.
          </p>
        </div>
      </section>
    );
  }

  const physioMetrics = [
    {
      label: "HRV",
      value: wearable.hrv_ms,
      unit: "ms",
      description: "Heart Rate Variability",
    },
    {
      label: "Sleep Efficiency",
      value: wearable.sleep_efficiency,
      unit: "%",
      description: "Quality of sleep cycles",
    },
    {
      label: "Sleep Duration",
      value: wearable.sleep_duration_min ? Math.round(wearable.sleep_duration_min / 60 * 10) / 10 : null,
      unit: "hrs",
      description: "Total sleep time",
    },
    {
      label: "Resting HR",
      value: wearable.resting_hr,
      unit: "bpm",
      description: "Resting heart rate",
    },
    {
      label: "Activity Score",
      value: wearable.activity_score,
      unit: "",
      description: "Daily activity level",
    },
  ];

  const readinessScore = metrics.cognitive_readiness_score ?? 50;
  const readinessClass = metrics.readiness_classification ?? "Moderate";
  const physioScore = metrics.physio_component_score ?? 50;

  return (
    <section className="report-page">
      <h2 className="report-section-title">Physiological Integration</h2>
      <p className="report-subtitle">Biometric factors affecting cognitive performance</p>

      <div className="physio-readiness">
        <div className="readiness-score-container">
          <div className="readiness-score">{Math.round(readinessScore)}</div>
          <div className="readiness-label">Cognitive Readiness</div>
          <div className="readiness-class">{readinessClass}</div>
        </div>
        <div className="physio-score-container">
          <div className="physio-score">{Math.round(physioScore)}</div>
          <div className="physio-label">Physio Component</div>
        </div>
      </div>

      <div className="physio-metrics-grid">
        {physioMetrics.map((metric) => (
          metric.value !== null && metric.value !== undefined && (
            <div key={metric.label} className="physio-metric-card">
              <span className="physio-metric-value">
                {typeof metric.value === 'number' ? Math.round(metric.value) : metric.value}
                <span className="physio-metric-unit">{metric.unit}</span>
              </span>
              <span className="physio-metric-label">{metric.label}</span>
              <span className="physio-metric-desc">{metric.description}</span>
            </div>
          )
        ))}
      </div>

      <p className="report-footnote">
        Physiological data correlates with cognitive performance. Higher HRV and better sleep typically enhance focus and reasoning capacity.
      </p>
    </section>
  );
}
