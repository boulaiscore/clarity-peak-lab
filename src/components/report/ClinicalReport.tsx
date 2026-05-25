// src/components/report/ClinicalReport.tsx
// Premium Cognitive Performance Dossier for A4/PDF output.
import React, { useMemo } from "react";
import { Brain } from "lucide-react";
import type { SCIBreakdown } from "@/lib/cognitiveNetworkScore";

type Area = "focus" | "reasoning" | "creativity";
type ConfidenceLevel = "Low" | "Developing" | "Moderate" | "High";

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
    sessionsLast7d?: number;
  };
  badges: Array<{
    badge_name: string;
    badge_category: string;
    earned_at?: string;
  }>;
  generatedAt: Date;
  isPreview?: boolean;
  liveSci?: SCIBreakdown | null;
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function avg(values: Array<number | null | undefined>, fallback = 50): number {
  const valid = values.filter((value): value is number => value !== null && value !== undefined);
  if (!valid.length) return fallback;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getPercentile(score: number): number {
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

function classifyScore(score: number): { label: string; tone: "excellent" | "strong" | "stable" | "watch" | "risk" } {
  if (score >= 85) return { label: "Elite", tone: "excellent" };
  if (score >= 72) return { label: "Strong", tone: "strong" };
  if (score >= 58) return { label: "Stable", tone: "stable" };
  if (score >= 45) return { label: "Watch", tone: "watch" };
  return { label: "Priority", tone: "risk" };
}

function formatWorkType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    knowledge: "Knowledge work",
    creative: "Creative professional",
    technical: "Technical / engineering",
    management: "Executive / management",
    student: "Student / academic",
    other: "Other",
  };
  return map[type || ""] || "Not specified";
}

function formatEducation(level: string | null | undefined, discipline: string | null | undefined): string {
  const levelMap: Record<string, string> = {
    high_school: "High school",
    bachelor: "Bachelor degree",
    master: "Master degree",
    phd: "Doctoral degree",
    other: "Other",
  };
  const disciplineMap: Record<string, string> = {
    stem: "STEM",
    humanities: "Humanities",
    business: "Business",
    health: "Health sciences",
    arts: "Arts",
    social_sciences: "Social sciences",
    law: "Law",
    other: "Other",
  };
  const formattedLevel = levelMap[level || ""] || "Not specified";
  const formattedDiscipline = disciplineMap[discipline || ""];
  return formattedDiscipline ? `${formattedLevel}, ${formattedDiscipline}` : formattedLevel;
}

function formatGameType(gameType: string): string {
  const map: Record<string, string> = {
    "S1-AE": "Attention efficiency",
    "S1-RA": "Rapid association",
    "S2-CT": "Critical reasoning",
    "S2-IN": "Insight formation",
  };
  return map[gameType] || gameType.replace(/[-_]/g, " ");
}

function getDataConfidence(sessionsLast7d: number, totalSessions: number): {
  level: ConfidenceLevel;
  score: number;
  description: string;
} {
  const recencyScore = Math.min(1, sessionsLast7d / 7);
  const volumeScore = Math.min(1, totalSessions / 30);
  const score = round((recencyScore * 0.55 + volumeScore * 0.45) * 100);

  if (score >= 80) {
    return {
      level: "High",
      score,
      description: "Recent volume and lifetime sample are sufficient for stable interpretation.",
    };
  }
  if (score >= 55) {
    return {
      level: "Moderate",
      score,
      description: "Interpretation is useful, with moderate sensitivity to recent behavior.",
    };
  }
  if (score >= 30) {
    return {
      level: "Developing",
      score,
      description: "Patterns are emerging, but more sessions are needed for high confidence.",
    };
  }
  return {
    level: "Low",
    score,
    description: "Use as an orientation snapshot until additional data is collected.",
  };
}

