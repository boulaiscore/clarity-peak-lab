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

  return (
    <section className="report-page">
      <h2 className="report-section-title">Physiological Integration</h2>
      <p className="report-subtitle">Wearable-based cognitive readiness factors</p>

      {hasWearableData ? (
        <div className="physio-grid">
          <div className="physio-card">
            <div className="physio-value">
              {wearable?.hrv_ms ?? "—"}
              <span className="physio-unit">ms</span>
            </div>
            <div className="physio-label">HRV</div>
          </div>
          <div className="physio-card">
            <div className="physio-value">
              {wearable?.sleep_efficiency ?? "—"}
              <span className="physio-unit">%</span>
            </div>
            <div className="physio-label">Sleep Quality</div>
          </div>
          <div className="physio-card">
            <div className="physio-value">
              {wearable?.sleep_duration_min ? Math.round(wearable.sleep_duration_min / 60 * 10) / 10 : "—"}
              <span className="physio-unit">h</span>
            </div>
            <div className="physio-label">Sleep</div>
          </div>
          <div className="physio-card">
            <div className="physio-value">{wearable?.activity_score ?? "—"}</div>
            <div className="physio-label">Activity</div>
          </div>
          <div className="physio-card">
            <div className="physio-value">
              {wearable?.resting_hr ?? "—"}
              <span className="physio-unit">bpm</span>
            </div>
            <div className="physio-label">Resting HR</div>
          </div>
        </div>
      ) : (
        <div className="physio-empty">
          Connect Garmin or another wearable to unlock physiological insights.<br />
          Readiness Score: {Math.round(metrics.cognitive_readiness_score ?? 50)}
        </div>
      )}
    </section>
  );
}