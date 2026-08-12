import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FolderOpen,
  Lock,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

import { ClinicalReport } from "@/components/report/ClinicalReport";
import { ReportHistoryList } from "@/components/report/ReportHistoryList";
import { LoomaLogo } from "@/components/ui/LoomaLogo";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useCognitiveAge } from "@/hooks/useCognitiveAge";
import { useCognitiveNetworkScore } from "@/hooks/useCognitiveNetworkScore";
import { useUserMetrics } from "@/hooks/useExercises";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useReportData } from "@/hooks/useReportData";
import { useReportHistory } from "@/hooks/useReportHistory";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";

import "@/styles/clinical-report.css";

const REPORT_CONTENT = [
  ["STATE", "Daily state, confidence and signal coverage"],
  ["SYS", "Cognitive systems, network and Cognitive Age"],
  ["HLT", "Recovery, Health and wearable context"],
  ["PAT", "Personal trends and training response"],
  ["COA", "Coach outlook and next useful action"],
] as const;

export default function CognitiveReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { canViewReport, canDownloadPDF, isLoading: accessLoading } = useReportAccess();

  const {
    loading,
    error,
    metrics: reportMetrics,
    profile,
    badges,
    wearable,
    latestOutlook,
    aggregates,
    metricSnapshots,
  } = useReportData(canViewReport && userId ? userId : "");
  const { data: liveMetrics, isLoading: metricsLoading } = useUserMetrics(
    canViewReport && userId ? userId : "",
  );
  const { sci: liveSci, isLoading: sciLoading } = useCognitiveNetworkScore();
  const {
    sharpness: liveSharpness,
    readiness: liveReadiness,
    recovery: liveRecovery,
    AE: liveAE,
    RA: liveRA,
    CT: liveCT,
    IN: liveIN,
    signalCoverage,
    signalCoverageLevel,
    signalUpdatedAt,
    signalSources,
    hasWearableData,
    isLoading: todayMetricsLoading,
  } = useTodayMetrics();
  const { rq: liveReasoningQuality, isLoading: reasoningQualityLoading } = useReasoningQuality();
  const { data: liveCognitiveAge, isLoading: cognitiveAgeLoading } = useCognitiveAge();
  const { reports, isLoading: historyLoading, saveReport } = useReportHistory(userId);

  const metrics = useMemo(() => {
    if (!reportMetrics && !liveMetrics) return null;
    return {
      ...reportMetrics,
      focus_stability: liveMetrics?.focus_stability ?? reportMetrics?.focus_stability,
      fast_thinking: liveMetrics?.fast_thinking ?? reportMetrics?.fast_thinking,
      reasoning_accuracy: liveMetrics?.reasoning_accuracy ?? reportMetrics?.reasoning_accuracy,
      slow_thinking: liveMetrics?.slow_thinking ?? reportMetrics?.slow_thinking,
      creativity: liveMetrics?.creativity ?? reportMetrics?.creativity,
      baseline_focus: liveMetrics?.baseline_focus ?? reportMetrics?.baseline_focus,
      baseline_fast_thinking: liveMetrics?.baseline_fast_thinking ?? reportMetrics?.baseline_fast_thinking,
      baseline_reasoning: liveMetrics?.baseline_reasoning ?? reportMetrics?.baseline_reasoning,
      baseline_slow_thinking: liveMetrics?.baseline_slow_thinking ?? reportMetrics?.baseline_slow_thinking,
      baseline_creativity: liveMetrics?.baseline_creativity ?? reportMetrics?.baseline_creativity,
      baseline_cognitive_age: liveMetrics?.baseline_cognitive_age ?? reportMetrics?.baseline_cognitive_age,
      cognitive_performance_score:
        liveMetrics?.cognitive_performance_score ?? reportMetrics?.cognitive_performance_score,
      total_sessions: liveMetrics?.total_sessions ?? reportMetrics?.total_sessions,
    };
  }, [liveMetrics, reportMetrics]);

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);
  const [downloading, setDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scale, setScale] = useState(0.4);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `LOOMA_Performance_Report_${generatedAt.toISOString().slice(0, 10)}`,
    onAfterPrint: async () => {
      try {
        await saveReport.mutateAsync({
          cognitiveAge: liveCognitiveAge.cognitiveAge ?? undefined,
          sciScore: liveSci?.total ?? undefined,
          fastThinking: metrics?.fast_thinking ?? undefined,
          slowThinking: metrics?.slow_thinking ?? undefined,
          totalSessions: metrics?.total_sessions ?? undefined,
        });
        toast.success("Report ready", {
          description: "Choose Save as PDF in the print dialog to keep a copy.",
        });
      } catch (saveError) {
        console.error("Error saving report history:", saveError);
      } finally {
        setDownloading(false);
      }
    },
    onPrintError: (printError) => {
      console.error("Print error:", printError);
      toast.error("The report could not be exported. Please try again.");
      setDownloading(false);
    },
  });

  const handleDownloadPDF = () => {
    if (!canDownloadPDF || !printRef.current) return;
    setDownloading(true);
    handlePrint();
  };

  if (accessLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!canViewReport) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-12 pt-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/35 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="mt-12">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Elite
            </div>
            <h1 className="mt-5 max-w-[10ch] text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.04em]">
              Your performance report.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-muted-foreground">
              A private, longitudinal view of what is shaping your cognitive state — and what to do next.
            </p>
          </div>

          <div className="mt-9 overflow-hidden rounded-[24px] border border-border/45 bg-card/45 px-5">
            {REPORT_CONTENT.map(([code, label]) => (
              <div
                key={code}
                className="grid grid-cols-[44px_1fr] items-center gap-3 border-b border-border/30 py-4 last:border-b-0"
              >
                <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/75">
                  {code}
                </span>
                <span className="text-[13px] leading-5 text-foreground/90">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10">
            <Button asChild className="h-12 w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Link to="/app/subscription">View LOOMA Elite</Link>
            </Button>
            <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground/70">
              Included with Elite and Founding Elite. No report credits or one-off purchases.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (
    loading ||
    metricsLoading ||
    sciLoading ||
    todayMetricsLoading ||
    reasoningQualityLoading ||
    cognitiveAgeLoading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Preparing your report…
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-muted-foreground">Report unavailable: {error}</div>;
  }

  if (!metrics || !profile || !aggregates) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-card/50">
          <LoomaLogo size={26} className="text-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Report calibrating</h1>
        <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
          Complete your baseline and keep LOOMA connected. Daily state, Health context and behavior will fill this report automatically.
        </p>
        <Button onClick={() => navigate("/app")} className="mt-7 h-11 rounded-full px-7">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111315]">
      <div className="sticky top-0 z-50 border-b border-white/8 bg-[#0d0f11]/95 backdrop-blur-xl print:hidden">
        <div className="flex items-center justify-between px-3 py-3 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/65 hover:bg-white/5 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="text-sm font-medium">Performance Report</div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-white/45">
                Elite · {generatedAt.toLocaleDateString("en-GB")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setScale((value) => Math.max(value - 0.15, 0.25))}
                className="flex h-7 w-7 items-center justify-center text-white/55 hover:text-white"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-9 text-center text-[9px] text-white/65">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={() => setScale((value) => Math.min(value + 0.15, 1))}
                className="flex h-7 w-7 items-center justify-center text-white/55 hover:text-white"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="h-8 gap-1.5 rounded-full bg-white px-3 text-[11px] text-black hover:bg-white/90"
            >
              <Download className="h-3 w-3" />
              {downloading ? "…" : "PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 print:hidden">
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-white">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-white/55" />
                <span className="text-xs">Previous exports</span>
                <span className="text-[10px] text-white/40">{reports.length}</span>
              </div>
              {showHistory ? <ChevronUp className="h-4 w-4 text-white/45" /> : <ChevronDown className="h-4 w-4 text-white/45" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {reports.length > 0 ? (
              <ReportHistoryList reports={reports} isLoading={historyLoading} />
            ) : (
              <p className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-center text-xs text-white/45">
                Your exported reports will appear here.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="relative overflow-auto p-4 print:overflow-visible print:p-0">
        <div
          ref={printRef}
          className="mx-auto origin-top bg-white shadow-2xl transition-transform duration-200 print:transform-none print:shadow-none"
          style={{
            width: "210mm",
            minWidth: "210mm",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <ClinicalReport
            profile={profile}
            metrics={metrics}
            aggregates={aggregates}
            badges={badges}
            generatedAt={generatedAt}
            liveSci={liveSci}
            liveDaily={{
              sharpness: liveSharpness,
              readiness: liveReadiness,
              recovery: liveRecovery,
              reasoningQuality: liveReasoningQuality,
              AE: liveAE,
              RA: liveRA,
              CT: liveCT,
              IN: liveIN,
            }}
            signalContext={{
              coverage: signalCoverage,
              level: signalCoverageLevel,
              updatedAt: signalUpdatedAt,
              sources: signalSources,
              hasWearableData,
            }}
            wearable={wearable}
            latestOutlook={latestOutlook}
            canonicalCognitiveAge={liveCognitiveAge.cognitiveAge}
            cognitiveAgeCalibrating={liveCognitiveAge.isCalibrating}
            metricSnapshots={metricSnapshots}
          />
        </div>
      </div>
    </div>
  );
}
