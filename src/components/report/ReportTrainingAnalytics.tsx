import React from "react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportTrainingAnalyticsProps {
  profile: {
    daily_time_commitment?: string | null;
    session_duration?: string | null;
  };
  metrics: {
    total_sessions?: number;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
    accuracyRatePct: number;
    preferredDuration?: string;
    mostUsedExercises: { exerciseId: string; count: number }[];
  };
}

export function ReportTrainingAnalytics({ profile, metrics, aggregates }: ReportTrainingAnalyticsProps) {
  const totalSessions = metrics.total_sessions ?? 0;
  const accuracy = aggregates.accuracyRatePct ?? 0;
  const preferredDuration = aggregates.preferredDuration ?? profile.session_duration ?? "2min";

  const areaData = [
    { name: "Focus Arena", key: "focus" as Area, color: "var(--report-focus)" },
    { name: "Critical Reasoning", key: "reasoning" as Area, color: "var(--report-reasoning)" },
    { name: "Creativity Hub", key: "creativity" as Area, color: "var(--report-creativity)" },
  ];

  const maxSessions = Math.max(...Object.values(aggregates.sessionsByArea), 1);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Training Performance Analytics</h2>
      <p className="report-subtitle">Session data and exercise patterns</p>

      <div className="training-stats-grid">
        <div className="training-stat-card">
          <span className="training-stat-value">{totalSessions}</span>
          <span className="training-stat-label">Total Sessions</span>
        </div>
        <div className="training-stat-card">
          <span className="training-stat-value">{accuracy.toFixed(1)}%</span>
          <span className="training-stat-label">Accuracy Rate</span>
        </div>
        <div className="training-stat-card">
          <span className="training-stat-value">{preferredDuration}</span>
          <span className="training-stat-label">Preferred Duration</span>
        </div>
        <div className="training-stat-card">
          <span className="training-stat-value">{profile.daily_time_commitment ?? "10min"}</span>
          <span className="training-stat-label">Daily Commitment</span>
        </div>
      </div>

      <h3 className="report-subsection-title">Sessions by Area</h3>
      <div className="area-bars">
        {areaData.map((area) => {
          const count = aggregates.sessionsByArea[area.key] ?? 0;
          const avg = aggregates.avgScoreByArea[area.key] ?? 0;
          const width = (count / maxSessions) * 100;

          return (
            <div key={area.key} className="area-bar-row">
              <span className="area-bar-label">{area.name}</span>
              <div className="area-bar-container">
                <div
                  className="area-bar-fill"
                  style={{ width: `${width}%`, backgroundColor: area.color }}
                />
              </div>
              <span className="area-bar-count">{count}</span>
              <span className="area-bar-avg">{Math.round(avg)}% avg</span>
            </div>
          );
        })}
      </div>

      {aggregates.mostUsedExercises.length > 0 && (
        <>
          <h3 className="report-subsection-title">Most Trained Exercises</h3>
          <div className="exercises-list">
            {aggregates.mostUsedExercises.slice(0, 5).map((ex, i) => (
              <div key={ex.exerciseId} className="exercise-item">
                <span className="exercise-rank">{i + 1}</span>
                <span className="exercise-id">{ex.exerciseId}</span>
                <span className="exercise-count">{ex.count}x</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
