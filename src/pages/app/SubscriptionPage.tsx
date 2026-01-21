import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { usePurchases } from "@/hooks/usePurchases";
import { toast } from "@/hooks/use-toast";
import { User, Crown, Zap, Shield, CreditCard, Rocket, Check, Loader2, RotateCw, ExternalLink, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendPremiumUpgradeEmail } from "@/lib/emailService";
import { supabase } from "@/integrations/supabase/client";
import { Browser } from '@capacitor/browser';
import { isNative } from '@/lib/platformUtils';

const BETA_LIMIT = 100;

const SubscriptionPage = () => {
  const { user, upgradeToPremium } = useAuth();
  const { isPremium } = usePremiumGating();
  const { 
    purchasePremium, 
    purchasePro, 
    restoreAllPurchases, 
    isRestoring, 
    isPurchasing,
    useNativeIAP 
  } = usePurchases();

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'pro' | null>(null);
  const [betaCount, setBetaCount] = useState<number | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Fetch beta user count
  useEffect(() => {
    const fetchBetaCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('subscription_status.eq.premium,subscription_status.eq.pro');
      
      if (!error && count !== null) {
        setBetaCount(count);
      }
    };
    fetchBetaCount();
  }, []);

  const spotsRemaining = betaCount !== null ? Math.max(0, BETA_LIMIT - betaCount) : null;
  const isBetaOpen = spotsRemaining !== null && spotsRemaining > 0;

  const handleBetaUpgrade = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to claim your beta access.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('claim-beta-access');

      if (error) {
        throw new Error(error.message || 'Failed to claim beta access');
      }

      if (data?.error) {
        if (data.error === 'Beta full') {
          toast({
            title: "Beta spots filled",
            description: data.message || "All beta spots have been claimed.",
            variant: "destructive",
          });
          if (data.betaCount !== undefined) {
            setBetaCount(data.betaCount);
          }
          return;
        }
        throw new Error(data.message || 'Failed to claim beta access');
      }

      await upgradeToPremium();
      
      if (user.email) {
        sendPremiumUpgradeEmail(user.email, user.name || undefined).catch(console.error);
      }
      
      toast({
        title: "Welcome to the Beta! 🎉",
        description: "You now have full access to all premium features.",
      });

      setBetaCount(prev => (prev !== null ? prev + 1 : 1));
      
    } catch (error) {
      console.error('Beta upgrade error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim beta access.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSubscribe = async (tier: 'premium' | 'pro') => {
    setIsUpgrading(true);
    setSelectedTier(tier);

    try {
      const result = tier === 'premium' 
        ? await purchasePremium() 
        : await purchasePro();

      if (result.success) {
        if (user?.email) {
          sendPremiumUpgradeEmail(user.email, user.name || undefined).catch(console.error);
        }
      }
    } finally {
      setIsUpgrading(false);
      setSelectedTier(null);
    }
  };

  const handleRestorePurchases = async () => {
    await restoreAllPurchases();
  };

  const handleManagePayments = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please log in to manage payments.",
        variant: "destructive",
      });
      return;
    }

    setIsOpeningPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: {
          userEmail: user.email,
          returnUrl: `${window.location.origin}/app/subscription`,
        },
      });

      if (error) throw error;

      if (data?.error === 'No billing account found' || data?.code === 'NO_CUSTOMER') {
        toast({
          title: "No billing account",
          description: "You don't have any payment history yet.",
        });
        return;
      }

      if (data?.url) {
        if (isNative()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Error",
        description: "Could not open payment management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <AppShell>
      <div className="container px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Subscription</h1>
              <p className="text-muted-foreground text-sm">Manage your plan</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Plan */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-primary" />
                Current Plan
              </h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Premium</p>
                        <p className="text-[10px] text-muted-foreground">BETA ACCESS</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Free</p>
                        <p className="text-[10px] text-muted-foreground">LIMITED ACCESS</p>
                      </div>
                    </>
                  )}
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase",
                  isPremium ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                )}>
                  {isPremium ? "Active" : "Limited"}
                </span>
              </div>
            </div>

            {/* Payment Management */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-primary" />
                Payment Management
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Update payment methods, view invoices, and manage billing details.
              </p>
              <Button 
                onClick={handleManagePayments}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isOpeningPortal}
              >
                {isOpeningPortal ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Payments
              </Button>
            </div>

            {/* Beta Access Banner */}
            {!isPremium && isBetaOpen && (
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Free Beta Access</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {spotsRemaining} spots remaining for free beta testers. Get full Premium access at no cost.
                </p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((BETA_LIMIT - (spotsRemaining || 0)) / BETA_LIMIT) * 100}%` }}
                  />
                </div>
                <Button 
                  onClick={handleBetaUpgrade} 
                  variant="hero"
                  size="sm"
                  className="w-full"
                  disabled={isUpgrading}
                >
                  {isUpgrading && !selectedTier ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Claim Free Beta Access
                </Button>
              </div>
            )}

            {/* Beta Info - For premium users */}
            {isPremium && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Rocket className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Beta Tester</p>
                    <p className="text-xs text-muted-foreground">
                      Premium features free until official launch.
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">v0.9.2-beta</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pro Plan */}
            <div className={cn(
              "p-5 rounded-xl border shadow-card relative",
              isPremium ? "bg-primary/5 border-primary/30" : "bg-card border-border"
            )}>
              {!isPremium && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold">Pro</span>
                  {isPremium && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">
                      ACTIVE
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold">$199<span className="text-xs text-muted-foreground font-normal"> / year</span></span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">
                ≈ $16.60 / month • 2 months free
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Complete cognitive training for high performers.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Unlimited sessions & full library
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Load & Capacity tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Monthly performance report
                </li>
              </ul>
              <p className="text-xs text-muted-foreground/70 mb-3">
                Monthly option: $19.90/month
              </p>
              {!isPremium && (
                <Button 
                  onClick={() => handleSubscribe('premium')} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  disabled={isUpgrading || isPurchasing}
                >
                  {isUpgrading && selectedTier === 'premium' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Start 7-Day Free Trial
                </Button>
              )}
            </div>

            {/* Elite Plan */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Elite</span>
                </div>
                <span className="text-lg font-bold">$299<span className="text-xs text-muted-foreground font-normal"> / year</span></span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">
                ≈ $24.90 / month • 2 months free
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Deeper cognitive supervision & reasoning insights.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  Reasoning Quality insights
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  On-demand reports
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  Weekly cognitive brief
                </li>
              </ul>
              <p className="text-xs text-muted-foreground/70 mb-3">
                Monthly option: $29.90/month
              </p>
              <Button 
                onClick={() => handleSubscribe('pro')}
                variant="hero" 
                size="sm"
                className="w-full"
                disabled={isUpgrading || isPurchasing}
              >
                {isUpgrading && selectedTier === 'pro' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Start 7-Day Free Trial
              </Button>

              {/* Restore Purchases - iOS only */}
              {useNativeIAP && (
                <Button 
                  onClick={handleRestorePurchases} 
                  variant="ghost" 
                  size="sm"
                  className="w-full mt-2 text-xs"
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-3 h-3 mr-1.5" />
                  )}
                  Restore Purchases
                </Button>
              )}
            </div>

            {/* Free Plan */}
            <div className={cn(
              "p-4 rounded-xl border",
              !isPremium ? "bg-muted/10 border-border/50" : "bg-muted/5 border-border/30"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Free</span>
                  {!isPremium && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-muted text-muted-foreground">
                      CURRENT
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-muted-foreground">$0<span className="text-xs font-normal">/mo</span></span>
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                Basic training, limited sessions, core metrics.
              </p>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 pt-2">
              7-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default SubscriptionPage;
