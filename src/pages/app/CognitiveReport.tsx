// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useReportData } from "@/hooks/useReportData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";

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
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { loading, error, metrics, profile, sessions, badges, wearable, aggregates } = useReportData(userId);

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const pages = printRef.current.querySelectorAll('.report-page');
      
      if (pages.length === 0) {
        toast({ title: "Errore", description: "Nessuna pagina trovata nel report", variant: "destructive" });
        return;
      }

      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Capture page as canvas with high resolution
        const canvas = await html2canvas(page, {
          scale: 2, // 2x resolution for better quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight
        });

        // Calculate dimensions to fit A4
        const imgWidth = a4Width;
        const imgHeight = (canvas.height * a4Width) / canvas.width;
        
        // Add new page if not the first
        if (i > 0) {
          pdf.addPage();
        }

        // Add image centered on page
        const xOffset = 0;
        const yOffset = Math.max(0, (a4Height - imgHeight) / 2);
        
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          xOffset,
          yOffset,
          imgWidth,
          Math.min(imgHeight, a4Height)
        );
      }

      // Generate filename with date
      const dateStr = generatedAt.toISOString().split('T')[0];
      pdf.save(`NeuroLoop-Report-${dateStr}.pdf`);
      
      toast({ title: "PDF generato", description: "Il report è stato scaricato con successo" });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({ title: "Errore", description: "Impossibile generare il PDF", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

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
        <button 
          className="nl-btn flex items-center gap-2" 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </button>
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
