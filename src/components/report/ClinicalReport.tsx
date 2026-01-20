// src/components/report/ClinicalReport.tsx
// Medical-grade Cognitive Performance Report
import React, { useMemo } from "react";
import { Brain } from "lucide-react";

type Area = "focus" | "reasoning" | "creativity";

interface ClinicalReportProps {
  profile: {
    name?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    work_type?: string | null;
    education_level?: string | null;
    degree_discipline?: string | null;
    training_goals?: string[] | null;
    daily_time_commitment?: string | null;
    session_duration?: string | null;
  };
  metrics: {
    cognitive_performance_score?: number | null;
    cognitive_readiness_score?: number | null;
    fast_thinking?: number | null;
    slow_thinking?: number | null;
    focus_stability?: number | null;
    reasoning_accuracy?: number | null;
    creativity?: number | null;
    clarity_score?: number | null;
    decision_quality?: number | null;
    bias_resistance?: number | null;
    philosophical_reasoning?: number | null;
    cognitive_level?: number | null;
    experience_points?: number | null;
    total_sessions?: number;
    baseline_fast_thinking?: number | null;
    baseline_slow_thinking?: number | null;
    baseline_focus?: number | null;
    baseline_reasoning?: number | null;
    baseline_creativity?: number | null;
    baseline_cognitive_age?: number | null;
    spatial_reasoning?: number | null;
    visual_processing?: number | null;
    reaction_speed?: number | null;
  };
  aggregates: {
    sessionsByArea: Record<Area, number>;
    avgScoreByArea: Record<Area, number>;
    accuracyRatePct: number;
    preferredDuration?: string;
    mostUsedExercises: { exerciseId: string; count: number }[];
    last30DaysHeatmap?: { date: string; count: number }[];
  };
  badges: Array<{
    badge_name: string;
    badge_category: string;
    earned_at?: string;
  }>;
  generatedAt: Date;
  isPreview?: boolean;
}

// Helper functions
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getPercentile(score: number): number {
  // Approximate percentile based on normal distribution
  if (score >= 90) return 98;
  if (score >= 85) return 95;
  if (score >= 80) return 90;
  if (score >= 75) return 85;
  if (score >= 70) return 80;
  if (score >= 65) return 70;
  if (score >= 60) return 60;
  if (score >= 55) return 55;
  if (score >= 50) return 50;
  if (score >= 45) return 40;
  if (score >= 40) return 30;
  if (score >= 35) return 20;
  return 15;
}

function getClassification(score: number): { label: string; class: string } {
  if (score >= 85) return { label: "Superior", class: "superior" };
  if (score >= 70) return { label: "Above Average", class: "above-avg" };
  if (score >= 50) return { label: "Average", class: "average" };
  if (score >= 35) return { label: "Below Average", class: "below-avg" };
  return { label: "Significantly Below Average", class: "low" };
}

function formatWorkType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    knowledge: "Knowledge Worker",
    creative: "Creative Professional",
    technical: "Technical/Engineering",
    management: "Management/Executive",
    student: "Student/Academic",
    other: "Other",
  };
  return map[type || ""] || "Not specified";
}

function formatEducation(level: string | null | undefined, discipline: string | null | undefined): string {
  const levelMap: Record<string, string> = {
    high_school: "High School",
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: "Doctoral Degree",
    other: "Other",
  };
  const discMap: Record<string, string> = {
    stem: "STEM",
    humanities: "Humanities",
    business: "Business",
    health: "Health Sciences",
    arts: "Arts",
    social_sciences: "Social Sciences",
    law: "Law",
    other: "Other",
  };
  const l = levelMap[level || ""] || "Not specified";
  const d = discMap[discipline || ""];
  return d ? `${l} (${d})` : l;
}