function getBalanceStatus(s1Score: number, s2Score: number): {
  label: string;
  interpretation: string;
  recommendation: string;
} {
  const diff = s1Score - s2Score;
  if (Math.abs(diff) <= 5) {
    return {
      label: "Integrated",
      interpretation: "Fast pattern recognition and deliberate reasoning are currently well balanced.",
      recommendation: "Preserve cross-domain training and alternate speed-first and reasoning-first sessions.",
    };
  }
  if (diff > 12) {
    return {
      label: "Fast-dominant",
      interpretation: "The profile favors rapid pattern recognition over slower analytical verification.",
      recommendation: "Add deliberate reasoning work before high-stakes decisions or strategic reviews.",
    };
  }
  if (diff > 5) {
    return {
      label: "Fast-leaning",
      interpretation: "The profile is efficient under time pressure, with a mild intuitive bias.",
      recommendation: "Use short analytical checklists to reduce overconfidence in ambiguous contexts.",
    };
  }
  if (diff < -12) {
    return {
      label: "Analytical-dominant",
      interpretation: "The profile favors deliberate processing over rapid intuitive commitment.",
      recommendation: "Train fast association and attentional switching to improve decision velocity.",
    };
  }
  return {
    label: "Analytical-leaning",
    interpretation: "The profile is careful and reflective, with a mild speed tradeoff.",
    recommendation: "Use time-boxed drills to improve speed without sacrificing reasoning quality.",
  };
}

function getReadinessText(cri: number): string {
  if (cri >= 75) return "Prepared for high cognitive demand";
  if (cri >= 60) return "Operationally ready with manageable load";
  if (cri >= 45) return "Functional, but recovery or load should be watched";
  return "Reduce load and prioritize recovery before deep work";
}

function getPrognosis(params: {
  sci: number;
  readiness: number;
  sessionsLast7d: number;
  accuracy: number;
  weakestDomain: string;
}): string {
  const { sci, readiness, sessionsLast7d, accuracy, weakestDomain } = params;
  if (sessionsLast7d < 2) {
    return `Current evidence is not yet dense enough for a reliable trajectory. The next 14 days should focus on increasing sample quality before interpreting change in ${weakestDomain}.`;
  }
  if (sci >= 72 && readiness >= 65 && accuracy >= 70) {
    return "Current profile supports sustained professional performance if weekly training and recovery cadence remain consistent. Near-term objective: preserve level while increasing resilience under load.";
  }
  if (sci >= 55) {
    return `Trajectory is improvable. A focused block targeting ${weakestDomain} should produce the clearest signal over the next 30 to 45 days if adherence remains consistent.`;
  }
  return `The profile is still in a build phase. Prioritize repeatable training volume, sleep/recovery regularity, and low-friction sessions before drawing strong conclusions from week-to-week changes.`;
}

function PageFooter({ reportId, page }: { reportId: string; page: number }) {
  return (
    <footer className="clinical-page-footer">
      <span>NeuroLoop Labs</span>
      <span>{reportId}</span>
      <span>Page {page}</span>
    </footer>
  );
}

function ScorePill({ value, label }: { value: number; label?: string }) {
  const classification = classifyScore(value);
  return (
    <span className={`clinical-score-pill ${classification.tone}`}>
      {label ?? classification.label}
    </span>
  );
}

