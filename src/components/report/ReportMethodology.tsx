import React from "react";
import { BookOpen, Database, Calculator, BarChart3, Shield, FileText, FlaskConical, Brain } from "lucide-react";

export function ReportMethodology() {
  return (
    <section className="report-page methodology-page">
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
            <strong> Baddeley's Working Memory Model</strong>.
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

        <div className="methodology-card full-width">
          <div className="methodology-icon">
            <Calculator size={24} color="#00897b" />
          </div>
          <h4>Synthesized Cognitive Index (SCI) Calculation</h4>
          <p>The SCI is a composite metric calculated using the following weighted formula:</p>
          <div className="formula-box">
            <code>SCI = (0.40 × DualProcess) + (0.35 × Domains) + (0.15 × Training) + (0.10 × Physio)</code>
          </div>
          <div className="formula-breakdown">
            <div className="formula-component">
              <span className="component-weight">40%</span>
              <span className="component-name">Dual-Process Score</span>
              <span className="component-desc">Weighted average of System 1 and System 2 performance</span>
            </div>
            <div className="formula-component">
              <span className="component-weight">35%</span>
              <span className="component-name">Domain Performance</span>
              <span className="component-desc">Average across Focus, Reasoning, and Creativity domains</span>
            </div>
            <div className="formula-component">
              <span className="component-weight">15%</span>
              <span className="component-name">Training Consistency</span>
              <span className="component-desc">Session frequency, accuracy rate, and progression</span>
            </div>
            <div className="formula-component">
              <span className="component-weight">10%</span>
              <span className="component-name">Physiological Readiness</span>
              <span className="component-desc">HRV, sleep quality, and activity indicators</span>
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
              <strong>Focus Stability:</strong>
              <code>Σ(attention_scores) / n × accuracy_modifier</code>
            </div>
            <div className="sub-formula">
              <strong>Reasoning Accuracy:</strong>
              <code>(correct_answers / total_questions) × 100 × difficulty_weight</code>
            </div>
            <div className="sub-formula">
              <strong>Creativity Score:</strong>
              <code>divergent_thinking × 0.5 + insight_tasks × 0.3 + flexibility × 0.2</code>
            </div>
            <div className="sub-formula">
              <strong>Cognitive Readiness:</strong>
              <code>(SCI × 0.6) + (physio_score × 0.4) when wearable connected</code>
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
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>85-100</td>
                <td>Elite Performer</td>
                <td>Top 5%</td>
              </tr>
              <tr>
                <td>B</td>
                <td>70-84</td>
                <td>High Performer</td>
                <td>Top 25%</td>
              </tr>
              <tr>
                <td>C</td>
                <td>55-69</td>
                <td>Developing</td>
                <td>Average</td>
              </tr>
              <tr>
                <td>D</td>
                <td>0-54</td>
                <td>Foundation</td>
                <td>Below Avg</td>
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
            The NeuroLoop platform is designed for cognitive training and self-monitoring, not clinical assessment.
            For concerns about cognitive health, please consult a qualified healthcare professional.
          </p>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-brand">
          <Brain size={16} />
          <span>NeuroLoop Pro</span>
        </div>
        <div className="footer-meta">
          <span>Cognitive Performance Assessment v2.1</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} SuperHuman Labs</span>
        </div>
      </div>
    </section>
  );
}
