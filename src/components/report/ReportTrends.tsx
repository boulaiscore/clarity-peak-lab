import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

interface Session {
  id: string;
  area: string;
  score: number;
  completed_at: string;
}

interface ReportTrendsProps {
  sessions: Session[];
  metrics: {
    fast_thinking?: number;
    slow_thinking?: number;
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function groupByWeek(sessions: Session[]) {
  const weekMap = new Map<string, { focus: number[]; reasoning: number[]; creativity: number[]; all: number[] }>();
  
  // Sort sessions by date ascending
  const sorted = [...sessions].sort((a, b) => 
    new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );
  
  for (const s of sorted) {
    const d = new Date(s.completed_at);
    // Get week start (Monday)
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const weekKey = weekStart.toISOString().slice(0, 10);
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { focus: [], reasoning: [], creativity: [], all: [] });
    }
    
    const week = weekMap.get(weekKey)!;
    week.all.push(s.score);
    
    if (s.area === "focus") week.focus.push(s.score);
    else if (s.area === "reasoning") week.reasoning.push(s.score);
    else if (s.area === "creativity") week.creativity.push(s.score);
  }
  
  return Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week: formatDate(week),
      weekRaw: week,
      focus: data.focus.length ? Math.round(data.focus.reduce((a, b) => a + b, 0) / data.focus.length) : null,
      reasoning: data.reasoning.length ? Math.round(data.reasoning.reduce((a, b) => a + b, 0) / data.reasoning.length) : null,
      creativity: data.creativity.length ? Math.round(data.creativity.reduce((a, b) => a + b, 0) / data.creativity.length) : null,
      overall: data.all.length ? Math.round(data.all.reduce((a, b) => a + b, 0) / data.all.length) : null,
      sessions: data.all.length,
    }))
    .slice(-12); // Last 12 weeks
}

