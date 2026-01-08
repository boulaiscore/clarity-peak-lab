import React from "react";
import { BarChart3, TrendingUp, Clock, Target, Calendar, Flame, Award } from "lucide-react";

type Area = "focus" | "reasoning" | "creativity";

interface ReportTrainingAnalyticsProps {
  profile: { daily_time_commitment?: string | null; session_duration?: string | null };
  metrics: { total_sessions?: number; experience_points?: number | null; cognitive_level?: number | null };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
    accuracyRatePct: number;
    preferredDuration?: string;
    mostUsedExercises: { exerciseId: string; count: number }[];
    last30DaysHeatmap?: { date: string; count: number }[];
  };
  sessions?: Array<{
    score: number;
    completed_at: string;
    area: string;
  }>;
}

export function ReportTrainingAnalytics({ profile, metrics, aggregates, sessions = [] }: ReportTrainingAnalyticsProps) {
  const totalSessions = metrics.total_sessions ?? 0;
  const accuracy = aggregates.accuracyRatePct ?? 0;
  const preferredDuration = aggregates.preferredDuration ?? profile.session_duration ?? "2min";
  const xp = metrics.experience_points ?? 0;
  const level = metrics.cognitive_level ?? 1;

  const areaData = [
    { name: "Focus Arena", key: "focus" as Area, color: "#7e57c2", icon: "🎯" },
    { name: "Critical Reasoning", key: "reasoning" as Area, color: "#42a5f5", icon: "🧠" },
    { name: "Creativity Hub", key: "creativity" as Area, color: "#ec407a", icon: "💡" },
  ];
  const maxSessions = Math.max(...Object.values(aggregates.sessionsByArea), 1);

  // Calculate weekly trend (last 4 weeks)
  const weeklyTrend = React.useMemo(() => {
    if (!sessions.length) return [];
    const now = new Date();
    const weeks: { week: number; sessions: number; avgScore: number }[] = [];
    
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w * 7 + now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekSessions = sessions.filter(s => {
        const d = new Date(s.completed_at);
        return d >= weekStart && d < weekEnd;
      });
      
      weeks.push({
        week: 4 - w,
        sessions: weekSessions.length,
        avgScore: weekSessions.length > 0 
          ? weekSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / weekSessions.length 
          : 0,
      });
    }
    return weeks;
  }, [sessions]);

  const maxWeekSessions = Math.max(...weeklyTrend.map(w => w.sessions), 1);

  // Training frequency heatmap data
  const heatmap = aggregates.last30DaysHeatmap ?? [];
  const maxHeatCount = Math.max(...heatmap.map(h => h.count), 1);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Training Performance Analytics</h2>
      <p className="report-subtitle">Session data, exercise patterns, and progression tracking</p>

      {/* Primary Stats Grid */}
      <div className="training-stats-grid">
        <div className="training-stat-card">
          <BarChart3 size={20} className="stat-icon" />
          <span className="training-stat-value">{totalSessions}</span>
          <span className="training-stat-label">Total Sessions</span>
        </div>
        <div className="training-stat-card">
          <Target size={20} className="stat-icon" />
          <span className="training-stat-value">{accuracy.toFixed(0)}%</span>
          <span className="training-stat-label">Accuracy Rate</span>
        </div>
        <div className="training-stat-card">
          <Clock size={20} className="stat-icon" />
          <span className="training-stat-value">{preferredDuration}</span>
          <span className="training-stat-label">Preferred Duration</span>
        </div>
        <div className="training-stat-card">
          <Flame size={20} className="stat-icon" />
          <span className="training-stat-value">{profile.daily_time_commitment ?? "10min"}</span>
          <span className="training-stat-label">Daily Goal</span>
        </div>
      </div>

      {/* XP & Level */}
      <div className="xp-level-row">
        <div className="xp-card">
          <Award size={20} color="#ffc107" />
          <div className="xp-content">
            <span className="xp-value">{xp.toLocaleString()} XP</span>
            <span className="xp-label">Experience Points</span>
          </div>
        </div>
        <div className="level-card">
          <div className="level-badge">Lvl {level}</div>
          <span className="level-label">Cognitive Level</span>
        </div>
      </div>

      {/* Sessions by Area */}
      <h3 className="report-subsection-title">Sessions by Domain</h3>
      <div className="area-bars">
        {areaData.map((area) => {
          const count = aggregates.sessionsByArea[area.key] ?? 0;
          const avg = aggregates.avgScoreByArea[area.key] ?? 0;
          const pct = (count / maxSessions) * 100;
          return (
            <div key={area.key} className="area-bar-row">
              <span className="area-bar-icon">{area.icon}</span>
              <span className="area-bar-label">{area.name}</span>
              <div className="area-bar-container">
                <div className="area-bar-fill" style={{ width: `${pct}%`, backgroundColor: area.color }} />
              </div>
              <span className="area-bar-count">{count}</span>
              <span className="area-bar-avg" style={{ color: area.color }}>{Math.round(avg)}%</span>
            </div>
          );
        })}
      </div>

      {/* Weekly Trend Chart */}
      {weeklyTrend.length > 0 && (
        <>
          <h3 className="report-subsection-title">4-Week Training Trend</h3>
          <div className="weekly-trend-chart">
            {weeklyTrend.map((week) => (
              <div key={week.week} className="trend-bar-column">
                <div className="trend-bar-wrapper">
                  <div 
                    className="trend-bar" 
                    style={{ height: `${(week.sessions / maxWeekSessions) * 100}%` }}
                  />
                </div>
                <span className="trend-count">{week.sessions}</span>
                <span className="trend-label">W{week.week}</span>
                <span className="trend-score">{week.avgScore > 0 ? `${Math.round(week.avgScore)}%` : '—'}</span>
              </div>
            ))}
            <div className="trend-legend">
              <TrendingUp size={12} />
              <span>Sessions per week</span>
            </div>
          </div>
        </>
      )}

      {/* Training Heatmap */}
      {heatmap.length > 0 && (
        <>
          <h3 className="report-subsection-title">30-Day Activity Heatmap</h3>
          <div className="training-heatmap">
            {heatmap.map((day) => {
              const intensity = day.count / maxHeatCount;
              const opacity = 0.15 + intensity * 0.85;
              return (
                <div
                  key={day.date}
                  className="heatmap-cell"
                  style={{ backgroundColor: `rgba(0, 137, 123, ${opacity})` }}
                  title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
          <div className="heatmap-legend">
            <span className="heatmap-legend-label">Less</span>
            <div className="heatmap-legend-gradient" />
            <span className="heatmap-legend-label">More</span>
          </div>
        </>
      )}

      {/* Top Exercises */}
      {aggregates.mostUsedExercises.length > 0 && (
        <>
          <h3 className="report-subsection-title">Most Practiced Exercises</h3>
          <div className="exercises-grid">
            {aggregates.mostUsedExercises.slice(0, 6).map((ex, i) => (
              <div key={ex.exerciseId} className="exercise-tag">
                <span className="exercise-rank">#{i + 1}</span>
                <span className="exercise-name">{ex.exerciseId}</span>
                <span className="exercise-count">×{ex.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="training-analytics-note">
        <em>Training consistency is a key predictor of cognitive improvement (Jaeggi et al., 2008). 
        Regular engagement across all domains ensures balanced cognitive development.</em>
      </p>
    </section>
  );
}
