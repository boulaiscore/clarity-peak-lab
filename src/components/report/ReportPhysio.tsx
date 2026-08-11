import React from "react";
import { Heart, Moon, Activity, Zap, TrendingUp, AlertCircle } from "lucide-react";

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

function getHRVInterpretation(hrv: number) {
  if (hrv >= 60) return { label: "Excellent", desc: "High parasympathetic activity, optimal recovery" };
  if (hrv >= 40) return { label: "Good", desc: "Adequate autonomic balance" };
  if (hrv >= 20) return { label: "Moderate", desc: "Consider recovery optimization" };
  return { label: "Low", desc: "May indicate stress or fatigue" };
}

function getSleepInterpretation(efficiency: number) {
  if (efficiency >= 85) return { label: "Excellent", desc: "Optimal sleep consolidation" };
  if (efficiency >= 75) return { label: "Good", desc: "Adequate sleep quality" };
  return { label: "Suboptimal", desc: "May impact cognitive function" };
}

export function ReportPhysio({ metrics, wearable }: ReportPhysioProps) {
  const hasWearableData = wearable && (wearable.hrv_ms || wearable.sleep_efficiency);
  const physioScore = metrics.physio_component_score ?? null;
  const readinessClass = metrics.readiness_classification ?? "MEDIUM";

  const getReadinessColor = (classification: string) => {
    switch (classification.toUpperCase()) {
      case "HIGH": return "#00897b";
      case "MEDIUM": return "#ffb74d";
      case "LOW": return "#e57373";
      default: return "#718096";
    }
  };

  return (
    <section className="report-page">
      <h2 className="report-section-title">Psychophysiological Integration</h2>
      <p className="report-subtitle">Wearable-derived biomarkers influencing cognitive readiness (Thayer et al., 2009)</p>

      {hasWearableData ? (
        <>
          <div className="physio-overview">
            <div className="physio-readiness-card" style={{ borderColor: getReadinessColor(readinessClass) }}>
              <div className="readiness-header">
                <TrendingUp size={24} color={getReadinessColor(readinessClass)} />
                <span className="readiness-label">Cognitive Readiness</span>
              </div>
              <div className="readiness-score" style={{ color: getReadinessColor(readinessClass) }}>
                {readinessClass}
              </div>
              <p className="readiness-desc">
                Composite index integrating physiological and cognitive metrics to estimate daily performance potential.
              </p>
            </div>
          </div>

          <h3 className="report-subsection-title">Biomarker Analysis</h3>
          <p className="physio-intro">
            These physiological indicators provide contextual signals for the personal state estimate; they are not direct measurements of cognitive ability:
          </p>

          <div className="physio-grid">
            <div className="physio-card">
              <div className="physio-card-header">
                <Heart size={20} color="#e57373" />
                <span>Heart Rate Variability</span>
              </div>
              <div className="physio-value">
                {wearable?.hrv_ms ?? "—"}
                <span className="physio-unit">ms</span>
              </div>
              {wearable?.hrv_ms && (
                <div className="physio-interpretation">
                  <span className={`interpretation-badge ${getHRVInterpretation(wearable.hrv_ms).label.toLowerCase()}`}>
                    {getHRVInterpretation(wearable.hrv_ms).label}
                  </span>
                  <span className="interpretation-desc">{getHRVInterpretation(wearable.hrv_ms).desc}</span>
                </div>
              )}
              <p className="physio-reference">Higher HRV correlates with better executive function (Thayer et al., 2009)</p>
            </div>

            <div className="physio-card">
              <div className="physio-card-header">
                <Moon size={20} color="#7e57c2" />
                <span>Sleep Efficiency</span>
              </div>
              <div className="physio-value">
                {wearable?.sleep_efficiency ?? "—"}
                <span className="physio-unit">%</span>
              </div>
              {wearable?.sleep_efficiency && (
                <div className="physio-interpretation">
                  <span className={`interpretation-badge ${getSleepInterpretation(wearable.sleep_efficiency).label.toLowerCase()}`}>
                    {getSleepInterpretation(wearable.sleep_efficiency).label}
                  </span>
                  <span className="interpretation-desc">{getSleepInterpretation(wearable.sleep_efficiency).desc}</span>
                </div>
              )}
              <p className="physio-reference">Sleep quality impacts memory consolidation (Walker, 2017)</p>
            </div>

            <div className="physio-card">
              <div className="physio-card-header">
                <Moon size={20} color="#42a5f5" />
                <span>Sleep Duration</span>
              </div>
              <div className="physio-value">
                {wearable?.sleep_duration_min ? (wearable.sleep_duration_min / 60).toFixed(1) : "—"}
                <span className="physio-unit">hours</span>
              </div>
              <p className="physio-reference">7-9 hours optimal for cognitive function (Hirshkowitz et al., 2015)</p>
            </div>

            <div className="physio-card">
              <div className="physio-card-header">
                <Heart size={20} color="#ff7043" />
                <span>Resting Heart Rate</span>
              </div>
              <div className="physio-value">
                {wearable?.resting_hr ?? "—"}
                <span className="physio-unit">bpm</span>
              </div>
              <p className="physio-reference">Lower RHR indicates better cardiovascular fitness</p>
            </div>

            <div className="physio-card">
              <div className="physio-card-header">
                <Activity size={20} color="#4db6ac" />
                <span>Activity Score</span>
              </div>
              <div className="physio-value">
                {wearable?.activity_score ?? "—"}
                <span className="physio-unit">/100</span>
              </div>
              <p className="physio-reference">Physical activity enhances neuroplasticity (Hillman et al., 2008)</p>
            </div>

            {physioScore !== null && (
              <div className="physio-card highlight">
                <div className="physio-card-header">
                  <Zap size={20} color="#00897b" />
                  <span>Physio Component Score</span>
                </div>
                <div className="physio-value" style={{ color: "#00897b" }}>
                  {Math.round(physioScore)}
                  <span className="physio-unit">/100</span>
                </div>
                <p className="physio-reference">Weighted composite of physiological markers</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="physio-empty">
          <div className="empty-icon">
            <AlertCircle size={48} color="#718096" />
          </div>
          <h3>Wearable Data Not Connected</h3>
          <p>
            Connect a compatible wearable device (Garmin, Apple Watch, Oura) to unlock physiological insights 
            that enhance cognitive readiness predictions.
          </p>
          <div className="empty-readiness">
            <span className="readiness-label">Estimated Readiness Score</span>
            <span className="readiness-value">{Math.round(metrics.cognitive_readiness_score ?? 50)}</span>
            <span className="readiness-note">Based on cognitive metrics only</span>
          </div>
        </div>
      )}
    </section>
  );
}
