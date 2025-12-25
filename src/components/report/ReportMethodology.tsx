import React from "react";

export function ReportMethodology() {
  return (
    <section className="report-page">
      <h2 className="report-section-title">Methodology & Disclaimer</h2>
      <p className="report-subtitle">Scientific foundation and data sources</p>

      <div className="methodology-grid">
        <div className="methodology-card">
          <h4>Framework</h4>
          <p>Based on Kahneman's Dual-Process Theory: System 1 (fast, intuitive) and System 2 (slow, analytical) cognitive processing.</p>
        </div>
        <div className="methodology-card">
          <h4>Data Sources</h4>
          <ul>
            <li>NeuroLab training sessions</li>
            <li>Initial assessment baseline</li>
            <li>Wearable physiological data</li>
          </ul>
        </div>
        <div className="methodology-card">
          <h4>Metric Calculation</h4>
          <p>SCI = weighted composite of thinking systems, domain performance, and training consistency.</p>
        </div>
        <div className="methodology-card">
          <h4>Performance Levels</h4>
          <ul>
            <li>Elite: 85+ (top performers)</li>
            <li>High: 70-84 (above average)</li>
            <li>Moderate: 50-69 (average)</li>
            <li>Developing: &lt;50 (growth focus)</li>
          </ul>
        </div>
      </div>

      <div className="report-footer">
        <span>NeuroLoop Pro · Cognitive Intelligence Report</span>
        <span>For informational purposes only · Not medical advice</span>
      </div>
    </section>
  );
}