export function ReportTrends({ sessions, metrics }: ReportTrendsProps) {
  const weeklyData = useMemo(() => groupByWeek(sessions), [sessions]);
  
  const hasEnoughData = weeklyData.length >= 2;
  
  // Calculate improvement from baseline
  const improvements = useMemo(() => {
    const items = [];
    
    if (metrics.baseline_fast_thinking !== null && metrics.fast_thinking) {
      const delta = metrics.fast_thinking - (metrics.baseline_fast_thinking ?? 50);
      items.push({ name: "System 1", baseline: metrics.baseline_fast_thinking ?? 50, current: metrics.fast_thinking, delta });
    }
    if (metrics.baseline_slow_thinking !== null && metrics.slow_thinking) {
      const delta = metrics.slow_thinking - (metrics.baseline_slow_thinking ?? 50);
      items.push({ name: "System 2", baseline: metrics.baseline_slow_thinking ?? 50, current: metrics.slow_thinking, delta });
    }
    if (metrics.baseline_focus !== null && metrics.focus_stability) {
      const delta = metrics.focus_stability - (metrics.baseline_focus ?? 50);
      items.push({ name: "Focus", baseline: metrics.baseline_focus ?? 50, current: metrics.focus_stability, delta });
    }
    if (metrics.baseline_reasoning !== null && metrics.reasoning_accuracy) {
      const delta = metrics.reasoning_accuracy - (metrics.baseline_reasoning ?? 50);
      items.push({ name: "Reasoning", baseline: metrics.baseline_reasoning ?? 50, current: metrics.reasoning_accuracy, delta });
    }
    if (metrics.baseline_creativity !== null && metrics.creativity) {
      const delta = metrics.creativity - (metrics.baseline_creativity ?? 50);
      items.push({ name: "Creativity", baseline: metrics.baseline_creativity ?? 50, current: metrics.creativity, delta });
    }
    
    return items;
  }, [metrics]);

  if (!hasEnoughData) {
    return (
      <section className="report-page">
        <h2 className="report-section-title">Performance Trends</h2>
        <p className="report-subtitle">Longitudinal analysis of cognitive training performance</p>
        
        <div className="trends-empty">
          <TrendingUp size={48} color="#e0e0e0" />
          <h3>Insufficient Data for Trend Analysis</h3>
          <p>
            Complete at least 2 weeks of training sessions to generate performance trend visualizations.
            Longitudinal tracking enables identification of cognitive growth patterns.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="report-page">
      <h2 className="report-section-title">Performance Trends</h2>
      <p className="report-subtitle">Longitudinal analysis of cognitive training performance over time</p>

      <div className="trends-intro">
        <Calendar size={16} />
        <span>Tracking {weeklyData.length} weeks of training data ({sessions.length} total sessions)</span>
      </div>

      <h3 className="report-subsection-title">Weekly Performance by Domain</h3>
      <div className="trends-chart-container">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7e57c2" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7e57c2" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReasoning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#42a5f5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCreativity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec407a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ec407a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#718096" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#718096" />
            <Tooltip 
              contentStyle={{ 
                background: '#fff', 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                fontSize: 12 
              }} 
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area 
              type="monotone" 
              dataKey="focus" 
              stroke="#7e57c2" 
              fillOpacity={1} 
              fill="url(#colorFocus)" 
              strokeWidth={2}
              name="Focus"
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey="reasoning" 
              stroke="#42a5f5" 
              fillOpacity={1} 
              fill="url(#colorReasoning)" 
              strokeWidth={2}
              name="Reasoning"
              connectNulls
            />
            <Area 
              type="monotone" 
              dataKey="creativity" 
              stroke="#ec407a" 
              fillOpacity={1} 
              fill="url(#colorCreativity)" 
              strokeWidth={2}
              name="Creativity"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h3 className="report-subsection-title">Overall Score Trend</h3>
      <div className="trends-chart-container">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#718096" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#718096" />
            <Tooltip 
              contentStyle={{ 
                background: '#fff', 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                fontSize: 12 
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="overall" 
              stroke="#00897b" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#00897b" }}
              name="Overall Score"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {improvements.length > 0 && (
        <>
          <h3 className="report-subsection-title">Progress from Baseline</h3>
          <p className="trends-baseline-intro">
            Comparison of current performance against initial assessment baseline scores:
          </p>
          <div className="trends-baseline-grid">
            {improvements.map((item) => (
              <div key={item.name} className="baseline-comparison-card">
                <div className="baseline-header">{item.name}</div>
                <div className="baseline-values">
                  <div className="baseline-value">
                    <span className="value-label">Baseline</span>
                    <span className="value-number">{Math.round(item.baseline)}</span>
                  </div>
                  <div className="baseline-arrow">→</div>
                  <div className="baseline-value">
                    <span className="value-label">Current</span>
                    <span className="value-number current">{Math.round(item.current)}</span>
                  </div>
                </div>
                <div className={`baseline-delta ${item.delta >= 0 ? 'positive' : 'negative'}`}>
                  {item.delta >= 0 ? '+' : ''}{Math.round(item.delta)} points
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="trends-insight">
        <TrendingUp size={20} color="#00897b" />
        <div>
          <strong>Trend Analysis:</strong> {
            weeklyData.length >= 4 && weeklyData[weeklyData.length - 1].overall && weeklyData[0].overall
              ? weeklyData[weeklyData.length - 1].overall! > weeklyData[0].overall!
                ? "Your performance shows an upward trajectory. Consistent training is yielding measurable cognitive improvements."
                : weeklyData[weeklyData.length - 1].overall! < weeklyData[0].overall!
                  ? "Recent performance shows a slight decline. Consider adjusting training intensity or ensuring adequate rest."
                  : "Your performance has remained stable. Consider increasing difficulty or exploring new cognitive domains."
              : "Continue training to establish a reliable performance trend pattern."
          }
        </div>
      </div>
    </section>
  );
}
