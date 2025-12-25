import React, { useMemo } from "react";

function goalsBadge(goals: string[]) {
  const hasFast = goals?.includes("fast_thinking");
  const hasSlow = goals?.includes("slow_thinking");
  if (hasFast && hasSlow) return "⚖️ Balanced Thinker";
  if (hasFast) return "⚡ Fast Thinker";
  if (hasSlow) return "🧠 Deep Thinker";
  return "🎯 Adaptive";
}

export function ReportCover({ profile, metrics, generatedAt }: any) {
  const badge = useMemo(() => goalsBadge(profile.training_goals ?? []), [profile]);
  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const level = metrics.cognitive_level ?? 1;
  const totalSessions = metrics.total_sessions ?? 0;

  return (
    <section className="report-page report-cover">
      <div className="report-cover-header">
        <div className="report-cover-logo">NeuroLoop Pro</div>
        <div className="report-cover-date">{generatedAt.toLocaleDateString("en-GB")}</div>
      </div>

      <div className="report-cover-main">
        <h1 className="report-cover-title">Cognitive<br />Intelligence Report</h1>
        <p className="report-cover-user">{profile.name ?? "User"}</p>

        <div className="report-cover-stats">
          <div className="report-cover-stat">
            <span className="report-cover-stat-value">{sci}</span>
            <span className="report-cover-stat-label">SCI Score</span>
          </div>
          <div className="report-cover-stat">
            <span className="report-cover-stat-value">{level}</span>
            <span className="report-cover-stat-label">Level</span>
          </div>
          <div className="report-cover-stat">
            <span className="report-cover-stat-value">{totalSessions}</span>
            <span className="report-cover-stat-label">Sessions</span>
          </div>
        </div>

        <div className="report-cover-badge">{badge}</div>
      </div>
    </section>
  );
}
