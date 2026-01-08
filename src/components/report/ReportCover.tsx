import React, { useMemo } from "react";
import { Brain, Calendar, User, Briefcase, GraduationCap, Target } from "lucide-react";

interface ReportCoverProps {
  profile: {
    name?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    work_type?: string | null;
    education_level?: string | null;
    degree_discipline?: string | null;
    training_goals?: string[] | null;
    daily_time_commitment?: string | null;
  };
  metrics: {
    cognitive_performance_score?: number | null;
    fast_thinking?: number | null;
    slow_thinking?: number | null;
    focus_stability?: number | null;
    reasoning_accuracy?: number | null;
    creativity?: number | null;
    cognitive_level?: number | null;
    total_sessions?: number;
  };
  generatedAt: Date;
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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
    phd: "Doctoral Degree (PhD)",
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

function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) return { label: "LOW RISK", color: "#2e7d32", bg: "#c8e6c9" };
  if (score >= 50) return { label: "MODERATE RISK", color: "#f57c00", bg: "#ffe0b2" };
  return { label: "HIGH RISK", color: "#c62828", bg: "#ffcdd2" };
}

export function ReportCover({ profile, metrics, generatedAt }: ReportCoverProps) {
  const sci = Math.round(metrics.cognitive_performance_score ?? 50);
  const level = metrics.cognitive_level ?? 1;
  const sessions = metrics.total_sessions ?? 0;
  const riskInfo = getRiskLevel(sci);

  const age = profile.birth_date ? calculateAge(profile.birth_date) : null;

  // Radar data - 5 axes for pentagon
  const domains = [
    { name: "System 1", value: metrics.fast_thinking ?? 50, angle: -90 },
    { name: "Focus", value: metrics.focus_stability ?? 50, angle: -18 },
    { name: "Reasoning", value: metrics.reasoning_accuracy ?? 50, angle: 54 },
    { name: "Creativity", value: metrics.creativity ?? 50, angle: 126 },
    { name: "System 2", value: metrics.slow_thinking ?? 50, angle: 198 },
  ];

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;

  // Create pentagon points
  const getPolygonPoints = (radius: number, numPoints: number = 5) => {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = ((360 / numPoints) * i - 90) * (Math.PI / 180);
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return points.map(p => `${p.x},${p.y}`).join(" ");
  };

  // Data polygon based on values
  const dataPoints = domains.map((d, i) => {
    const radius = (d.value / 100) * maxRadius;
    const angle = ((360 / 5) * i - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Label positions
  const labelPositions = domains.map((d, i) => {
    const radius = maxRadius + 25;
    const angle = ((360 / 5) * i - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      name: d.name,
      value: Math.round(d.value),
    };
  });

  return (
    <section className="report-page report-cover-medical">
      {/* Header */}
      <div className="medical-header">
        <div className="medical-logo">
          <Brain size={32} />
          <div className="logo-text">
            <span className="logo-name">NeuroLoop</span>
            <span className="logo-sub">Cognitive Performance Lab</span>
          </div>
        </div>
        <div className="medical-doc-type">
          <span>COGNITIVE ASSESSMENT REPORT</span>
          <span className="doc-id">Report ID: NL-{generatedAt.getTime().toString(36).toUpperCase()}</span>
        </div>
      </div>

      {/* Patient Info Section */}
      <div className="medical-patient-section">
        <h2 className="section-header">PARTICIPANT INFORMATION</h2>
        <div className="patient-grid">
          <div className="patient-field">
            <User size={16} />
            <div className="field-content">
              <span className="field-label">Full Name</span>
              <span className="field-value">{profile.name || "Participant"}</span>
            </div>
          </div>
          <div className="patient-field">
            <Calendar size={16} />
            <div className="field-content">
              <span className="field-label">Date of Birth</span>
              <span className="field-value">
                {profile.birth_date 
                  ? new Date(profile.birth_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "Not provided"
                }
                {age !== null && ` (Age ${age})`}
              </span>
            </div>
          </div>
          <div className="patient-field">
            <Briefcase size={16} />
            <div className="field-content">
              <span className="field-label">Occupation Type</span>
              <span className="field-value">{formatWorkType(profile.work_type)}</span>
            </div>
          </div>
          <div className="patient-field">
            <GraduationCap size={16} />
            <div className="field-content">
              <span className="field-label">Education</span>
              <span className="field-value">{formatEducation(profile.education_level, profile.degree_discipline)}</span>
            </div>
          </div>
          <div className="patient-field">
            <Calendar size={16} />
            <div className="field-content">
              <span className="field-label">Assessment Date</span>
              <span className="field-value">{generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <div className="patient-field">
            <Target size={16} />
            <div className="field-content">
              <span className="field-label">Training Sessions Analyzed</span>
              <span className="field-value">{sessions} sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="medical-content">
        {/* Left: Summary Stats */}
        <div className="summary-panel">
          <div className="sci-main-box">
            <span className="sci-title">SYNTHESIZED COGNITIVE INDEX</span>
            <div className="sci-big-score">
              <span className="score-number">{sci}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="sci-level">Cognitive Level {level}</div>
          </div>

          <div className="risk-assessment-box" style={{ background: riskInfo.bg, borderColor: riskInfo.color }}>
            <span className="risk-title">COGNITIVE RISK ASSESSMENT</span>
            <span className="risk-level" style={{ color: riskInfo.color }}>{riskInfo.label}</span>
          </div>

          <div className="quick-stats">
            {domains.map((d) => (
              <div key={d.name} className="quick-stat">
                <span className="stat-name">{d.name}</span>
                <div className="stat-bar">
                  <div className="stat-bar-fill" style={{ width: `${d.value}%` }} />
                </div>
                <span className="stat-value">{Math.round(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Radar Chart */}
        <div className="radar-panel">
          <h3 className="radar-title">COGNITIVE PROFILE VISUALIZATION</h3>
          <svg viewBox="0 0 300 300" className="medical-radar">
            {/* Background rings */}
            <polygon points={getPolygonPoints(maxRadius)} fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
            <polygon points={getPolygonPoints(maxRadius * 0.75)} fill="#fafafa" stroke="#e0e0e0" strokeWidth="1" />
            <polygon points={getPolygonPoints(maxRadius * 0.5)} fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
            <polygon points={getPolygonPoints(maxRadius * 0.25)} fill="#fff" stroke="#e0e0e0" strokeWidth="1" />

            {/* Axis lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = ((360 / 5) * i - 90) * (Math.PI / 180);
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + maxRadius * Math.cos(angle)}
                  y2={centerY + maxRadius * Math.sin(angle)}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data polygon */}
            <polygon
              points={dataPath}
              fill="rgba(0, 137, 123, 0.25)"
              stroke="#00897b"
              strokeWidth="2.5"
            />

            {/* Data points */}
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="5" fill="#00897b" stroke="#fff" strokeWidth="2" />
            ))}
          </svg>

          {/* Labels */}
          <div className="radar-labels">
            {labelPositions.map((l, i) => (
              <div
                key={i}
                className="radar-label"
                style={{
                  left: `${(l.x / 300) * 100}%`,
                  top: `${(l.y / 300) * 100}%`,
                }}
              >
                <span className="label-name">{l.name}</span>
                <span className="label-value">{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="medical-footer">
        <p>
          This cognitive assessment report is generated by NeuroLoop's proprietary analysis algorithms based on training performance data.
          Results are for educational and self-improvement purposes. This is not a clinical neuropsychological evaluation.
        </p>
        <div className="footer-meta">
          <span>NeuroLoop Pro v2.0</span>
          <span>•</span>
          <span>Generated: {generatedAt.toISOString()}</span>
        </div>
      </div>
    </section>
  );
}
