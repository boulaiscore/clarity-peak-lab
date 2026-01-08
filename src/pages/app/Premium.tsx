import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Sparkles, Loader2, Rocket, Users, Zap, FileText, Infinity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendPremiumUpgradeEmail } from "@/lib/emailService";

const BETA_LIMIT = 100;

const baseFeatures = [
  "All 3 Neuro Lab training areas",
  "Extended session durations (5min, 7min)",
  "Neuro Activation™ cognitive warm-up",
  "Unlimited daily training sessions",
  "Full cognitive dashboard with trends",
  "Complete badge & achievement system",
];

const premiumFeatures = [
  ...baseFeatures,
  "1 Cognitive Report per month",
];

const proFeatures = [
  ...baseFeatures,
  "Unlimited Cognitive Reports",
  "Priority support",
];

const Premium = () => {
  const { user, session, upgradeToPremium } = useAuth();
  const subscriptionStatus = user?.subscriptionStatus || "free";
  const isPremium = subscriptionStatus === "premium";
  const isPro = subscriptionStatus === "pro";
  const isSubscribed = isPremium || isPro;
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'pro' | null>(null);
  const [betaCount, setBetaCount] = useState<number | null>(null);

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

  const handleBetaUpgrade = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to claim your beta access.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('claim-beta-access');

      if (error) {
        console.error('Beta upgrade error:', error);
        throw new Error(error.message || 'Failed to claim beta access');
      }

      if (data?.error) {
        if (data.error === 'Beta full') {
          toast({
            title: "Beta spots filled",
            description: data.message || "All beta spots have been claimed. Stay tuned for launch!",
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
        sendPremiumUpgradeEmail(user.email, user.name || undefined).catch((err) => {
          console.error("Failed to send premium upgrade email:", err);
        });
      }
      
      toast({
        title: "Welcome to the Beta! 🎉",
        description: data?.message || "You now have full access to all premium features.",
      });

      if (data?.betaCount !== undefined) {
        setBetaCount(data.betaCount);
      } else {
        setBetaCount(prev => (prev !== null ? prev + 1 : 1));
      }
      
    } catch (error) {
      console.error('Beta upgrade error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim beta access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeCheckout = async (tier: 'premium' | 'pro') => {
    if (!user?.id || !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSelectedTier(tier);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          userEmail: user.email,
          tier: tier,
          successUrl: `${window.location.origin}/app/premium?success=true`,
          cancelUrl: `${window.location.origin}/app/premium?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  const spotsRemaining = betaCount !== null ? Math.max(0, BETA_LIMIT - betaCount) : null;
  const isBetaOpen = spotsRemaining !== null && spotsRemaining > 0;

  // Already subscribed view
  if (isSubscribed) {
    const features = isPro ? proFeatures : premiumFeatures;
    const tierName = isPro ? "Pro" : "Premium";
    
    return (
      <AppShell>
        <div className="container px-6 py-10 sm:py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              {isPro ? <Crown className="w-10 h-10 text-primary" /> : <Rocket className="w-10 h-10 text-primary" />}
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              You're on <span className="text-gradient">{tierName}</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              {isPro 
                ? "You have unlimited access to all features including reports."
                : "Thank you for subscribing. You have full access to all training features."
              }
            </p>

            <div className="p-6 rounded-xl bg-card border border-border text-left shadow-card">
              <h3 className="font-semibold mb-4">Your {tierName} Benefits</h3>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade to Pro CTA for Premium users */}
            {isPremium && (
              <div className="mt-8 p-6 rounded-xl bg-gradient-surface border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Upgrade to Pro</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get unlimited Cognitive Reports for just $4.99 more per month.
                </p>
                <Button 
                  onClick={() => handleStripeCheckout('pro')} 
                  variant="hero" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && selectedTier === 'pro' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Upgrade to Pro — $16.99/mo
                </Button>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // Free user view with tier options
  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              Upgrade to <span className="text-gradient">Premium</span>
            </h1>
            <p className="text-muted-foreground">
              Unlock your full cognitive potential with advanced training and insights.
            </p>
          </div>

          {/* Beta banner */}
          {isBetaOpen && (
            <div className="mb-8 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/15 mb-4">
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary/90">BETA ACCESS</span>
              </div>
              <h3 className="font-semibold mb-2">Free Premium Access</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {spotsRemaining} spots remaining for free beta testers
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto mb-4">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${((BETA_LIMIT - spotsRemaining) / BETA_LIMIT) * 100}%` }}
                />
              </div>
              <Button 
                onClick={handleBetaUpgrade} 
                variant="hero"
                disabled={isLoading}
              >
                {isLoading && !selectedTier ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Claim Free Beta Access
              </Button>
            </div>
          )}

          {/* Pricing tiers */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Tier */}
            <div className="p-8 rounded-xl bg-card border border-border shadow-card">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Premium</h3>
                </div>
                <p className="text-sm text-muted-foreground">Complete training system</p>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-semibold">$12</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleStripeCheckout('premium')} 
                variant="outline" 
                className="w-full min-h-[48px] rounded-xl"
                disabled={isLoading}
              >
                {isLoading && selectedTier === 'premium' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Start 7-Day Free Trial
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-xl bg-card border border-primary/25 shadow-glow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  BEST VALUE
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Pro</h3>
                </div>
                <p className="text-sm text-muted-foreground">Unlimited everything</p>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-semibold">$16.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className={feature.includes("Unlimited") ? "font-medium" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleStripeCheckout('pro')} 
                variant="hero" 
                className="w-full min-h-[48px] rounded-xl"
                disabled={isLoading}
              >
                {isLoading && selectedTier === 'pro' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Start 7-Day Free Trial
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            7-day free trial • Cancel anytime • All plans include full training access
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default Premium;
