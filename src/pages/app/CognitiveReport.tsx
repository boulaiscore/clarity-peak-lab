// src/pages/app/CognitiveReport.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, Play, Download, Lock, FileText, Check, Crown, Package, Sparkles, Target, Eye } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeRedirectUrls, isNative } from "@/lib/platformUtils";
import { Browser } from "@capacitor/browser";
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
import { ReportPreviewReal } from "@/components/report/ReportPreviewReal";
import { Progress } from "@/components/ui/progress";

import "@/styles/clinical-report.css";

import { ClinicalReport } from "@/components/report/ClinicalReport";

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

  const { loading, error, metrics, profile, sessions, badges, wearable, aggregates } = useReportData(userId);
  const { 
    canViewReport, 
    canDownloadPDF, 
    reportCredits, 
    monthlyCredits,
    isPremium,
    isPro,
    refetchPurchase, 
    useCredit,
    weeklyPlanCompleted,
    weeklyProgress,
    xpRemaining,
    hasCreditsOrPurchase,
  } = useReportAccess();
  
  // Total credits available for display
  const totalCredits = isPro ? Infinity : monthlyCredits + reportCredits;

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
      const { successUrl, cancelUrl } = getStripeRedirectUrls(
        '/app/report?payment=success',
        '/app/report?payment=canceled'
      );
      
      const { data, error } = await supabase.functions.invoke('create-report-credits-checkout', {
        body: {
          userId: user.id,
          userEmail: user.email,
          packageType: selectedPackage,
          successUrl,
          cancelUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        // On native, use in-app browser for better UX
        if (isNative()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Cognitive Intelligence Report</h1>
            <p className="text-xs text-muted-foreground">Your comprehensive cognitive analysis</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Get Your Cognitive Report</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Professional-grade analysis based on your training data
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full gap-2"
            onClick={() => navigate("/app/report-preview")}
          >
            <Eye className="w-4 h-4" />
            View Sample Report
          </Button>
        </div>

        {/* Buy Report Credits - Primary Option */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Buy Report Credits</h3>
          </div>
          
          <div className="space-y-2">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  setShowPurchaseModal(true);
                }}
                className="w-full p-3 rounded-xl border border-border hover:border-primary/50 transition-all text-left relative bg-card/50"
              >
                {pkg.popular && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-primary text-primary-foreground">
                    Best Value
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pkg.credits} Report{pkg.credits > 1 ? 's' : ''}</span>
                      {pkg.savings && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/15 text-green-500">
                          -{pkg.savings}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{pkg.pricePerReport}/report</span>
                  </div>
                  <span className="text-lg font-bold">{pkg.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Premium Option */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold">Upgrade to Premium</h4>
              <p className="text-[10px] text-muted-foreground">Unlimited reports + all features</p>
            </div>
          </div>
          <Link to="/app/premium">
            <Button variant="outline" className="w-full gap-2 border-primary/30 hover:bg-primary/10">
              <Crown className="w-4 h-4 text-amber-400" />
              View Premium Plans
            </Button>
          </Link>
        </div>

        {/* What's included */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What's Included</h3>
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

        {/* Purchase Modal */}
        <AlertDialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl">
                {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits} Report Credit{(CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits || 0) > 1 ? 's' : ''}
              </AlertDialogTitle>
              <div className="text-3xl font-bold text-primary mt-2">
                {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}
              </div>
            </AlertDialogHeader>
            
            <div className="space-y-2 py-4">
              {[
                "Professional A4 PDF format",
                "All cognitive metrics & insights",
                "Shareable with coaches",
                "Credits never expire",
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
                <Sparkles className="w-4 h-4" />
                {processingPayment ? "Processing..." : "Purchase Now"}
              </Button>
              <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          {isPro ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">Unlimited</span>
            </div>
          ) : totalCredits > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{totalCredits} credit{totalCredits > 1 ? 's' : ''}</span>
            </div>
          ) : null}
          <Button 
            variant={canDownloadPDF ? "default" : "outline"}
            className="gap-2"
            onClick={handleDownloadPDF}
            disabled={downloading || !weeklyPlanCompleted}
          >
            {canDownloadPDF ? (
              <>
                <Download className="w-4 h-4" />
                {downloading ? "Generating..." : "Download PDF"}
              </>
            ) : !weeklyPlanCompleted ? (
              <>
                <Target className="w-4 h-4" />
                Complete Plan
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

      {/* Weekly Plan Required Banner */}
      {!weeklyPlanCompleted && (
        <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 print:hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-amber-500">Complete Your Weekly Plan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Finish your weekly training to unlock PDF download
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(weeklyProgress)}%</span>
                </div>
                <Progress value={weeklyProgress} className="h-2" />
                <p className="text-[10px] text-muted-foreground">
                  {xpRemaining > 0 ? `${xpRemaining} XP remaining` : 'Almost there!'}
                </p>
              </div>
              <Link to="/app/home">
                <Button size="sm" variant="outline" className="gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Continue Training
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div ref={printRef}>
        <ClinicalReport 
          profile={profile} 
          metrics={metrics} 
          aggregates={aggregates}
          badges={badges}
          generatedAt={generatedAt} 
        />
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
