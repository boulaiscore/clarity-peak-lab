// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef } from "react";
import { useReportData } from "@/hooks/useReportData";
import { useAuth } from "@/contexts/AuthContext";

import "@/styles/report-print.css";

import { ReportCover } from "@/components/report/ReportCover";
import { ReportSCI } from "@/components/report/ReportSCI";
import { ReportDualProcess } from "@/components/report/ReportDualProcess";
import { ReportDomains } from "@/components/report/ReportDomains";
import { ReportTrends } from "@/components/report/ReportTrends";
import { ReportMetaCognitive } from "@/components/report/ReportMetaCognitive";
import { ReportTrainingAnalytics } from "@/components/report/ReportTrainingAnalytics";
import { ReportRecommendations } from "@/components/report/ReportRecommendations";
import { ReportAchievements } from "@/components/report/ReportAchievements";
import { ReportPhysio } from "@/components/report/ReportPhysio";
import { ReportActionable } from "@/components/report/ReportActionable";
import { ReportMethodology } from "@/components/report/ReportMethodology";

export default function CognitiveReport() {
  const { user } = useAuth();
  const userId = user?.id as string;

  const { loading, error, metrics, profile, sessions, badges, wearable, aggregates } = useReportData(userId);

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-6">Generating report data…</div>;
  if (error || !metrics || !profile || !aggregates) return <div className="p-6">Error: {error ?? "Missing data"}</div>;

  return (
    <div className="p-4 max-w-[220mm] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-3 print:hidden">
        <div>
          <h1 className="text-lg font-semibold">Cognitive Intelligence Report</h1>
          <div className="text-xs opacity-70">
            Generated {generatedAt.toLocaleDateString("en-GB")}
          </div>
        </div>
        <button className="nl-btn" onClick={handlePrint}>
          Download PDF
        </button>
      </div>

      <div ref={printRef} className="report-root">
        <ReportCover profile={profile} metrics={metrics} generatedAt={generatedAt} />
        <ReportSCI metrics={metrics} />
        <ReportDualProcess profile={profile} metrics={metrics} />
        <ReportDomains metrics={metrics} aggregates={aggregates} />
        <ReportTrends sessions={sessions} metrics={metrics} />
        <ReportMetaCognitive metrics={metrics} />
        <ReportTrainingAnalytics profile={profile} metrics={metrics} aggregates={aggregates} />
        <ReportRecommendations metrics={metrics} aggregates={aggregates} profile={profile} />
        <ReportAchievements badges={badges} />
        <ReportPhysio metrics={metrics} wearable={wearable} />
        <ReportActionable profile={profile} metrics={metrics} aggregates={aggregates} />
        <ReportMethodology />
      </div>
    </div>
  );
}
