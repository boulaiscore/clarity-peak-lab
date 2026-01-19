// src/components/report/ClinicalReportMockup.tsx
// Medical-grade Sample Report Mockup
import React from "react";
import { Brain } from "lucide-react";

export function ClinicalReportMockup() {
  const generatedAt = new Date();
  const reportId = `NL-SAMPLE-${generatedAt.getTime().toString(36).toUpperCase()}`;
  
  // Mock data
  const profile = {
    name: "Sample Participant",
    age: 36,
    workType: "Knowledge Worker",
    education: "Master's Degree (Business)",
  };
  
  const observationWindow = {
    start: "20 Dec 2025",
    end: "19 Jan 2026",
  };
  
  const metrics = {
    sci: 76,
    sciPercentile: 85,
    cri: 72,
    cognitiveAge: 32,
    s1Score: 74,
    s2Score: 71,
    totalSessions: 47,
    accuracy: 78.4,
    xp: 12450,
    level: 8,
    focus: 72,
    reasoning: 75,
    creativity: 68,
    fast: 74,
    slow: 71,
  };

  return (
    <div className="clinical-report relative">
      {/* Sample Report Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden print:hidden">
        <div className="text-[60px] font-bold text-gray-300/30 rotate-[-30deg] whitespace-nowrap select-none tracking-widest">
          SAMPLE REPORT
        </div>
      </div>

      {/* Page 1: Cover & Identification */}
      <section className="clinical-page clinical-cover">
        <header className="clinical-header">
          <div className="clinical-logo">
            <Brain size={28} />
            <div className="clinical-logo-text">
              <span className="clinical-logo-name">NeuroLoop</span>
              <span className="clinical-logo-sub">Cognitive Performance Laboratory</span>
            </div>
          </div>
          <div className="clinical-classification">
            <span className="classification-badge">CONFIDENTIAL</span>
            <span className="classification-type">COGNITIVE PERFORMANCE ASSESSMENT</span>
          </div>
        </header>

        <div className="clinical-title-block">
          <h1 className="clinical-main-title">Cognitive Performance Assessment Report</h1>
          <p className="clinical-report-id">Report ID: {reportId}</p>
        </div>

        <section className="clinical-section">
          <h2 className="clinical-section-header">1. IDENTIFICATION & ASSESSMENT CONTEXT</h2>
          
          <div className="clinical-field-grid">
            <div className="clinical-field">
              <span className="clinical-field-label">Participant</span>
              <span className="clinical-field-value">{profile.name}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Date of Birth</span>
              <span className="clinical-field-value">15 Mar 1989 (Age {profile.age})</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Occupation</span>
              <span className="clinical-field-value">{profile.workType}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Education</span>
              <span className="clinical-field-value">{profile.education}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Assessment Date</span>
              <span className="clinical-field-value">{generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Observation Window</span>
              <span className="clinical-field-value">{observationWindow.start} – {observationWindow.end}</span>
            </div>
          </div>

          <div className="clinical-data-sources">
            <h3 className="clinical-subsection-header">Data Sources</h3>
            <ul className="clinical-list">
              <li>Behavioral training sessions (n={metrics.totalSessions})</li>
              <li>Performance metrics from standardized cognitive exercises</li>
              <li>Longitudinal tracking data ({observationWindow.start} – {observationWindow.end})</li>
              <li>Response accuracy and latency distributions</li>
            </ul>
          </div>
        </section>
        <span className="clinical-page-number">Page 1 of 7</span>
      </section>

      {/* Page 2: Executive Summary & SCI */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">2. EXECUTIVE CLINICAL SUMMARY</h2>
          
          <div className="clinical-summary-box">
            <ul className="clinical-summary-list">
              <li>
                <strong>Overall Cognitive Status:</strong> The Synthesized Cognitive Index (SCI) of {metrics.sci} places this individual 
                at the {metrics.sciPercentile}th percentile relative to the normative reference population.
              </li>
              <li>
                <strong>Performance Classification:</strong> Current cognitive performance is classified as <em>Above Average</em> based on 
                standardized cut-off criteria.
              </li>
              <li>
                <strong>Dual-Process Architecture:</strong> Processing profile indicates balanced integration 
                (S1: {metrics.s1Score}, S2: {metrics.s2Score}).
              </li>
              <li>
                <strong>Cognitive Age Estimate:</strong> Functional cognitive age of {metrics.cognitiveAge} years, favorable relative 
                to chronological age ({profile.age} years).
              </li>
              <li>
                <strong>Training Engagement:</strong> {metrics.totalSessions} sessions completed with {metrics.accuracy}% mean accuracy, 
                indicating consistent engagement.
              </li>
              <li>
                <strong>Readiness State:</strong> Cognitive Readiness Index (CRI) of {metrics.cri} suggests 
                optimal capacity for sustained performance.
              </li>
            </ul>
          </div>

          <div className="clinical-interpretation-box">
            <p className="clinical-interpretation">
              <strong>Clinical Interpretation:</strong> Overall cognitive profile is consistent with 
              high-functioning performance capacity with robust cognitive reserves across measured domains.
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">3. SYNTHESIZED COGNITIVE INDEX (SCI)</h2>
          
          <div className="clinical-sci-display">
            <div className="clinical-sci-main">
              <span className="clinical-sci-score">{metrics.sci}</span>
              <span className="clinical-sci-max">/100</span>
            </div>
            <div className="clinical-sci-meta">
              <span className="clinical-percentile">Percentile: {metrics.sciPercentile}th</span>
              <span className="clinical-class">Above Average</span>
            </div>
          </div>

          <div className="clinical-sci-explanation">
            <h3 className="clinical-subsection-header">Functional Interpretation</h3>
            <p>
              The Synthesized Cognitive Index (SCI) represents a composite measure of cognitive performance 
              aggregated across multiple domains. It integrates processing efficiency (50% weighting), 
              behavioral engagement patterns (30%), and recovery/sustainability factors (20%).
            </p>
            <p>
              An SCI of {metrics.sci} indicates that this individual's overall cognitive performance places them 
              in the above-average range of the reference population.
            </p>
            <p className="clinical-caveat">
              <em>Note:</em> The SCI provides a general index of cognitive performance and does not diagnose 
              cognitive impairment or pathology.
            </p>
          </div>
        </section>
        <span className="clinical-page-number">Page 2 of 7</span>
      </section>

      {/* Page 3: Cognitive Age & Dual-Process */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">4. COGNITIVE AGE ANALYSIS</h2>
          
          <div className="clinical-age-display">
            <div className="clinical-age-primary">
              <span className="clinical-age-label">Estimated Cognitive Age</span>
              <span className="clinical-age-value">{metrics.cognitiveAge} years</span>
            </div>
            <div className="clinical-age-comparison">
              <span className="clinical-age-label">Chronological Age</span>
              <span className="clinical-age-value">{profile.age} years</span>
              <span className="clinical-age-delta">{profile.age - metrics.cognitiveAge} years younger</span>
            </div>
          </div>

          <div className="clinical-age-explanation">
            <p>
              Cognitive age represents a functional indicator of processing efficiency relative to normative 
              age-based expectations. It is derived from performance patterns across speed, accuracy, and 
              consistency metrics.
            </p>
            <p>
              Current cognitive age places this individual at approximately the 85th percentile 
              for their chronological age cohort.
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">5. DUAL-PROCESS ARCHITECTURE ANALYSIS</h2>
          
          <div className="clinical-dual-process">
            <div className="clinical-system-card">
              <h3 className="clinical-system-title">System 1 (Intuitive Processing)</h3>
              <div className="clinical-system-score">{metrics.s1Score}</div>
              <p className="clinical-system-desc">
                Automatic, rapid processing characterized by pattern recognition and intuitive judgment.
              </p>
              <div className="clinical-system-components">
                <span>Processing Speed: {metrics.fast}</span>
                <span>Attentional Efficiency: {metrics.focus}</span>
              </div>
            </div>

            <div className="clinical-system-card">
              <h3 className="clinical-system-title">System 2 (Analytical Processing)</h3>
              <div className="clinical-system-score">{metrics.s2Score}</div>
              <p className="clinical-system-desc">
                Controlled, effortful processing involving deliberate reasoning and logical analysis.
              </p>
              <div className="clinical-system-components">
                <span>Deliberative Depth: {metrics.slow}</span>
                <span>Analytical Accuracy: {metrics.reasoning}</span>
              </div>
            </div>
          </div>

          <div className="clinical-balance-analysis">
            <h3 className="clinical-subsection-header">Integration & Balance</h3>
            <p>
              <strong>Current Status:</strong> Balanced — Optimal dual-process integration
            </p>
            <p>
              The current profile suggests optimal integration, enabling flexible switching between 
              intuitive and analytical modes as task demands require.
            </p>
          </div>
        </section>
        <span className="clinical-page-number">Page 3 of 7</span>
      </section>

      {/* Page 4: Domain Analysis */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">6. DOMAIN-LEVEL COGNITIVE PROFILE</h2>
          
          <div className="clinical-domains">
            {[
              {
                name: "Attentional Control",
                score: metrics.focus,
                class: "Above Average",
                classType: "above-avg",
                definition: "Capacity to maintain and shift attention as task demands require.",
                implication: "Strong attentional regulation supports sustained performance.",
                delta: "+5",
              },
              {
                name: "Analytical Reasoning",
                score: metrics.reasoning,
                class: "Above Average",
                classType: "above-avg",
                definition: "Ability to evaluate evidence and draw valid inferences.",
                implication: "Robust analytical capacity supports complex decision-making.",
                delta: "+8",
              },
              {
                name: "Creative Cognition",
                score: metrics.creativity,
                class: "Average",
                classType: "average",
                definition: "Divergent thinking capacity and novel solution generation.",
                implication: "Moderate creative flexibility with potential for enhancement.",
                delta: "+3",
              },
              {
                name: "Processing Speed (S1)",
                score: metrics.fast,
                class: "Above Average",
                classType: "above-avg",
                definition: "Efficiency of automatic, intuitive cognitive processing.",
                implication: "Rapid intuitive processing supports quick pattern recognition.",
                delta: "+6",
              },
              {
                name: "Deliberative Processing (S2)",
                score: metrics.slow,
                class: "Above Average",
                classType: "above-avg",
                definition: "Capacity for controlled, effortful analytical thinking.",
                implication: "Strong deliberative capacity supports nuanced judgment.",
                delta: "+4",
              },
            ].map((domain, idx) => (
              <div key={idx} className="clinical-domain-card">
                <div className="clinical-domain-header">
                  <h3 className="clinical-domain-name">{domain.name}</h3>
                  <div className="clinical-domain-score-block">
                    <span className="clinical-domain-score">{domain.score}</span>
                    <span className={`clinical-domain-class ${domain.classType}`}>{domain.class}</span>
                    <span className="clinical-domain-delta positive">{domain.delta}</span>
                  </div>
                </div>
                <p className="clinical-domain-definition">
                  <strong>Definition:</strong> {domain.definition}
                </p>
                <p className="clinical-domain-implication">
                  <strong>Implication:</strong> {domain.implication}
                </p>
              </div>
            ))}
          </div>
        </section>
        <span className="clinical-page-number">Page 4 of 7</span>
      </section>

      {/* Page 5: Training Analytics & Interpretation */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">7. TRAINING LOAD & ADAPTATION ANALYSIS</h2>
          
          <div className="clinical-training-stats">
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{metrics.totalSessions}</span>
              <span className="clinical-stat-label">Sessions</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{metrics.accuracy}%</span>
              <span className="clinical-stat-label">Accuracy</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{metrics.xp.toLocaleString()}</span>
              <span className="clinical-stat-label">XP</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">Lv.{metrics.level}</span>
              <span className="clinical-stat-label">Level</span>
            </div>
          </div>

          <div className="clinical-training-interpretation">
            <h3 className="clinical-subsection-header">Training Dose Interpretation</h3>
            <p>
              Session count of {metrics.totalSessions} with {metrics.accuracy}% accuracy represents 
              substantial training volume, indicating strong engagement.
            </p>
          </div>

          <div className="clinical-domain-distribution">
            <h3 className="clinical-subsection-header">Domain Distribution</h3>
            <div className="clinical-domain-bars">
              <div className="clinical-domain-bar-row">
                <span className="clinical-bar-label">Focus Arena</span>
                <span className="clinical-bar-sessions">18 sessions</span>
                <span className="clinical-bar-avg">76%</span>
              </div>
              <div className="clinical-domain-bar-row">
                <span className="clinical-bar-label">Critical Reasoning</span>
                <span className="clinical-bar-sessions">16 sessions</span>
                <span className="clinical-bar-avg">79%</span>
              </div>
              <div className="clinical-domain-bar-row">
                <span className="clinical-bar-label">Creativity Hub</span>
                <span className="clinical-bar-sessions">13 sessions</span>
                <span className="clinical-bar-avg">72%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">8. CLINICAL-STYLE INTERPRETATION</h2>
          
          <div className="clinical-interpretation-grid">
            <div className="clinical-interpretation-block">
              <h3 className="clinical-subsection-header">Strengths</h3>
              <ul className="clinical-list">
                <li><strong>Analytical Reasoning</strong> (75): Robust analytical capacity.</li>
                <li><strong>Processing Speed</strong> (74): Rapid pattern recognition.</li>
              </ul>
            </div>

            <div className="clinical-interpretation-block">
              <h3 className="clinical-subsection-header">Vulnerabilities</h3>
              <ul className="clinical-list">
                <li><strong>Creative Cognition</strong> (68): Potential for enhanced ideation.</li>
              </ul>
            </div>
          </div>

          <div className="clinical-patterns-block">
            <h3 className="clinical-subsection-header">Adaptive Patterns</h3>
            <p>
              Current patterns reflect adaptive cognitive engagement with appropriate challenge-seeking behavior.
            </p>
          </div>
        </section>
        <span className="clinical-page-number">Page 5 of 7</span>
      </section>

      {/* Page 6: Prognosis & Recommendations */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">9. SHORT-TERM PROGNOSIS (30–45 DAYS)</h2>
          
          <div className="clinical-prognosis-box">
            <p>
              Based on current performance patterns, maintenance of cognitive indices is likely with continued 
              adherence. Moderate confidence in sustained performance. With maintained training frequency, 
              an increase of 3-5 SCI points is achievable.
            </p>
          </div>

          <div className="clinical-confidence-note">
            <p>
              <em>Confidence Level:</em> Moderate — Reliability is related to training data volume.
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">10. TARGETED COGNITIVE RECOMMENDATIONS</h2>
          
          <div className="clinical-prescription">
            <h3 className="clinical-subsection-header">Performance Prescription</h3>
            
            <div className="clinical-rx-grid">
              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Frequency</span>
                <span className="clinical-rx-value">5–7 sessions per week</span>
                <span className="clinical-rx-rationale">
                  Consistent engagement is the strongest predictor of improvement.
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Priority Focus</span>
                <span className="clinical-rx-value">Creative Cognition Exercises</span>
                <span className="clinical-rx-rationale">
                  Addressing lowest-performing domain provides highest marginal improvement.
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Session Structure</span>
                <span className="clinical-rx-value">10–15 minutes focused practice</span>
                <span className="clinical-rx-rationale">
                  Optimal duration balances engagement intensity with sustainability.
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Recovery</span>
                <span className="clinical-rx-value">1–2 recovery days weekly</span>
                <span className="clinical-rx-rationale">
                  Cognitive consolidation requires rest for long-term adaptation.
                </span>
              </div>
            </div>
          </div>
        </section>
        <span className="clinical-page-number">Page 6 of 7</span>
      </section>

      {/* Page 7: Methodology, Disclaimer & Footer */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">11. METHODOLOGICAL NOTES</h2>
          
          <div className="clinical-methodology">
            <p>
              Metrics are derived from behavioral performance data during standardized cognitive exercises:
            </p>
            <ul className="clinical-list">
              <li><strong>Aggregation:</strong> Weighted averaging for recency and domain specificity.</li>
              <li><strong>Normalization:</strong> Age-adjusted reference distributions.</li>
              <li><strong>Longitudinal Tracking:</strong> Historical trend analysis.</li>
              <li><strong>Composite Index:</strong> SCI weightings (Cognitive: 50%, Behavioral: 30%, Recovery: 20%).</li>
            </ul>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">12. ETHICAL & CLINICAL DISCLAIMER</h2>
          
          <div className="clinical-disclaimer">
            <p>
              This cognitive performance assessment is provided for educational and self-improvement 
              purposes only. It is not intended to diagnose cognitive impairment or mental health disorders.
            </p>
            <p><strong>Important Limitations:</strong></p>
            <ul className="clinical-list">
              <li>This assessment does not constitute a clinical neuropsychological evaluation.</li>
              <li>Results are from self-directed training and may not reflect clinical conditions.</li>
              <li>Metrics fluctuate based on sleep, stress, motivation, and environment.</li>
              <li>Normative comparisons are based on the NeuroLoop user population.</li>
            </ul>
            <p>
              For concerns about cognitive functioning, please consult a qualified healthcare professional.
            </p>
          </div>
        </section>

        <footer className="clinical-footer">
          <div className="clinical-footer-content">
            <div className="clinical-footer-logo">
              <Brain size={20} />
              <span>NeuroLoop Pro</span>
            </div>
            <div className="clinical-footer-meta">
              <span>Report ID: {reportId}</span>
              <span>Generated: {generatedAt.toISOString().split('T')[0]}</span>
              <span>Classification: Confidential</span>
            </div>
            <p className="clinical-footer-legal">
              © {generatedAt.getFullYear()} NeuroLoop. All rights reserved.
            </p>
          </div>
        </footer>
        <span className="clinical-page-number">Page 7 of 7</span>
      </section>
    </div>
  );
}
