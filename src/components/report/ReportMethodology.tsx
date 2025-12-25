import React from "react";
import { BookOpen, Database, Calculator, BarChart3, Shield, FileText } from "lucide-react";

export function ReportMethodology() {
  return (
    <section className="report-page">
      <h2 className="report-section-title">Methodology & Scientific Framework</h2>
      <p className="report-subtitle">Evidence-based foundations of the NeuroLoop cognitive assessment system</p>

      <div className="methodology-grid">
        <div className="methodology-card">
          <div className="methodology-icon">
            <BookOpen size={24} color="#00897b" />
          </div>
          <h4>Theoretical Framework</h4>
          <p>
            NeuroLoop assessments are grounded in <strong>Kahneman's Dual-Process Theory</strong> (2011), 
            distinguishing between System 1 (fast, intuitive) and System 2 (slow, analytical) cognitive processing. 
            This framework is complemented by <strong>Posner's Attention Network Theory</strong> and 
            <strong>Baddeley's Working Memory Model</strong>.
          </p>
        </div>

        <div className="methodology-card">
          <div className="methodology-icon">
            <Database size={24} color="#00897b" />
          </div>
          <h4>Data Sources</h4>
          <ul>
            <li><strong>NeuroLab Training Sessions</strong> — Performance on validated cognitive exercises</li>
            <li><strong>Baseline Assessment</strong> — Initial cognitive profiling during onboarding</li>
            <li><strong>Wearable Biomarkers</strong> — HRV, sleep, and activity data from connected devices</li>
            <li><strong>Longitudinal Tracking</strong> — Progress monitoring across training sessions</li>
          </ul>
        </div>

        <div className="methodology-card">
          <div className="methodology-icon">
            <Calculator size={24} color="#00897b" />
          </div>
          <h4>Synthesized Cognitive Index (SCI)</h4>
          <p>
            The SCI is a composite metric calculated using weighted contributions from:
          </p>
          <ul>
            <li>Dual-process thinking scores (40%)</li>
            <li>Domain-specific performance — Focus, Reasoning, Creativity (35%)</li>
            <li>Training consistency and progression (15%)</li>
            <li>Physiological readiness factors (10%)</li>
          </ul>
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
                <td>Elite Performer</td>
              </tr>
              <tr>
                <td>B</td>
                <td>70-84</td>
                <td>High Performer</td>
              </tr>
              <tr>
                <td>C</td>
                <td>55-69</td>
                <td>Developing</td>
              </tr>
              <tr>
                <td>D</td>
                <td>0-54</td>
                <td>Foundation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="methodology-references">
        <h4>Key References</h4>
        <ul className="references-list">
          <li>Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. Farrar, Straus and Giroux.</li>
          <li>Jaeggi, S. M., et al. (2008). Improving fluid intelligence with training on working memory. <em>PNAS</em>, 105(19), 6829-6833.</li>
          <li>Lövdén, M., et al. (2010). A theoretical framework for the study of adult cognitive plasticity. <em>Psychological Bulletin</em>, 136(4), 659-676.</li>
          <li>Thayer, J. F., et al. (2009). Heart rate variability, prefrontal neural function, and cognitive performance. <em>Annals of Behavioral Medicine</em>, 37(2), 141-153.</li>
          <li>Lumsden, J., et al. (2016). Gamification of cognitive assessment and cognitive training. <em>Frontiers in Psychology</em>, 7, 1968.</li>
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
            The NeuroLoop platform is designed for cognitive training and self-monitoring, not clinical assessment.
            For concerns about cognitive health, please consult a qualified healthcare professional.
          </p>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-brand">
          <FileText size={16} />
          <span>NeuroLoop by SuperHuman Labs</span>
        </div>
        <div className="footer-meta">
          <span>Cognitive Performance Assessment v2.0</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} SuperHuman Labs</span>
        </div>
      </div>
    </section>
  );
}
