// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Play, Download, Lock, FileText, Check, Crown } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id as string;

  const { loading, error, metrics, profile, badges, wearable, aggregates } = useReportData(userId);
  const { canViewReport, canDownloadPDF, isPremium, refetchPurchase } = useReportAccess();

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);
  const [downloading, setDownloading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle payment return
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast.success("Payment successful!", {
        description: "Your PDF is ready to download.",
      });
      refetchPurchase();
      // Clear the URL params
      setSearchParams({});
    } else if (payment === 'canceled') {
      toast.info("Payment canceled", {
        description: "You can try again anytime.",
      });
      setSearchParams({});
    }
  }, [searchParams, refetchPurchase, setSearchParams]);

  const handleStripeCheckout = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Please log in to purchase");
      return;
    }
    
    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-report-checkout', {
        body: {
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/#/app/report?payment=success`,
          cancelUrl: `${window.location.origin}/#/app/report?payment=canceled`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!canDownloadPDF) {
      setShowPurchaseModal(true);
      return;
    }
    
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
      toast.success("PDF downloaded successfully!");
    } finally {
      setDownloading(false);
    }
  };

  // Redirect free users to dashboard
  if (!isPremium) {
    return (
      <div className="p-4 max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-lg font-semibold mb-2">Premium Feature</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          The Cognitive Intelligence Report is available exclusively for Premium members.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/app/premium">
            <Button variant="premium" className="w-full gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
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
        <Button 
          variant={canDownloadPDF ? "default" : "outline"}
          className="gap-2"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {canDownloadPDF ? (
            <>
              <Download className="w-4 h-4" />
              {downloading ? "Generating..." : "Download PDF"}
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Download PDF - €4.99
            </>
          )}
        </Button>
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

      {/* Purchase Modal */}
      <AlertDialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Download PDF Report</AlertDialogTitle>
            <div className="text-3xl font-bold text-primary mt-2">€4.99</div>
            <AlertDialogDescription className="text-sm mt-1">
              One-time purchase for this report
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            {[
              "Professional A4 PDF format",
              "All cognitive metrics & insights",
              "Shareable with coaches & professionals",
              "Download valid for 7 days",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              variant="premium" 
              className="w-full gap-2"
              onClick={handleStripeCheckout}
              disabled={processingPayment}
            >
              {processingPayment ? "Processing..." : "Purchase & Download"}
            </Button>
            <AlertDialogCancel className="w-full mt-0">Maybe Later</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
