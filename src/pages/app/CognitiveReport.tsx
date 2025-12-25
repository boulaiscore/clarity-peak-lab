// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Brain, Play } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useAuth } from "@/contexts/AuthContext";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";

import "@/styles/report-print.css";

import { ReportCover } from "@/components/report/ReportCover";
import { ReportSCI } from "@/components/report/ReportSCI";
import { ReportDualProcess } from "@/components/report/ReportDualProcess";
import { ReportDomains } from "@/components/report/ReportDomains";
import { ReportMetaCognitive } from "@/components/report/ReportMetaCognitive";
import { ReportTrainingAnalytics } from "@/components/report/ReportTrainingAnalytics";
import { ReportAchievements } from "@/components/report/ReportAchievements";
import { ReportPhysio } from "@/components/report/ReportPhysio";
import { ReportActionable } from "@/components/report/ReportActionable";
import { ReportMethodology } from "@/components/report/ReportMethodology";

export default function CognitiveReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id as string;

  const { loading, error, metrics, profile, badges, wearable, aggregates } = useReportData(userId);

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `NeuroLoop_Report_${generatedAt.toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        width: 794,
        windowWidth: 794,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { 
        mode: ['css', 'avoid-all'],
        before: ['.page-break-before'],
        avoid: ['.avoid-break', '.summary-card', '.domain-card', '.conclusions-box', '.dual-process-card', '.sci-stat']
      }
    };

    try {
      await html2pdf().set(opt).from(printRef.current).save();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-6">Generating report data…</div>;
  
  if (error) return <div className="p-6">Error: {error}</div>;

  // Show empty state when user has no training data yet
  if (!metrics || !profile || !aggregates) {
    return (
      <div className="p-4 max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-lg font-semibold mb-2">No Data Available</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Complete your initial assessment or a training session to generate your cognitive intelligence report.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/neuro-lab">
            <Button variant="premium" className="w-full gap-2">
              <Play className="w-4 h-4" />
              Start Training
            </Button>
          </Link>
          <button 
            onClick={() => navigate(-1)} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[220mm] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-3 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Cognitive Intelligence Report</h1>
            <div className="text-xs opacity-70">
              Generated {generatedAt.toLocaleDateString("en-GB")}
            </div>
          </div>
        </div>
        <button 
          className="nl-btn" 
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <div ref={printRef} className="report-root">
        <ReportCover profile={profile} metrics={metrics} generatedAt={generatedAt} />
        <ReportSCI metrics={metrics} />
        <ReportDualProcess profile={profile} metrics={metrics} />
        <ReportDomains metrics={metrics} aggregates={aggregates} />
        <ReportMetaCognitive metrics={metrics} />
        <ReportTrainingAnalytics profile={profile} metrics={metrics} aggregates={aggregates} />
        <ReportAchievements badges={badges} />
        <ReportPhysio metrics={metrics} wearable={wearable} />
        <ReportActionable profile={profile} metrics={metrics} aggregates={aggregates} />
        <ReportMethodology />
      </div>
    </div>
  );
}
