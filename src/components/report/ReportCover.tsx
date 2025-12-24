// src/components/report/ReportCover.tsx
import React, { useMemo } from "react";

function goalsBadge(goals: string[]) {
  const hasFast = goals?.includes("fast_thinking");
  const hasSlow = goals?.includes("slow_thinking");
  if (hasFast && hasSlow) return "Balanced";
  if (hasFast) return "Fast Thinker";
  if (hasSlow) return "Deep Thinker";
  return "Adaptive";
}

export function ReportCover({ profile, metrics, generatedAt }: any) {
  const badge = useMemo(() => goalsBadge(profile.training_goals ?? []), [profile]);

  return (
    <section className="report-page">
      <div className="avoid-break">
        <div style={{ fontSize: 12, letterSpacing: 1, opacity: 0.7 }}>NEUROLOOP PRO</div>
        <h1 style={{ fontSize: 34, margin: "10px 0 6px 0" }}>Cognitive Intelligence Report</h1>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          {profile.name ?? "User"} · Generated {generatedAt.toLocaleDateString("en-GB")}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 999 }}>
            Training Goal: <strong>{badge}</strong>
          </div>
          <div style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 999 }}>
            SCI: <strong>{Math.round(metrics.cognitive_performance_score)}</strong>/100
          </div>
          <div style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 999 }}>
            Level: <strong>{metrics.cognitive_level}</strong>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 16, maxWidth: 520 }}>
          Think faster. Decide better.
        </div>
      </div>
    </section>
  );
}
