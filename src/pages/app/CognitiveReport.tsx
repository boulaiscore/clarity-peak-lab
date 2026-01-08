// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Play, Download, Lock, FileText, Check, Crown, Package, Sparkles } from "lucide-react";
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
import { ReportPreviewMockup } from "@/components/report/ReportPreviewMockup";

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

const CREDIT_PACKAGES = [
  { id: 'single', credits: 1, price: '€4.99', pricePerReport: '€4.99', popular: false },
  { id: 'pack5', credits: 5, price: '€19.99', pricePerReport: '€4.00', popular: true, savings: '20%' },
  { id: 'pack10', credits: 10, price: '€34.99', pricePerReport: '€3.50', popular: false, savings: '30%' },
];

export default function CognitiveReport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id as string;

  const { loading, error, metrics, profile, badges, wearable, aggregates } = useReportData(userId);
  const { canViewReport, canDownloadPDF, reportCredits, isPremium, refetchPurchase, useCredit } = useReportAccess();

  const printRef = useRef<HTMLDivElement>(null);
  const generatedAt = useMemo(() => new Date(), []);
  const [downloading, setDownloading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('pack5');

  // Handle payment return
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast.success("Payment successful!", {
        description: "Your credits have been added.",
      });
      refetchPurchase();
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
      const { data, error } = await supabase.functions.invoke('create-report-credits-checkout', {
        body: {
          userId: user.id,
          userEmail: user.email,
          packageType: selectedPackage,
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
    
    // Use a credit if we have credits (not legacy purchase)
    if (reportCredits > 0) {
      try {
        await useCredit.mutateAsync();
      } catch (err) {
        console.error('Error using credit:', err);
        toast.error("Failed to use credit. Please try again.");
        setDownloading(false);
        return;
      }
    }
    
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

  // Show preview for non-premium users
  if (!isPremium) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Cognitive Intelligence Report</h1>
            <p className="text-xs text-muted-foreground">Preview • Premium Feature</p>
          </div>
        </div>

        {/* Premium badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mx-auto">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Premium Only</span>
        </div>

        {/* Report Preview Mockup */}
        <ReportPreviewMockup />

        {/* What's included */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">What's Included</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Cognitive Age Analysis",
              "SCI Breakdown",
              "Dual-Process Scores",
              "Domain Analysis",
              "Training Analytics",
              "Meta-Cognitive Profile",
              "Physio Integration",
              "Personalized Actions",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Link to="/app/premium">
            <Button variant="premium" className="w-full gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </Link>
          <p className="text-[10px] text-center text-muted-foreground">
            Get unlimited report access + all premium features
          </p>
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
        <div className="flex items-center gap-2">
          {reportCredits > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{reportCredits} credits</span>
            </div>
          )}
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
                Buy Credits
              </>
            )}
          </Button>
        </div>
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

      {/* Purchase Modal with Package Options */}
      <AlertDialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Get Report Credits</AlertDialogTitle>
            <AlertDialogDescription className="text-sm mt-1">
              Choose a package to download PDF reports
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Package Options */}
          <div className="space-y-2 py-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left relative ${
                  selectedPackage === pkg.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pkg.credits} Report{pkg.credits > 1 ? 's' : ''}</span>
                      {pkg.savings && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-500">
                          Save {pkg.savings}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{pkg.pricePerReport}/report</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{pkg.price}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-2 py-2 border-t border-border/50">
            {[
              "Professional A4 PDF format",
              "All cognitive metrics & insights",
              "Shareable with coaches",
              "Credits never expire",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
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
              <Sparkles className="w-4 h-4" />
              {processingPayment ? "Processing..." : `Purchase ${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}`}
            </Button>
            <AlertDialogCancel className="w-full mt-0">Maybe Later</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
