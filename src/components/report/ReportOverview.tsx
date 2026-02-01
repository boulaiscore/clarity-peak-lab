import React from "react";
import { FileText, Brain, Lightbulb, BarChart3, User, Target, Clock } from "lucide-react";

interface ReportOverviewProps {
  profile: {
    name?: string | null;
    work_type?: string | null;
    education_level?: string | null;
    training_goals?: string[] | null;
    daily_time_commitment?: string | null;
    session_duration?: string | null;
  };
  generatedAt: Date;
}

export function ReportOverview({ profile, generatedAt }: ReportOverviewProps) {
  const goals = profile.training_goals || [];
  const hasSystem1 = goals.includes("fast_thinking");
  const hasSystem2 = goals.includes("slow_thinking");
  
  const trainingFocus = hasSystem1 && hasSystem2 
    ? "Dual-Process Optimization" 
    : hasSystem1 
      ? "System 1 Enhancement" 
      : hasSystem2 
        ? "System 2 Development" 
        : "General Cognitive Training";

  return (
    <section className="report-page">
      <h2 className="report-section-title">Assessment Overview</h2>
      <p className="report-subtitle">
        {profile.name || "Participant"} completed the LUMA Cognitive Assessment Battery (CAB) on {generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
      </p>

      {/* Description Box */}
      <div className="overview-description">
        <h3>ABOUT THE LUMA COGNITIVE ASSESSMENT</h3>
        <p>
          The LUMA Cognitive Assessment Battery (CAB) is a comprehensive neurocognitive evaluation system
          designed to measure cognitive performance across multiple domains. Based on evidence-based principles 
          from cognitive neuroscience, this assessment evaluates both <strong>System 1 (intuitive, fast)</strong> and 
          <strong> System 2 (analytical, slow)</strong> cognitive processing, along with domain-specific capabilities.
        </p>
        <p>
          This automated report analyzes training data to provide insights into cognitive functioning, 
          identify strengths and areas for development, and generate personalized recommendations 
          for cognitive optimization.
        </p>
      </div>

      {/* Report Structure */}
      <h3 className="report-subsection-title">This Report Contains</h3>
      <div className="overview-parts-grid">
        <div className="overview-part">
          <div className="part-number">01</div>
          <div className="part-content">
            <div className="part-icon"><User size={20} /></div>
            <h4>Well-being Indicators</h4>
            <p>Physical, psychological, and cognitive well-being assessment based on training patterns and wearable data integration.</p>
          </div>
        </div>
        <div className="overview-part">
          <div className="part-number">02</div>
          <div className="part-content">
            <div className="part-icon"><Brain size={20} /></div>
            <h4>Cognitive Profile</h4>
            <p>Detailed analysis of dual-process thinking, domain scores, and meta-cognitive indicators with percentile comparisons.</p>
          </div>
        </div>
        <div className="overview-part">
          <div className="part-number">03</div>
          <div className="part-content">
            <div className="part-icon"><BarChart3 size={20} /></div>
            <h4>Training Analytics</h4>
            <p>Performance trends, session statistics, and exercise breakdown with longitudinal progression data.</p>
          </div>
        </div>
        <div className="overview-part">
          <div className="part-number">04</div>
          <div className="part-content">
            <div className="part-icon"><Lightbulb size={20} /></div>
            <h4>Conclusions & Recommendations</h4>
            <p>Personalized action plan, priority training areas, and evidence-based recommendations for optimization.</p>
          </div>
        </div>
      </div>

      {/* User Training Configuration */}
      <h3 className="report-subsection-title">Training Configuration</h3>
      <div className="config-grid">
        <div className="config-item">
          <Target size={18} />
          <div>
            <span className="config-label">Training Focus</span>
            <span className="config-value">{trainingFocus}</span>
          </div>
        </div>
        <div className="config-item">
          <Clock size={18} />
          <div>
            <span className="config-label">Daily Time Commitment</span>
            <span className="config-value">{profile.daily_time_commitment || "10min"}</span>
          </div>
        </div>
        <div className="config-item">
          <FileText size={18} />
          <div>
            <span className="config-label">Preferred Session Duration</span>
            <span className="config-value">{profile.session_duration || "2min"}</span>
          </div>
        </div>
      </div>

      {/* Score Interpretation Guide */}
      <h3 className="report-subsection-title">Score Interpretation Guide</h3>
      <div className="interpretation-guide-box">
        <p className="guide-intro">
          Scores in this report are presented on a 0-100 scale, normalized for age and cognitive training history. 
          The following classifications are used throughout:
        </p>
        <div className="score-legend">
          <div className="legend-row">
            <div className="legend-color elite"></div>
            <div className="legend-info">
              <span className="legend-range">85-100</span>
              <span className="legend-label">ELITE</span>
              <span className="legend-desc">Top-tier performance, cognitive strengths</span>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-color high"></div>
            <div className="legend-info">
              <span className="legend-range">70-84</span>
              <span className="legend-label">HIGH</span>
              <span className="legend-desc">Above average, strong capability</span>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-color moderate"></div>
            <div className="legend-info">
              <span className="legend-range">50-69</span>
              <span className="legend-label">MODERATE</span>
              <span className="legend-desc">Average performance, room for growth</span>
            </div>
          </div>
          <div className="legend-row">
            <div className="legend-color developing"></div>
            <div className="legend-info">
              <span className="legend-range">0-49</span>
              <span className="legend-label">DEVELOPING</span>
              <span className="legend-desc">Priority training area, cognitive weakness</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