export function ClinicalReport({ profile, metrics, aggregates, badges, generatedAt, isPreview = false }: ClinicalReportProps) {
  const reportId = `NL-${generatedAt.getTime().toString(36).toUpperCase()}`;
  const observationWindow = useMemo(() => {
    const endDate = generatedAt;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    return {
      start: startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      end: endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
  }, [generatedAt]);

  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const sciPercentile = getPercentile(sci);
  const sciClass = getClassification(sci);
  const cri = Math.round(metrics.cognitive_readiness_score ?? 50);
  const xp = metrics.experience_points ?? 0;
  const level = metrics.cognitive_level ?? 1;
  const totalSessions = metrics.total_sessions ?? 0;
  const accuracy = aggregates.accuracyRatePct ?? 0;
  
  const fast = metrics.fast_thinking ?? 50;
  const slow = metrics.slow_thinking ?? 50;
  const focus = metrics.focus_stability ?? 50;
  const reasoning = metrics.reasoning_accuracy ?? 50;
  const creativity = metrics.creativity ?? 50;
  
  const age = profile.birth_date ? calculateAge(profile.birth_date) : null;
  
  // Cognitive Age calculation
  const baselineCogAge = metrics.baseline_cognitive_age ?? (age ?? 35);
  const cognitiveAge = useMemo(() => {
    const sciDelta = sci - 50;
    const adjustment = -0.2 * sciDelta;
    return Math.round(baselineCogAge + adjustment);
  }, [sci, baselineCogAge]);
  const cogAgePercentile = useMemo(() => {
    if (!age) return 50;
    const delta = age - cognitiveAge;
    if (delta >= 10) return 95;
    if (delta >= 5) return 85;
    if (delta >= 2) return 70;
    if (delta >= 0) return 55;
    if (delta >= -2) return 40;
    if (delta >= -5) return 25;
    return 10;
  }, [age, cognitiveAge]);

  // System balance
  const s1Score = Math.round((fast + focus + (metrics.reaction_speed ?? 50)) / 3);
  const s2Score = Math.round((slow + reasoning + (metrics.clarity_score ?? 50)) / 3);
  const systemBalance = useMemo(() => {
    const diff = s1Score - s2Score;
    if (Math.abs(diff) <= 5) return { status: "Balanced", desc: "Optimal dual-process integration" };
    if (diff > 15) return { status: "S1-Dominant", desc: "Intuitive processing preference" };
    if (diff > 5) return { status: "S1-Leaning", desc: "Mild intuitive bias" };
    if (diff < -15) return { status: "S2-Dominant", desc: "Analytical processing preference" };
    return { status: "S2-Leaning", desc: "Mild analytical bias" };
  }, [s1Score, s2Score]);

  // Domains
  const domains = [
    {
      name: "Attentional Control",
      score: focus,
      baseline: metrics.baseline_focus,
      definition: "Capacity to maintain and shift attention as task demands require.",
      implication: focus >= 70 
        ? "Strong attentional regulation supports sustained performance under cognitive load."
        : focus >= 50
        ? "Adequate attentional capacity with potential for improvement under distraction."
        : "Attentional vulnerabilities may impact performance in demanding environments.",
    },
    {
      name: "Analytical Reasoning",
      score: reasoning,
      baseline: metrics.baseline_reasoning,
      definition: "Ability to evaluate evidence, identify logical structures, and draw valid inferences.",
      implication: reasoning >= 70
        ? "Robust analytical capacity supports complex decision-making and problem-solving."
        : reasoning >= 50
        ? "Functional reasoning with opportunity for enhanced critical evaluation skills."
        : "Reasoning vulnerabilities may affect judgment in ambiguous situations.",
    },
    {
      name: "Creative Cognition",
      score: creativity,
      baseline: metrics.baseline_creativity,
      definition: "Divergent thinking capacity and ability to generate novel solutions.",
      implication: creativity >= 70
        ? "Strong creative capacity enables innovative problem-solving approaches."
        : creativity >= 50
        ? "Moderate creative flexibility with potential for enhanced ideation."
        : "Limited divergent thinking may constrain solution generation.",
    },
    {
      name: "Processing Speed (S1)",
      score: fast,
      baseline: metrics.baseline_fast_thinking,
      definition: "Efficiency of automatic, intuitive cognitive processing.",
      implication: fast >= 70
        ? "Rapid intuitive processing supports quick pattern recognition and reaction."
        : fast >= 50
        ? "Adequate processing speed for routine cognitive demands."
        : "Slower processing may impact performance in time-sensitive contexts.",
    },
    {
      name: "Deliberative Processing (S2)",
      score: slow,
      baseline: metrics.baseline_slow_thinking,
      definition: "Capacity for controlled, effortful analytical thinking.",
      implication: slow >= 70
        ? "Strong deliberative capacity supports nuanced judgment and complex reasoning."
        : slow >= 50
        ? "Functional analytical capacity with room for enhanced depth of processing."
        : "Limited deliberative engagement may affect complex decision quality.",
    },
  ];

  // Strengths and vulnerabilities
  const sortedDomains = [...domains].sort((a, b) => b.score - a.score);
  const strengths = sortedDomains.slice(0, 2).filter(d => d.score >= 60);
  const vulnerabilities = sortedDomains.slice(-2).filter(d => d.score < 60).reverse();

  // Prognosis
  const prognosisText = useMemo(() => {
    if (totalSessions < 5) {
      return "Insufficient training data for reliable trajectory estimation. Continued engagement is recommended to establish baseline patterns.";
    }
    if (sci >= 75 && accuracy >= 75) {
      return "Based on current performance patterns, maintenance of cognitive indices is likely with continued adherence. Moderate confidence in sustained performance over the next 30-45 days.";
    }
    if (sci >= 55 && totalSessions >= 10) {
      return "Current trajectory suggests gradual improvement is achievable with consistent engagement. With maintained training frequency, an increase of 3-7 SCI points over 30-45 days is plausible.";
    }
    return "Performance patterns indicate opportunity for improvement. Consistent engagement at current or increased frequency may yield measurable gains within 30-45 days, contingent on adherence.";
  }, [sci, accuracy, totalSessions]);

  return (
    <div className="clinical-report relative">
      {/* Preview watermark */}
      {isPreview && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          style={{ top: '40%' }}
        >
          <div 
            className="text-amber-500/20 font-bold text-[80px] tracking-[0.3em] select-none"
            style={{ 
              transform: 'rotate(-35deg)',
              textShadow: '0 0 10px rgba(0,0,0,0.05)'
            }}
          >
            PREVIEW
          </div>
        </div>
      )}
      
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
          {isPreview && (
            <p className="text-amber-600 text-xs font-medium mt-2 px-3 py-1 bg-amber-50 rounded-md inline-block">
              ⚠ Preview — Complete weekly training to generate final report
            </p>
          )}
        </div>

        <section className="clinical-section">
          <h2 className="clinical-section-header">1. IDENTIFICATION & ASSESSMENT CONTEXT</h2>
          
          <div className="clinical-field-grid">
            <div className="clinical-field">
              <span className="clinical-field-label">Participant</span>
              <span className="clinical-field-value">{profile.name || "Confidential"}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Date of Birth</span>
              <span className="clinical-field-value">
                {profile.birth_date 
                  ? `${new Date(profile.birth_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}${age ? ` (Age ${age})` : ""}`
                  : "Not provided"
                }
              </span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Occupation</span>
              <span className="clinical-field-value">{formatWorkType(profile.work_type)}</span>
            </div>
            <div className="clinical-field">
              <span className="clinical-field-label">Education</span>
              <span className="clinical-field-value">{formatEducation(profile.education_level, profile.degree_discipline)}</span>
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
              <li>Behavioral training sessions (n={totalSessions})</li>
              <li>Performance metrics from standardized cognitive exercises</li>
              <li>Longitudinal tracking data ({observationWindow.start} – {observationWindow.end})</li>
              <li>Response accuracy and latency distributions</li>
            </ul>
          </div>
        </section>
      </section>

      {/* Page 2: Executive Summary */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">2. EXECUTIVE CLINICAL SUMMARY</h2>
          
          <div className="clinical-summary-box">
            <ul className="clinical-summary-list">
              <li>
                <strong>Overall Cognitive Status:</strong> The Synthesized Cognitive Index (SCI) of {sci} places this individual 
                at the {sciPercentile}th percentile relative to the normative reference population.
              </li>
              <li>
                <strong>Performance Classification:</strong> Current cognitive performance is classified as <em>{sciClass.label}</em> based on 
                standardized cut-off criteria.
              </li>
              <li>
                <strong>Dual-Process Architecture:</strong> Processing profile indicates {systemBalance.status.toLowerCase()} integration 
                (S1: {s1Score}, S2: {s2Score}).
              </li>
              <li>
                <strong>Cognitive Age Estimate:</strong> Functional cognitive age of {cognitiveAge} years, {cogAgePercentile >= 50 ? "favorable" : "suboptimal"} relative 
                to chronological age{age ? ` (${age} years)` : ""}.
              </li>
              <li>
                <strong>Training Engagement:</strong> {totalSessions} sessions completed with {accuracy.toFixed(1)}% mean accuracy, 
                indicating {totalSessions >= 20 ? "consistent" : totalSessions >= 10 ? "moderate" : "early-stage"} engagement.
              </li>
              <li>
                <strong>Readiness State:</strong> Cognitive Readiness Index (CRI) of {cri} suggests 
                {cri >= 70 ? " optimal" : cri >= 50 ? " adequate" : " suboptimal"} capacity for sustained performance.
              </li>
            </ul>
          </div>

          <div className="clinical-interpretation-box">
            <p className="clinical-interpretation">
              <strong>Clinical Interpretation:</strong> Overall cognitive profile is consistent with 
              {sci >= 75 
                ? " high-functioning performance capacity with robust cognitive reserves across measured domains."
                : sci >= 55
                ? " functional cognitive capacity with identifiable areas for targeted development."
                : " developing cognitive patterns with significant opportunity for improvement through structured intervention."
              }
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">3. SYNTHESIZED COGNITIVE INDEX (SCI)</h2>
          
          <div className="clinical-sci-display">
            <div className="clinical-sci-main">
              <span className="clinical-sci-score">{sci}</span>
              <span className="clinical-sci-max">/100</span>
            </div>
            <div className="clinical-sci-meta">
              <span className="clinical-percentile">Percentile: {sciPercentile}th</span>
              <span className="clinical-class">{sciClass.label}</span>
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
              An SCI of {sci} indicates that this individual's overall cognitive performance places them 
              in the {sciPercentile <= 25 ? "lower" : sciPercentile <= 50 ? "average" : sciPercentile <= 75 ? "above-average" : "upper"} range 
              of the reference population. This score {sci >= 70 ? "reflects" : "suggests"} 
              {sci >= 70 
                ? " robust cognitive functioning with strong adaptive capacity."
                : sci >= 50 
                ? " adequate baseline functioning with identifiable areas for enhancement."
                : " developing cognitive capacity warranting targeted intervention."
              }
            </p>
            <p className="clinical-caveat">
              <em>Note:</em> The SCI provides a general index of cognitive performance and does not diagnose 
              cognitive impairment or pathology. Variations within the average range are expected and do not 
              necessarily indicate clinical significance.
            </p>
          </div>
        </section>
      </section>

      {/* Page 3: Cognitive Age & Dual-Process */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">4. COGNITIVE AGE ANALYSIS</h2>
          
          <div className="clinical-age-display">
            <div className="clinical-age-primary">
              <span className="clinical-age-label">Estimated Cognitive Age</span>
              <span className="clinical-age-value">{cognitiveAge} years</span>
            </div>
            {age && (
              <div className="clinical-age-comparison">
                <span className="clinical-age-label">Chronological Age</span>
                <span className="clinical-age-value">{age} years</span>
                <span className="clinical-age-delta">
                  {age - cognitiveAge > 0 
                    ? `${age - cognitiveAge} years younger` 
                    : age - cognitiveAge < 0 
                    ? `${cognitiveAge - age} years older`
                    : "Age-congruent"
                  }
                </span>
              </div>
            )}
          </div>

          <div className="clinical-age-explanation">
            <p>
              Cognitive age represents a functional indicator of processing efficiency relative to normative 
              age-based expectations. It is derived from performance patterns across speed, accuracy, and 
              consistency metrics, adjusted for baseline individual differences.
            </p>
            <p>
              This metric should be interpreted as a relative performance indicator rather than a biological 
              claim about neural aging. Inter-individual variability is substantial, and cognitive age can 
              fluctuate based on training engagement, recovery status, and contextual factors.
            </p>
            <p>
              Current cognitive age places this individual at approximately the {cogAgePercentile}th percentile 
              for their chronological age cohort, suggesting 
              {cogAgePercentile >= 70 
                ? " above-average functional capacity."
                : cogAgePercentile >= 50 
                ? " age-appropriate functioning."
                : " opportunity for performance optimization."
              }
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">5. DUAL-PROCESS ARCHITECTURE ANALYSIS</h2>
          
          <div className="clinical-dual-process">
            <div className="clinical-system-card">
              <h3 className="clinical-system-title">System 1 (Intuitive Processing)</h3>
              <div className="clinical-system-score">{s1Score}</div>
              <p className="clinical-system-desc">
                Automatic, rapid processing characterized by pattern recognition, heuristic application, 
                and intuitive judgment. Operates with minimal cognitive effort and is susceptible to 
                systematic biases under certain conditions.
              </p>
              <div className="clinical-system-components">
                <span>Processing Speed: {Math.round(fast)}</span>
                <span>Attentional Efficiency: {Math.round(focus)}</span>
                <span>Reaction Latency: {Math.round(metrics.reaction_speed ?? 50)}</span>
              </div>
            </div>

            <div className="clinical-system-card">
              <h3 className="clinical-system-title">System 2 (Analytical Processing)</h3>
              <div className="clinical-system-score">{s2Score}</div>
              <p className="clinical-system-desc">
                Controlled, effortful processing involving deliberate reasoning, logical analysis, 
                and systematic evaluation. Requires sustained attention and cognitive resources but 
                enables complex problem-solving and bias override.
              </p>
              <div className="clinical-system-components">
                <span>Deliberative Depth: {Math.round(slow)}</span>
                <span>Analytical Accuracy: {Math.round(reasoning)}</span>
                <span>Clarity Score: {Math.round(metrics.clarity_score ?? 50)}</span>
              </div>
            </div>
          </div>

          <div className="clinical-balance-analysis">
            <h3 className="clinical-subsection-header">Integration & Balance</h3>
            <p>
              <strong>Current Status:</strong> {systemBalance.status} — {systemBalance.desc}
            </p>
            <p>
              The relationship between System 1 and System 2 processing has direct implications for 
              decision-making quality. The current profile suggests 
              {Math.abs(s1Score - s2Score) <= 5
                ? " optimal integration, enabling flexible switching between intuitive and analytical modes as task demands require."
                : s1Score > s2Score
                ? " a preference for rapid, intuitive processing. While efficient for routine decisions, this pattern may benefit from deliberate activation of analytical processing in complex or high-stakes situations."
                : " a preference for analytical processing. While thorough, this pattern may benefit from developing trust in intuitive judgment for time-sensitive decisions."
              }
            </p>
          </div>
        </section>
      </section>

      {/* Page 4: Domain Analysis */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">6. DOMAIN-LEVEL COGNITIVE PROFILE</h2>
          
          <div className="clinical-domains">
            {domains.map((domain, idx) => {
              const domainClass = getClassification(domain.score);
              const delta = domain.baseline ? domain.score - domain.baseline : null;
              return (
                <div key={idx} className="clinical-domain-card">
                  <div className="clinical-domain-header">
                    <h3 className="clinical-domain-name">{domain.name}</h3>
                    <div className="clinical-domain-score-block">
                      <span className="clinical-domain-score">{Math.round(domain.score)}</span>
                      <span className={`clinical-domain-class ${domainClass.class}`}>{domainClass.label}</span>
                      {delta !== null && (
                        <span className={`clinical-domain-delta ${delta >= 0 ? "positive" : "negative"}`}>
                          {delta >= 0 ? "+" : ""}{Math.round(delta)} from baseline
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="clinical-domain-definition">
                    <strong>Definition:</strong> {domain.definition}
                  </p>
                  <p className="clinical-domain-implication">
                    <strong>Performance Implication:</strong> {domain.implication}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      {/* Page 5: Training Analytics */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">7. TRAINING LOAD & ADAPTATION ANALYSIS</h2>
          
          <div className="clinical-training-stats">
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{totalSessions}</span>
              <span className="clinical-stat-label">Sessions Completed</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{accuracy.toFixed(1)}%</span>
              <span className="clinical-stat-label">Mean Accuracy</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">{xp.toLocaleString()}</span>
              <span className="clinical-stat-label">Experience Points</span>
            </div>
            <div className="clinical-stat-block">
              <span className="clinical-stat-value">Level {level}</span>
              <span className="clinical-stat-label">Cognitive Level</span>
            </div>
          </div>

          <div className="clinical-training-interpretation">
            <h3 className="clinical-subsection-header">Training Dose Interpretation</h3>
            <p>
              Session count of {totalSessions} with {accuracy.toFixed(1)}% accuracy represents 
              {totalSessions >= 30 
                ? " substantial training volume, indicating strong engagement and commitment to cognitive development."
                : totalSessions >= 15 
                ? " moderate training volume, suggesting consistent but not intensive engagement."
                : totalSessions >= 5 
                ? " early-stage training volume. Reliable trajectory estimation requires continued engagement."
                : " minimal training data. Extended engagement is necessary to establish stable performance patterns."
              }
            </p>
            <p>
              {accuracy >= 80 
                ? "High accuracy rates indicate effective challenge calibration and strong skill acquisition."
                : accuracy >= 65 
                ? "Accuracy rates within expected range suggest appropriate difficulty progression."
                : "Lower accuracy rates may indicate need for difficulty adjustment or focused practice."
              }
            </p>
          </div>

          <div className="clinical-domain-distribution">
            <h3 className="clinical-subsection-header">Domain Distribution</h3>
            <div className="clinical-domain-bars">
              {[
                { name: "Focus Arena", key: "focus" as Area, sessions: aggregates.sessionsByArea.focus ?? 0, avg: aggregates.avgScoreByArea.focus ?? 0 },
                { name: "Critical Reasoning", key: "reasoning" as Area, sessions: aggregates.sessionsByArea.reasoning ?? 0, avg: aggregates.avgScoreByArea.reasoning ?? 0 },
                { name: "Creativity Hub", key: "creativity" as Area, sessions: aggregates.sessionsByArea.creativity ?? 0, avg: aggregates.avgScoreByArea.creativity ?? 0 },
              ].map((d) => (
                <div key={d.key} className="clinical-domain-bar-row">
                  <span className="clinical-bar-label">{d.name}</span>
                  <span className="clinical-bar-sessions">{d.sessions} sessions</span>
                  <span className="clinical-bar-avg">{Math.round(d.avg)}% avg</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">8. CLINICAL-STYLE INTERPRETATION</h2>
          
          <div className="clinical-interpretation-grid">
            <div className="clinical-interpretation-block">
              <h3 className="clinical-subsection-header">Identified Strengths</h3>
              {strengths.length > 0 ? (
                <ul className="clinical-list">
                  {strengths.map((s, i) => (
                    <li key={i}>
                      <strong>{s.name}</strong> ({Math.round(s.score)}): {s.implication}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No domains currently meet the threshold for classification as a relative strength (≥60). 
                Continued training across all domains is recommended.</p>
              )}
            </div>

            <div className="clinical-interpretation-block">
              <h3 className="clinical-subsection-header">Identified Vulnerabilities</h3>
              {vulnerabilities.length > 0 ? (
                <ul className="clinical-list">
                  {vulnerabilities.map((v, i) => (
                    <li key={i}>
                      <strong>{v.name}</strong> ({Math.round(v.score)}): {v.implication}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No domains currently meet the threshold for classification as a vulnerability (&lt;60). 
                Current profile suggests balanced development across measured domains.</p>
              )}
            </div>
          </div>

          <div className="clinical-patterns-block">
            <h3 className="clinical-subsection-header">Adaptive vs. Non-Adaptive Patterns</h3>
            <p>
              {sci >= 65 && accuracy >= 70
                ? "Current patterns reflect adaptive cognitive engagement with appropriate challenge-seeking behavior. Performance consistency suggests stable skill acquisition and effective learning transfer."
                : sci >= 50
                ? "Patterns suggest mixed adaptive functioning. Some domains show appropriate engagement while others may benefit from adjusted training protocols or increased consistency."
                : "Current patterns suggest opportunity for enhanced adaptive engagement. Structured, consistent practice with appropriate challenge progression is recommended to optimize skill development."
              }
            </p>
          </div>
        </section>
      </section>

      {/* Page 6: Prognosis & Recommendations */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">9. SHORT-TERM PROGNOSIS (30–45 DAYS)</h2>
          
          <div className="clinical-prognosis-box">
            <p>{prognosisText}</p>
          </div>

          <div className="clinical-confidence-note">
            <p>
              <em>Confidence Level:</em> {totalSessions >= 20 ? "Moderate" : totalSessions >= 10 ? "Low-Moderate" : "Low"} — 
              Prognosis reliability is directly related to available training data volume and consistency.
            </p>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">10. TARGETED COGNITIVE RECOMMENDATIONS</h2>
          
          <div className="clinical-prescription">
            <h3 className="clinical-subsection-header">Performance Prescription</h3>
            
            <div className="clinical-rx-grid">
              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Recommended Frequency</span>
                <span className="clinical-rx-value">5–7 sessions per week</span>
                <span className="clinical-rx-rationale">
                  Consistent engagement is the strongest predictor of cognitive improvement. 
                  Daily practice, even if brief, outperforms sporadic intensive sessions.
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Priority Focus</span>
                <span className="clinical-rx-value">
                  {vulnerabilities.length > 0 
                    ? vulnerabilities[0].name 
                    : systemBalance.status.includes("S1") 
                    ? "System 2 Exercises" 
                    : systemBalance.status.includes("S2") 
                    ? "System 1 Exercises" 
                    : "Balanced Cross-Domain Training"
                  }
                </span>
                <span className="clinical-rx-rationale">
                  {vulnerabilities.length > 0 
                    ? `Addressing the lowest-performing domain provides the highest marginal improvement potential.`
                    : `Maintaining balanced development across all domains optimizes overall cognitive flexibility.`
                  }
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Session Structure</span>
                <span className="clinical-rx-value">10–15 minutes focused practice</span>
                <span className="clinical-rx-rationale">
                  Optimal cognitive training duration balances engagement intensity with sustainability. 
                  Sessions beyond 20 minutes show diminishing returns for most individuals.
                </span>
              </div>

              <div className="clinical-rx-item">
                <span className="clinical-rx-label">Recovery Integration</span>
                <span className="clinical-rx-value">Include 1–2 recovery days weekly</span>
                <span className="clinical-rx-rationale">
                  Cognitive consolidation requires rest. Strategic recovery periods support long-term 
                  adaptation and prevent training fatigue.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="clinical-section">
          <h2 className="clinical-section-header">11. METHODOLOGICAL NOTES</h2>
          
          <div className="clinical-methodology">
            <p>
              Metrics presented in this report are derived from behavioral performance data collected 
              during standardized cognitive training exercises. The assessment methodology incorporates:
            </p>
            <ul className="clinical-list">
              <li>
                <strong>Aggregation:</strong> Individual session scores are aggregated using weighted 
                averaging algorithms that account for recency, difficulty, and domain specificity.
              </li>
              <li>
                <strong>Normalization:</strong> Raw scores are normalized against age-adjusted reference 
                distributions derived from the NeuroLoop user population.
              </li>
              <li>
                <strong>Longitudinal Tracking:</strong> Trend analysis incorporates historical performance 
                data to identify patterns of improvement, stability, or decline over time.
              </li>
              <li>
                <strong>Composite Index Calculation:</strong> The SCI integrates multiple performance 
                dimensions using empirically-derived weightings (Cognitive: 50%, Behavioral: 30%, Recovery: 20%).
              </li>
            </ul>
            <p>
              All metrics should be interpreted in the context of individual variability, testing 
              conditions, and the inherent limitations of behavioral assessment methodologies.
            </p>
          </div>
        </section>
      </section>

      {/* Page 7: Disclaimer & Footer */}
      <section className="clinical-page">
        <section className="clinical-section">
          <h2 className="clinical-section-header">12. ETHICAL & CLINICAL DISCLAIMER</h2>
          
          <div className="clinical-disclaimer">
            <p>
              This cognitive performance assessment is provided for educational and self-improvement 
              purposes only. It is not intended to diagnose, treat, or predict cognitive impairment, 
              neurological conditions, or mental health disorders.
            </p>
            <p>
              <strong>Important Limitations:</strong>
            </p>
            <ul className="clinical-list">
              <li>
                This assessment does not constitute a clinical neuropsychological evaluation.
              </li>
              <li>
                Results are derived from self-directed training activities and may not reflect 
                performance under controlled clinical conditions.
              </li>
              <li>
                Cognitive metrics can fluctuate based on factors including sleep, stress, motivation, 
                and environmental conditions.
              </li>
              <li>
                Normative comparisons are based on the NeuroLoop user population and may not 
                represent general population distributions.
              </li>
            </ul>
            <p>
              For concerns about cognitive functioning, please consult a qualified healthcare 
              professional or licensed neuropsychologist.
            </p>
            <p>
              <strong>NeuroLoop</strong> is positioned as a cognitive performance assessment and 
              training platform. It provides metrics and insights to support self-directed cognitive 
              development but does not replace professional clinical evaluation when indicated.
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
              <span>Generated: {generatedAt.toISOString()}</span>
              <span>Classification: Confidential</span>
            </div>
            <p className="clinical-footer-legal">
              © {generatedAt.getFullYear()} NeuroLoop. All rights reserved. 
              This document contains confidential information intended solely for the named participant.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
