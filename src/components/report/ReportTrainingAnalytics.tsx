import React from "react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportTrainingAnalyticsProps {
  profile: { daily_time_commitment?: string | null; session_duration?: string | null };
  metrics: { total_sessions?: number };
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
    { name: "Focus Arena", key: "focus" as Area, color: "#7e57c2" },
    { name: "Critical Reasoning", key: "reasoning" as Area, color: "#42a5f5" },
    { name: "Creativity Hub", key: "creativity" as Area, color: "#ec407a" },
  ];
  const maxSessions = Math.max(...Object.values(aggregates.sessionsByArea), 1);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Training Performance Analytics</h2>
      <p className="report-subtitle">Session data and exercise patterns</p>
      <div className="training-stats-grid">
        <div className="training-stat-card"><span className="training-stat-value">{totalSessions}</span><span className="training-stat-label">Total Sessions</span></div>
        <div className="training-stat-card"><span className="training-stat-value">{accuracy.toFixed(0)}%</span><span className="training-stat-label">Accuracy</span></div>
        <div className="training-stat-card"><span className="training-stat-value">{preferredDuration}</span><span className="training-stat-label">Preferred</span></div>
        <div className="training-stat-card"><span className="training-stat-value">{profile.daily_time_commitment ?? "10min"}</span><span className="training-stat-label">Daily Goal</span></div>
      </div>
      <h3 className="report-subsection-title">Sessions by Area</h3>
      <div className="area-bars">
        {areaData.map((area) => {
          const count = aggregates.sessionsByArea[area.key] ?? 0;
          const avg = aggregates.avgScoreByArea[area.key] ?? 0;
          return (
            <div key={area.key} className="area-bar-row">
              <span className="area-bar-label">{area.name}</span>
              <div className="area-bar-container"><div className="area-bar-fill" style={{ width: `${(count / maxSessions) * 100}%`, backgroundColor: area.color }} /></div>
              <span className="area-bar-count">{count}</span>
              <span className="area-bar-avg">{Math.round(avg)}%</span>
            </div>
          );
        })}
      </div>
      {aggregates.mostUsedExercises.length > 0 && (
        <>
          <h3 className="report-subsection-title">Top Exercises</h3>
          <div className="exercises-grid">
            {aggregates.mostUsedExercises.slice(0, 6).map((ex) => (
              <div key={ex.exerciseId} className="exercise-tag">{ex.exerciseId}<span>×{ex.count}</span></div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}