import React, { useMemo } from "react";
import { Target, AlertTriangle, Lightbulb, ArrowRight, Brain, Zap, Eye, Sparkles } from "lucide-react";

interface ReportRecommendationsProps {
  metrics: {
    fast_thinking?: number;
    slow_thinking?: number;
    focus_stability?: number;
    reasoning_accuracy?: number;
    creativity?: number;
    clarity_score?: number;
    decision_quality?: number;
    bias_resistance?: number;
    philosophical_reasoning?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
  };
  aggregates: {
    sessionsByArea: Record<string, number>;
    avgScoreByArea: Record<string, number>;
  };
  profile: {
    training_goals?: string[] | null;
    work_type?: string | null;
  };
}

interface Weakness {
  domain: string;
  score: number;
  icon: any;
  color: string;
  priority: "critical" | "moderate" | "low";
  recommendation: string;
  exercises: string[];
  scientificBasis: string;
}

interface Strength {
  domain: string;
  score: number;
  icon: any;
  color: string;
  recommendation: string;
}

export function ReportRecommendations({ metrics, aggregates, profile }: ReportRecommendationsProps) {
  const analysis = useMemo(() => {
    const domains = [
      { 
        name: "System 1 (Fast Thinking)", 
        score: metrics.fast_thinking ?? 50, 
        icon: Zap, 
        color: "#ffa726",
        exercises: ["Go/No-Go", "Stroop Task", "Visual Search", "Rapid Association"],
        scientificBasis: "System 1 processing speed can be enhanced through reaction-time training (Deary et al., 2001)"
      },
      { 
        name: "System 2 (Slow Thinking)", 
        score: metrics.slow_thinking ?? 50, 
        icon: Brain, 
        color: "#29b6f6",
        exercises: ["Infinite Regress Challenge", "Concept Forge", "Philosophical Reasoning"],
        scientificBasis: "Deliberate reasoning improves with structured analytical exercises (Evans, 2008)"
      },
      { 
        name: "Focus & Attention", 
        score: metrics.focus_stability ?? 50, 
        icon: Eye, 
        color: "#7e57c2",
        exercises: ["Attention Split", "Blindspot Pattern", "N-Back Visual"],
        scientificBasis: "Attentional control is trainable through sustained focus tasks (Tang & Posner, 2009)"
      },
      { 
        name: "Logical Reasoning", 
        score: metrics.reasoning_accuracy ?? 50, 
        icon: Target, 
        color: "#42a5f5",
        exercises: ["Sequence Logic", "Pattern Completion", "Cognitive Whiplash"],
        scientificBasis: "Logical reasoning benefits from explicit rule-based training (Klauer et al., 2002)"
      },
      { 
        name: "Creativity", 
        score: metrics.creativity ?? 50, 
        icon: Sparkles, 
        color: "#ec407a",
        exercises: ["Flash Matrix", "Word Association", "Analogy Match"],
        scientificBasis: "Divergent thinking improves with associative exercises (Benedek et al., 2014)"
      },
    ];

    const metaCog = [
      { name: "Clarity", score: metrics.clarity_score ?? 50 },
      { name: "Decision Quality", score: metrics.decision_quality ?? 50 },
      { name: "Bias Resistance", score: metrics.bias_resistance ?? 50 },
      { name: "Philosophical Depth", score: metrics.philosophical_reasoning ?? 50 },
    ];

    // Identify weaknesses (below 60) and strengths (above 70)
    const weaknesses: Weakness[] = domains
      .filter(d => d.score < 60)
      .sort((a, b) => a.score - b.score)
      .map(d => ({
        domain: d.name,
        score: d.score,
        icon: d.icon,
        color: d.color,
        priority: d.score < 40 ? "critical" : d.score < 50 ? "moderate" : "low",
        recommendation: `Focus on ${d.name.toLowerCase()} training to build foundational skills.`,
        exercises: d.exercises,
        scientificBasis: d.scientificBasis,
      }));

    const strengths: Strength[] = domains
      .filter(d => d.score >= 70)
      .sort((a, b) => b.score - a.score)
      .map(d => ({
        domain: d.name,
        score: d.score,
        icon: d.icon,
        color: d.color,
        recommendation: `Maintain ${d.name.toLowerCase()} through regular practice and increased difficulty.`,
      }));

    // Check for imbalances
    const fastSlow = (metrics.fast_thinking ?? 50) - (metrics.slow_thinking ?? 50);
    const isImbalanced = Math.abs(fastSlow) > 15;

    // Training gaps
    const trainingGaps = Object.entries(aggregates.sessionsByArea)
      .filter(([_, count]) => count < 5)
      .map(([area]) => area);

    return { weaknesses, strengths, isImbalanced, fastSlow, trainingGaps, metaCog };
  }, [metrics, aggregates]);

  return (
    <section className="report-page">
      <h2 className="report-section-title">Personalized Recommendations</h2>
      <p className="report-subtitle">Evidence-based training protocol based on identified cognitive patterns</p>

      {analysis.weaknesses.length > 0 && (
        <>
          <h3 className="report-subsection-title">Priority Development Areas</h3>
          <p className="recommendations-intro">
            The following cognitive domains show room for improvement based on your assessment results:
          </p>
          
          <div className="weaknesses-grid">
            {analysis.weaknesses.slice(0, 3).map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.domain} className={`weakness-card priority-${w.priority}`}>
                  <div className="weakness-header">
                    <div className="weakness-icon" style={{ backgroundColor: `${w.color}15`, color: w.color }}>
                      <Icon size={20} />
                    </div>
                    <div className="weakness-info">
                      <span className="weakness-name">{w.domain}</span>
                      <span className={`weakness-priority ${w.priority}`}>
                        {w.priority === "critical" ? "Critical" : w.priority === "moderate" ? "Moderate" : "Low"} Priority
                      </span>
                    </div>
                    <div className="weakness-score">{Math.round(w.score)}</div>
                  </div>
                  
                  <div className="weakness-bar">
                    <div className="weakness-bar-fill" style={{ width: `${w.score}%`, backgroundColor: w.color }} />
                    <div className="weakness-bar-target" style={{ left: "60%" }} />
                  </div>
                  
                  <div className="weakness-exercises">
                    <span className="exercises-label">Recommended Exercises:</span>
                    <div className="exercises-list">
                      {w.exercises.map((ex) => (
                        <span key={ex} className="exercise-tag">{ex}</span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="weakness-science">{w.scientificBasis}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {analysis.strengths.length > 0 && (
        <>
          <h3 className="report-subsection-title">Cognitive Strengths</h3>
          <div className="strengths-row">
            {analysis.strengths.slice(0, 3).map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.domain} className="strength-card">
                  <div className="strength-icon" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="strength-content">
                    <span className="strength-name">{s.domain}</span>
                    <span className="strength-score">{Math.round(s.score)}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {analysis.isImbalanced && (
        <div className="imbalance-alert">
          <AlertTriangle size={20} color="#f57c00" />
          <div className="imbalance-content">
            <strong>Thinking System Imbalance Detected</strong>
            <p>
              {analysis.fastSlow > 0 
                ? "Your System 1 (intuitive) processing significantly outpaces System 2 (analytical). Consider more deliberate reasoning exercises to balance cognitive processing."
                : "Your System 2 (analytical) processing significantly outpaces System 1 (intuitive). Consider reaction-time and pattern recognition exercises to balance cognitive processing."
              }
            </p>
          </div>
        </div>
      )}

      {analysis.trainingGaps.length > 0 && (
        <div className="training-gaps">
          <Lightbulb size={18} color="#00897b" />
          <div>
            <strong>Training Opportunity:</strong> You have limited training data in: {analysis.trainingGaps.join(", ")}. 
            Diversifying training across all cognitive domains promotes comprehensive neural development.
          </div>
        </div>
      )}

      <h3 className="report-subsection-title">Recommended Training Protocol</h3>
      <div className="protocol-grid">
        <div className="protocol-card">
          <div className="protocol-number">1</div>
          <div className="protocol-content">
            <h4>Primary Focus</h4>
            <p>
              {analysis.weaknesses.length > 0 
                ? `Dedicate 50% of training sessions to ${analysis.weaknesses[0]?.domain ?? "weak areas"} exercises.`
                : "Maintain balanced training across all cognitive domains."
              }
            </p>
          </div>
        </div>
        <div className="protocol-card">
          <div className="protocol-number">2</div>
          <div className="protocol-content">
            <h4>Session Frequency</h4>
            <p>
              Aim for 4-5 training sessions per week. Research indicates spaced practice optimizes 
              neuroplastic adaptation (Cepeda et al., 2006).
            </p>
          </div>
        </div>
        <div className="protocol-card">
          <div className="protocol-number">3</div>
          <div className="protocol-content">
            <h4>Progressive Difficulty</h4>
            <p>
              Increase exercise difficulty when accuracy exceeds 80%. Optimal challenge promotes 
              cognitive growth (Lövdén et al., 2010).
            </p>
          </div>
        </div>
        <div className="protocol-card">
          <div className="protocol-number">4</div>
          <div className="protocol-content">
            <h4>Recovery</h4>
            <p>
              Allow 24-48 hours between intensive sessions. Sleep consolidates cognitive gains 
              and supports neural recovery (Walker, 2017).
            </p>
          </div>
        </div>
      </div>

      <div className="recommendations-footer">
        <ArrowRight size={16} />
        <span>
          Continue with NeuroLoop training to track progress and receive updated recommendations 
          based on your evolving cognitive profile.
        </span>
      </div>
    </section>
  );
}
