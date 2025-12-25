import React from "react";

export function ReportMethodology() {
  return (
    <section className="report-page methodology-page">
      <h2 className="report-section-title">Methodology & Framework</h2>

      <div className="methodology-content">
        <div className="methodology-section">
          <h3 className="methodology-heading">Scientific Foundation</h3>
          <p>
            NeuroLoop's assessment framework is built on Daniel Kahneman's Dual-Process Theory of cognition,
            distinguishing between <strong>System 1 (Fast Thinking)</strong> — intuitive, automatic responses — and
            <strong> System 2 (Slow Thinking)</strong> — deliberate, analytical processing.
          </p>
        </div>

        <div className="methodology-section">
          <h3 className="methodology-heading">Data Sources</h3>
          <ul className="methodology-list">
            <li>NeuroLab training sessions and drill performance</li>
            <li>Initial baseline cognitive assessment</li>
            <li>Wearable biometric data (if connected)</li>
            <li>Session consistency and progression patterns</li>
          </ul>
        </div>

        <div className="methodology-section">
          <h3 className="methodology-heading">Metric Calculation</h3>
          <p>
            All scores are normalized to a 0-100 scale. The Strategic Cognitive Index (SCI) represents a 
            weighted composite of dual-process integration, domain performance, and training consistency.
            Deltas show improvement from baseline assessment.
          </p>
        </div>

        <div className="methodology-section">
          <h3 className="methodology-heading">Performance Levels</h3>
          <div className="levels-grid">
            <div className="level-item">
              <span className="level-badge elite">Elite</span>
              <span className="level-range">85-100</span>
            </div>
            <div className="level-item">
              <span className="level-badge high">High</span>
              <span className="level-range">70-84</span>
            </div>
            <div className="level-item">
              <span className="level-badge moderate">Moderate</span>
              <span className="level-range">50-69</span>
            </div>
            <div className="level-item">
              <span className="level-badge developing">Developing</span>
              <span className="level-range">0-49</span>
            </div>
          </div>
        </div>

        <div className="methodology-section references">
          <h3 className="methodology-heading">References</h3>
          <p className="reference-text">
            Kahneman, D. (2011). <em>Thinking, Fast and Slow.</em> Farrar, Straus and Giroux.
          </p>
        </div>
      </div>

      <div className="disclaimer">
        <h3 className="disclaimer-title">Disclaimer</h3>
        <p>
          This report provides cognitive performance metrics for informational and self-improvement purposes only.
          It is not a clinical assessment and should not be used for medical diagnosis.
          NeuroLoop is designed for individuals seeking to optimize their cognitive performance.
        </p>
      </div>

      <div className="report-footer">
        <p>NeuroLoop Labs — Cognitive Intelligence Platform</p>
        <p>support@neurolooplabs.com</p>
      </div>
    </section>
  );
}
