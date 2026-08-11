import React from "react";
import { BookOpen, Database, Calculator, BarChart3, Shield, FileText, FlaskConical, Brain } from "lucide-react";

export function ReportMethodology() {
  return (
    <section className="report-page methodology-page">
      <h2 className="report-section-title">Methodology & Scientific Framework</h2>
      <p className="report-subtitle">Transparent formulas and data sources used by LOOMA</p>

      <div className="methodology-grid">
        <div className="methodology-card">
          <div className="methodology-icon">
            <BookOpen size={24} color="#00897b" />
          </div>
          <h4>Theoretical Framework</h4>
          <p>
            LOOMA's interpretation layer is informed by <strong>dual-process theory</strong>,
            distinguishing between System 1 (fast, intuitive) and System 2 (slow, analytical) cognitive processing. 
            This framework is complemented by <strong>Posner's Attention Network Theory</strong> and 
            <strong> Baddeley's Working Memory Model</strong>.
          </p>
        </div>

        <div className="methodology-card">
          <div className="methodology-icon">
            <Database size={24} color="#00897b" />
          </div>
          <h4>Data Sources</h4>
          <ul>
            <li><strong>Lab sessions</strong> — Performance on LOOMA cognitive drills</li>
            <li><strong>Baseline Assessment</strong> — Initial cognitive profiling during onboarding</li>
            <li><strong>Wearable Biomarkers</strong> — HRV, sleep, and activity data from connected devices</li>
            <li><strong>Longitudinal Tracking</strong> — Progress monitoring across training sessions</li>
          </ul>
        </div>

        <div className="methodology-card full-width">
          <div className="methodology-icon">
            <Calculator size={24} color="#00897b" />
          </div>
          <h4>Synthesized Cognitive Index (SCI) Calculation</h4>
          <p>The SCI is a composite metric calculated using the following weighted formula:</p>
          <div className="formula-box">
            <code>SCI = (0.50 × Cognitive Performance) + (0.30 × Training Engagement) + (0.20 × Recovery)</code>
          </div>
          <div className="formula-breakdown">
            <div className="formula-component">
              <span className="component-weight">50%</span>
              <span className="component-name">Cognitive Performance</span>
              <span className="component-desc">Equal average of AE, RA, CT and IN</span>
            </div>
            <div className="formula-component">
              <span className="component-weight">30%</span>
              <span className="component-name">Training Engagement</span>
              <span className="component-desc">Weekly Lab XP relative to the selected protocol</span>
            </div>
            <div className="formula-component">
              <span className="component-weight">20%</span>
              <span className="component-name">Recovery</span>
              <span className="component-desc">The same Recovery value used in Home</span>
            </div>
          </div>
        </div>

        <div className="methodology-card">
          <div className="methodology-icon">
            <FlaskConical size={24} color="#00897b" />
          </div>
          <h4>Sub-Metric Calculations</h4>
          <div className="sub-formula-list">
            <div className="sub-formula">
              <strong>System 1:</strong>
              <code>(AE + RA) / 2</code>
            </div>
            <div className="sub-formula">
              <strong>System 2:</strong>
              <code>(CT + IN) / 2</code>
            </div>
            <div className="sub-formula">
              <strong>Sharpness:</strong>
              <code>capacity modulated by Recovery and observed daily context</code>
            </div>
            <div className="sub-formula">
              <strong>Readiness:</strong>
              <code>app state blended with daily context according to signal coverage</code>
            </div>
          </div>
        </div>

        <div className="methodology-card">
          <div className="methodology-icon">
            <BarChart3 size={24} color="#00897b" />
          </div>
          <h4>Performance Classifications</h4>
          <table className="classification-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Score Range</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>85-100</td>
                <td>Strong state</td>
              </tr>
              <tr>
                <td>B</td>
                <td>70-84</td>
                <td>Ready state</td>
              </tr>
              <tr>
                <td>C</td>
                <td>55-69</td>
                <td>Steady state</td>
              </tr>
              <tr>
                <td>D</td>
                <td>0-54</td>
                <td>Building / starting point</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="methodology-references">
        <h4>Key References</h4>
        <ul className="references-list">
          <li>Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. Farrar, Straus and Giroux.</li>
          <li>Posner, M. I., & Petersen, S. E. (1990). The attention system of the human brain. <em>Annual Review of Neuroscience</em>, 13(1), 25-42.</li>
          <li>Baddeley, A. D. (2000). The episodic buffer: a new component of working memory? <em>Trends in Cognitive Sciences</em>, 4(11), 417-423.</li>
          <li>Jaeggi, S. M., et al. (2008). Improving fluid intelligence with training on working memory. <em>PNAS</em>, 105(19), 6829-6833.</li>
          <li>Lövdén, M., et al. (2010). A theoretical framework for the study of adult cognitive plasticity. <em>Psychological Bulletin</em>, 136(4), 659-676.</li>
          <li>Thayer, J. F., et al. (2009). Heart rate variability, prefrontal neural function, and cognitive performance. <em>Annals of Behavioral Medicine</em>, 37(2), 141-153.</li>
          <li>Lumsden, J., et al. (2016). Gamification of cognitive assessment and cognitive training. <em>Frontiers in Psychology</em>, 7, 1968.</li>
          <li>Walker, M. P. (2017). <em>Why We Sleep: Unlocking the Power of Sleep and Dreams</em>. Scribner.</li>
        </ul>
      </div>

      <div className="methodology-disclaimer">
        <div className="disclaimer-icon">
          <Shield size={20} color="#718096" />
        </div>
        <div className="disclaimer-content">
          <h4>Important Disclaimer</h4>
          <p>
            This cognitive assessment report is provided for <strong>educational and self-improvement purposes only</strong>. 
            It does not constitute a clinical neuropsychological evaluation, medical diagnosis, or professional health advice. 
            LOOMA is designed for cognitive training and personal state monitoring, not clinical assessment.
            For concerns about cognitive health, please consult a qualified healthcare professional.
          </p>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-brand">
          <Brain size={16} />
          <span>LOOMA</span>
        </div>
        <div className="footer-meta">
          <span>Personal cognitive-state report</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} LOOMA</span>
        </div>
      </div>
    </section>
  );
}