function MetricTile({
  label,
  value,
  sublabel,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sublabel: string;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  return (
    <div className={`clinical-metric-tile ${tone}`}>
      <span className="clinical-metric-label">{label}</span>
      <span className="clinical-metric-value">{value}</span>
      <span className="clinical-metric-sub">{sublabel}</span>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="clinical-score-bar" aria-hidden="true">
      <div style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function ClinicalReport({
  profile,
  metrics,
  aggregates,
  badges,
  generatedAt,
  isPreview = false,
  liveSci,
}: ClinicalReportProps) {
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

  const AE = metrics.focus_stability ?? 50;
  const RA = metrics.fast_thinking ?? 50;
  const CT = metrics.reasoning_accuracy ?? 50;
  const IN = metrics.slow_thinking ?? 50;
  const creativity = metrics.creativity ?? avg([AE, RA, CT, IN]);

  const s1Score = round((AE + RA) / 2);
  const s2Score = round((CT + IN) / 2);
  const corePerformance = round(avg([AE, RA, CT, IN]), 1);

  const sci = liveSci?.total ?? round(metrics.cognitive_performance_score ?? corePerformance);
  const sciClass = classifyScore(sci);
  const sciPercentile = getPercentile(sci);
  const readiness = round(metrics.cognitive_readiness_score ?? avg([metrics.cognitive_readiness_score, corePerformance]), 0);
  const totalSessions = metrics.total_sessions ?? 0;
  const sessionsLast7d = aggregates.sessionsLast7d ?? 0;
  const accuracy = round(aggregates.accuracyRatePct ?? 0, 1);
  const xp = metrics.experience_points ?? 0;
  const level = metrics.cognitive_level ?? 1;
  const participantAge = profile.birth_date ? calculateAge(profile.birth_date) : null;

  const baselineForAge = avg([
    metrics.baseline_focus,
    metrics.baseline_fast_thinking,
    metrics.baseline_reasoning,
    metrics.baseline_slow_thinking,
    metrics.baseline_creativity,
  ]);
  const baselineCognitiveAge = metrics.baseline_cognitive_age ?? participantAge ?? 35;
  const hasBaselineSignal = [
    metrics.baseline_focus,
    metrics.baseline_fast_thinking,
    metrics.baseline_reasoning,
    metrics.baseline_slow_thinking,
    metrics.baseline_creativity,
  ].some((value) => value !== null && value !== undefined);
  const performanceForAge = avg([AE, RA, CT, IN, creativity]);

  const cognitiveAge = hasBaselineSignal
    ? round(baselineCognitiveAge - ((performanceForAge - baselineForAge) / 10), 1)
    : null;
  const cognitiveAgeDelta = participantAge && cognitiveAge !== null ? round(cognitiveAge - participantAge, 1) : null;
  const cognitiveAgeLabel = cognitiveAge === null
    ? "Calibrating"
    : `${cognitiveAge.toFixed(1)}y`;

  const sciComponents = {
    cognitive: liveSci?.cognitivePerformance.score ?? round(corePerformance),
    engagement: liveSci?.behavioralEngagement.score ?? round(Math.min(100, (sessionsLast7d / 7) * 100)),
    recovery: liveSci?.recoveryFactor.score ?? readiness,
  };

  const domainRows = [
    {
      key: "AE",
      name: "Attentional Efficiency",
      score: AE,
      baseline: metrics.baseline_focus,
      evidence: "Focus stability, attentional switching, interference resistance.",
      interpretation: AE >= 70
        ? "Supports sustained work blocks and resistance to distraction."
        : AE >= 55
          ? "Adequate for normal workload; fatigue may reduce precision."
          : "Likely bottleneck for deep work and complex task switching.",
    },
    {
      key: "RA",
      name: "Rapid Association",
      score: RA,
      baseline: metrics.baseline_fast_thinking,
      evidence: "Speed of pattern linking, intuitive compression, reaction quality.",
      interpretation: RA >= 70
        ? "Favors quick synthesis and rapid signal detection."
        : RA >= 55
          ? "Functional speed, with room to improve snap judgments."
          : "May slow early recognition of patterns under time pressure.",
    },
    {
      key: "CT",
      name: "Critical Reasoning",
      score: CT,
      baseline: metrics.baseline_reasoning,
      evidence: "Argument structure, causal inference, evidence weighting.",
      interpretation: CT >= 70
        ? "Strong for strategic evaluation and high-stakes decisions."
        : CT >= 55
          ? "Reliable in familiar contexts; ambiguity remains the main load."
          : "Primary target for decision quality and bias control.",
    },
    {
      key: "IN",
      name: "Insight Formation",
      score: IN,
      baseline: metrics.baseline_slow_thinking,
      evidence: "Conceptual reframing, abstraction, slow synthesis.",
      interpretation: IN >= 70
        ? "Strong capacity for reframing and second-order thinking."
        : IN >= 55
          ? "Good base for reflective work; benefits from deliberate practice."
          : "May limit strategic synthesis and non-obvious solution generation.",
    },
  ];

  const sortedDomains = [...domainRows].sort((a, b) => b.score - a.score);
  const strongest = sortedDomains[0];
  const weakest = sortedDomains[sortedDomains.length - 1];
  const balance = getBalanceStatus(s1Score, s2Score);
  const dataConfidence = getDataConfidence(sessionsLast7d, totalSessions);
  const prognosis = getPrognosis({
    sci,
    readiness,
    sessionsLast7d,
    accuracy,
    weakestDomain: weakest.name,
  });

  const trainingDistribution = [
    { label: "Focus", value: aggregates.sessionsByArea.focus ?? 0, avg: aggregates.avgScoreByArea.focus ?? 0 },
    { label: "Reasoning", value: aggregates.sessionsByArea.reasoning ?? 0, avg: aggregates.avgScoreByArea.reasoning ?? 0 },
    { label: "Creativity", value: aggregates.sessionsByArea.creativity ?? 0, avg: aggregates.avgScoreByArea.creativity ?? 0 },
  ];
  const maxTrainingSessions = Math.max(...trainingDistribution.map((item) => item.value), 1);
  const recommendedSessionLength = profile.session_duration || aggregates.preferredDuration || "10-15 minutes";

  const priorities = [
    {
      label: "Primary training lever",
      value: weakest.name,
      rationale: `${weakest.name} is currently the lowest measured domain and should receive the highest marginal attention.`,
    },
    {
      label: "Decision safeguard",
      value: balance.label,
      rationale: balance.recommendation,
    },
    {
      label: "Recovery watch",
      value: getReadinessText(readiness),
      rationale: "Readiness modulates whether training translates into reliable professional performance.",
    },
  ];

  return (
    <div className="clinical-report">
      {isPreview && <div className="clinical-watermark">Preview</div>}

      <section className="clinical-page clinical-cover-page">
        <div className="clinical-cover-topline">
          <div className="clinical-brand">
            <Brain size={24} />
            <div>
              <strong>NeuroLoop Labs</strong>
              <span>Cognitive Performance Laboratory</span>
            </div>
          </div>
          <div className="clinical-document-class">
            <span>Confidential</span>
            <strong>Performance dossier</strong>
          </div>
        </div>

        <div className="clinical-cover-hero">
          <span className="clinical-kicker">Professional cognitive report</span>
          <h1>Cognitive Performance Dossier</h1>
          <p>
            A structured assessment of cognitive capacity, decision readiness, training adaptation,
            and near-term performance priorities for high-demand professional work.
          </p>
        </div>

        <div className="clinical-cover-grid">
          <div>
            <span>Participant</span>
            <strong>{profile.name || "Confidential participant"}</strong>
          </div>
          <div>
            <span>Chronological age</span>
            <strong>{participantAge ? `${participantAge} years` : "Not provided"}</strong>
          </div>
          <div>
            <span>Professional context</span>
            <strong>{formatWorkType(profile.work_type)}</strong>
          </div>
          <div>
            <span>Education</span>
            <strong>{formatEducation(profile.education_level, profile.degree_discipline)}</strong>
          </div>
          <div>
            <span>Observation window</span>
            <strong>{observationWindow.start} - {observationWindow.end}</strong>
          </div>
          <div>
            <span>Report ID</span>
            <strong>{reportId}</strong>
          </div>
        </div>

        <div className="clinical-cover-metrics">
          <MetricTile label="SCI" value={sci} sublabel={`${sciPercentile}th percentile`} tone="accent" />
          <MetricTile label="Readiness" value={readiness} sublabel={getReadinessText(readiness)} tone="success" />
          <MetricTile label="Cognitive Age" value={cognitiveAgeLabel} sublabel={cognitiveAgeDelta === null ? "Baseline pending" : `${Math.abs(cognitiveAgeDelta).toFixed(1)}y ${cognitiveAgeDelta <= 0 ? "younger" : "older"}`} />
          <MetricTile label="Data Confidence" value={`${dataConfidence.score}%`} sublabel={dataConfidence.level} tone={dataConfidence.score >= 55 ? "success" : "warning"} />
        </div>

        <div className="clinical-cover-note">
          This report is designed for performance optimization, not medical diagnosis. Scores reflect behavioral
          training data and should be interpreted with the data-confidence rating above.
        </div>
        <PageFooter reportId={reportId} page={1} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>01</span>
          <div>
            <h2>Executive Summary</h2>
            <p>Current operating state and professional implications.</p>
          </div>
        </header>

        <div className="clinical-two-column">
          <div className="clinical-panel clinical-summary-panel">
            <h3>Interpretive statement</h3>
            <p>
              The current profile shows <strong>{sciClass.label.toLowerCase()}</strong> global cognitive
              performance with a Synthesized Cognitive Index of <strong>{sci}/100</strong>. The strongest
              measured domain is <strong>{strongest.name}</strong>; the principal development lever is
              <strong> {weakest.name}</strong>.
            </p>
            <p>
              The System 1 / System 2 balance is classified as <strong>{balance.label}</strong>. {balance.interpretation}
            </p>
          </div>

          <div className="clinical-panel">
            <h3>Data quality</h3>
            <div className="clinical-confidence-ring">
              <span>{dataConfidence.score}%</span>
              <ScoreBar value={dataConfidence.score} />
            </div>
            <p>{dataConfidence.description}</p>
            <dl className="clinical-compact-list">
              <div><dt>Last 7 days</dt><dd>{sessionsLast7d} sessions</dd></div>
              <div><dt>Lifetime volume</dt><dd>{totalSessions} sessions</dd></div>
              <div><dt>Mean accuracy</dt><dd>{accuracy}%</dd></div>
            </dl>
          </div>
        </div>

        <div className="clinical-metric-row">
          <MetricTile label="Core Performance" value={corePerformance.toFixed(1)} sublabel="Mean AE / RA / CT / IN" />
          <MetricTile label="System 1" value={s1Score} sublabel="Speed and attention" />
          <MetricTile label="System 2" value={s2Score} sublabel="Reasoning and insight" />
          <MetricTile label="Training Level" value={`L${level}`} sublabel={`${xp.toLocaleString()} XP`} />
        </div>

        <div className="clinical-panel clinical-findings">
          <h3>Key findings</h3>
          <ol>
            <li>
              <strong>Capacity:</strong> SCI of {sci} places the participant around the {sciPercentile}th percentile
              in the internal reference model.
            </li>
            <li>
              <strong>Readiness:</strong> CRI of {readiness} indicates {getReadinessText(readiness).toLowerCase()}.
            </li>
            <li>
              <strong>Architecture:</strong> {balance.label} profile with S1 {s1Score} and S2 {s2Score}.
            </li>
            <li>
              <strong>Priority:</strong> {weakest.name} is the clearest near-term performance lever.
            </li>
          </ol>
        </div>
        <PageFooter reportId={reportId} page={2} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>02</span>
          <div>
            <h2>SCI Breakdown</h2>
            <p>Composite performance, training engagement, and recovery contribution.</p>
          </div>
        </header>

        <div className="clinical-score-hero">
          <div>
            <span className="clinical-kicker">Synthesized Cognitive Index</span>
            <strong>{sci}</strong>
            <ScorePill value={sci} />
          </div>
          <p>
            SCI integrates cognitive performance, behavioral engagement, and recovery support. It is a functional
            readiness index for high-demand knowledge work rather than a diagnostic score.
          </p>
        </div>

        <div className="clinical-component-grid">
          <div className="clinical-component-card">
            <span>Cognitive performance</span>
            <strong>{round(sciComponents.cognitive)}</strong>
            <ScoreBar value={sciComponents.cognitive} />
            <p>Current skill base across attention, fast association, reasoning, and insight.</p>
          </div>
          <div className="clinical-component-card">
            <span>Behavioral engagement</span>
            <strong>{round(sciComponents.engagement)}</strong>
            <ScoreBar value={sciComponents.engagement} />
            <p>Training consistency and recent completion density.</p>
          </div>
          <div className="clinical-component-card">
            <span>Recovery factor</span>
            <strong>{round(sciComponents.recovery)}</strong>
            <ScoreBar value={sciComponents.recovery} />
            <p>Estimated capacity to convert effort into stable output.</p>
          </div>
        </div>

        <div className="clinical-panel">
          <h3>Operating interpretation</h3>
          <p>
            A high SCI without readiness is fragile; high readiness without engagement is under-utilized. This report
            therefore treats performance as a system: skill capacity, repeatable training behavior, and recovery must
            move together for durable improvement.
          </p>
          <div className="clinical-alert-row">
            <div>
              <span>Current bottleneck</span>
              <strong>{weakest.name}</strong>
            </div>
            <div>
              <span>Best preservation asset</span>
              <strong>{strongest.name}</strong>
            </div>
            <div>
              <span>Near-term confidence</span>
              <strong>{dataConfidence.level}</strong>
            </div>
          </div>
        </div>
        <PageFooter reportId={reportId} page={3} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>03</span>
          <div>
            <h2>Cognitive Architecture</h2>
            <p>Functional age estimate and dual-process balance.</p>
          </div>
        </header>

        <div className="clinical-two-column">
          <div className="clinical-panel clinical-age-panel">
            <h3>Cognitive Age</h3>
            <div className="clinical-age-value">{cognitiveAgeLabel}</div>
            <p>
              {cognitiveAge === null
                ? "The age estimate is intentionally withheld until baseline data is sufficient. This avoids presenting a single-session fluctuation as a stable trait."
                : `Current estimate is ${Math.abs(cognitiveAgeDelta ?? 0).toFixed(1)} years ${cognitiveAgeDelta !== null && cognitiveAgeDelta <= 0 ? "younger" : "older"} than chronological age.`}
            </p>
            <dl className="clinical-compact-list">
              <div><dt>Chronological age</dt><dd>{participantAge ? `${participantAge}y` : "Not provided"}</dd></div>
              <div><dt>Baseline signal</dt><dd>{hasBaselineSignal ? "Available" : "Calibrating"}</dd></div>
              <div><dt>Interpretation</dt><dd>Functional performance marker</dd></div>
            </dl>
          </div>

          <div className="clinical-panel clinical-age-panel">
            <h3>Dual-process profile</h3>
            <div className="clinical-dual-bars">
              <div>
                <span>System 1</span>
                <strong>{s1Score}</strong>
                <ScoreBar value={s1Score} />
              </div>
              <div>
                <span>System 2</span>
                <strong>{s2Score}</strong>
                <ScoreBar value={s2Score} />
              </div>
            </div>
            <p>{balance.interpretation}</p>
          </div>
        </div>

        <div className="clinical-panel">
          <h3>Decision-performance implications</h3>
          <div className="clinical-implication-grid">
            <div>
              <span>If time pressure rises</span>
              <p>{s1Score >= s2Score ? "Use a pre-commitment checklist to protect against fast but under-verified conclusions." : "Use time-boxed heuristics to avoid over-analysis and decision drag."}</p>
            </div>
            <div>
              <span>If ambiguity rises</span>
              <p>{CT >= 65 ? "Reasoning capacity is sufficient; prioritize evidence quality and assumption logging." : "Escalate to structured causal analysis before choosing a course of action."}</p>
            </div>
            <div>
              <span>If workload rises</span>
              <p>{readiness >= 65 ? "Current readiness supports load, but monitor recovery after consecutive deep-work days." : "Protect recovery before increasing cognitive training intensity."}</p>
            </div>
          </div>
        </div>
        <PageFooter reportId={reportId} page={4} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>04</span>
          <div>
            <h2>Domain Profile</h2>
            <p>Measured skills, baseline movement, and operational meaning.</p>
          </div>
        </header>

        <div className="clinical-domain-table">
          {domainRows.map((domain) => {
            const delta = domain.baseline !== null && domain.baseline !== undefined
              ? round(domain.score - domain.baseline, 1)
              : null;
            return (
              <div key={domain.key} className="clinical-domain-row">
                <div>
                  <span>{domain.key}</span>
                  <strong>{domain.name}</strong>
                  <p>{domain.evidence}</p>
                </div>
                <div className="clinical-domain-score">
                  <strong>{round(domain.score)}</strong>
                  <ScorePill value={domain.score} />
                </div>
                <div className="clinical-domain-bar-cell">
                  <ScoreBar value={domain.score} />
                  <small>{delta === null ? "No baseline delta" : `${delta >= 0 ? "+" : ""}${delta} vs baseline`}</small>
                </div>
                <p>{domain.interpretation}</p>
              </div>
            );
          })}
        </div>
        <PageFooter reportId={reportId} page={5} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>05</span>
          <div>
            <h2>Training Load And Adaptation</h2>
            <p>Recent exposure, domain distribution, and signal maturity.</p>
          </div>
        </header>

        <div className="clinical-metric-row">
          <MetricTile label="Last 7 days" value={sessionsLast7d} sublabel="Completed sessions" />
          <MetricTile label="Lifetime" value={totalSessions} sublabel="Total sessions" />
          <MetricTile label="Accuracy" value={`${accuracy}%`} sublabel="Mean session score" />
          <MetricTile label="XP" value={xp.toLocaleString()} sublabel={`Level ${level}`} />
        </div>

        <div className="clinical-panel">
          <h3>Training distribution</h3>
          <div className="clinical-training-distribution">
            {trainingDistribution.map((item) => (
              <div key={item.label}>
                <div className="clinical-training-row">
                  <span>{item.label}</span>
                  <strong>{item.value} sessions</strong>
                  <em>{round(item.avg)} avg</em>
                </div>
                <div className="clinical-distribution-bar">
                  <div style={{ width: `${(item.value / maxTrainingSessions) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="clinical-two-column">
          <div className="clinical-panel">
            <h3>Most repeated drills</h3>
            {aggregates.mostUsedExercises.length > 0 ? (
              <ol className="clinical-ranked-list">
                {aggregates.mostUsedExercises.slice(0, 5).map((exercise) => (
                  <li key={exercise.exerciseId}>
                    <span>{formatGameType(exercise.exerciseId)}</span>
                    <strong>{exercise.count}x</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No repeated drill pattern is available yet.</p>
            )}
          </div>
          <div className="clinical-panel">
            <h3>Recent achievements</h3>
            {badges.length > 0 ? (
              <ol className="clinical-ranked-list">
                {badges.slice(0, 5).map((badge) => (
                  <li key={`${badge.badge_name}-${badge.earned_at ?? ""}`}>
                    <span>{badge.badge_name}</span>
                    <strong>{badge.badge_category}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No badge signal yet. Prioritize consistency before interpreting achievements.</p>
            )}
          </div>
        </div>
        <PageFooter reportId={reportId} page={6} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>06</span>
          <div>
            <h2>Performance Protocol</h2>
            <p>Actionable guidance for the next 30 to 45 days.</p>
          </div>
        </header>

        <div className="clinical-panel clinical-prognosis">
          <h3>Near-term prognosis</h3>
          <p>{prognosis}</p>
        </div>

        <div className="clinical-protocol-grid">
          {priorities.map((priority, index) => (
            <div key={priority.label} className="clinical-protocol-card">
              <span>0{index + 1}</span>
              <h3>{priority.label}</h3>
              <strong>{priority.value}</strong>
              <p>{priority.rationale}</p>
            </div>
          ))}
        </div>

        <div className="clinical-panel">
          <h3>Recommended cadence</h3>
          <div className="clinical-cadence-grid">
            <div>
              <strong>5 sessions/week</strong>
              <span>Minimum dose for a stable training signal.</span>
            </div>
            <div>
              <strong>{recommendedSessionLength}</strong>
              <span>Preferred session length for sustainable cognitive load.</span>
            </div>
            <div>
              <strong>2 review moments</strong>
              <span>Weekly review of domain drift and readiness constraints.</span>
            </div>
          </div>
        </div>

        <div className="clinical-note">
          <strong>Professional use note:</strong> On low-readiness days, use the report as a planning instrument:
          reduce cognitively expensive meetings, protect deep-work blocks, and delay irreversible strategic choices
          when decision quality can materially benefit from recovery.
        </div>
        <PageFooter reportId={reportId} page={7} />
      </section>

      <section className="clinical-page">
        <header className="clinical-page-header">
          <span>07</span>
          <div>
            <h2>Methodology And Limits</h2>
            <p>How to read this report responsibly.</p>
          </div>
        </header>

        <div className="clinical-method-grid">
          <div className="clinical-panel">
            <h3>Inputs</h3>
            <p>
              Scores are derived from in-app cognitive training, session completion, accuracy patterns,
              domain routing, and optional recovery signals. The observation window is {observationWindow.start}
              {" "}to {observationWindow.end}.
            </p>
          </div>
          <div className="clinical-panel">
            <h3>Normalization</h3>
            <p>
              Metrics are normalized to a 0-100 operating scale. Percentile language is directional and based
              on the platform reference model, not a clinical population norm.
            </p>
          </div>
          <div className="clinical-panel">
            <h3>Confidence</h3>
            <p>
              Confidence increases with recent volume, lifetime sample size, and consistency. The current
              confidence classification is {dataConfidence.level}.
            </p>
          </div>
          <div className="clinical-panel">
            <h3>Limits</h3>
            <p>
              This dossier is not a diagnosis, neuropsychological evaluation, medical record, or substitute
              for clinical care. It is a performance interpretation tool for self-directed optimization.
            </p>
          </div>
        </div>

        <div className="clinical-final-statement">
          <div className="clinical-brand small">
            <Brain size={18} />
            <div>
              <strong>NeuroLoop Labs</strong>
              <span>Preserve human thinking</span>
            </div>
          </div>
          <p>
            This document contains confidential personal performance information intended for the named
            participant. Share only with trusted coaches, clinicians, or advisors when relevant.
          </p>
          <dl className="clinical-compact-list">
            <div><dt>Generated</dt><dd>{generatedAt.toISOString()}</dd></div>
            <div><dt>Classification</dt><dd>Confidential</dd></div>
            <div><dt>Document type</dt><dd>Cognitive performance dossier</dd></div>
          </dl>
        </div>
        <PageFooter reportId={reportId} page={8} />
      </section>
    </div>
  );
}
