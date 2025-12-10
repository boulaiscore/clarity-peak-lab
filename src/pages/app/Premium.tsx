import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Sparkles, Loader2, Rocket, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const features = [
  "All 3 Neuro Lab training areas",
  "Extended session durations (5min, 7min)",
  "Neuro Activation™ cognitive warm-up",
  "Unlimited daily training sessions",
  "Full cognitive dashboard with trends",
  "Complete badge & achievement system",
  "Priority access to new features",
];

const BETA_LIMIT = 100;

const Premium = () => {
  const { user, upgradeToPremium } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";
  const [isLoading, setIsLoading] = useState(false);
  const [betaCount, setBetaCount] = useState<number | null>(null);

  // Fetch beta user count
  useEffect(() => {
    const fetchBetaCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium');
      
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

    if (betaCount !== null && betaCount >= BETA_LIMIT) {
      toast({
        title: "Beta spots filled",
        description: "All beta spots have been claimed. Stay tuned for launch!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'premium' })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      await upgradeToPremium();
      
      toast({
        title: "Welcome to the Beta! 🎉",
        description: "You now have full access to all premium features.",
      });

      // Refresh beta count
      setBetaCount(prev => (prev !== null ? prev + 1 : 1));
      
    } catch (error) {
      console.error('Beta upgrade error:', error);
      toast({
        title: "Error",
        description: "Failed to claim beta access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const spotsRemaining = betaCount !== null ? Math.max(0, BETA_LIMIT - betaCount) : null;

  if (isPremium) {
    return (
      <AppShell>
        <div className="container px-6 py-10 sm:py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              You're a <span className="text-gradient">Beta Tester</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for being an early adopter. You have full access to all features.
            </p>

            <div className="p-6 rounded-xl bg-card border border-border text-left shadow-card">
              <h3 className="font-semibold mb-4">Your Beta Benefits</h3>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary/90">BETA ACCESS</span>
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              Join the <span className="text-gradient">Beta</span>
            </h1>
            <p className="text-muted-foreground">
              Free Premium access for the first {BETA_LIMIT.toLocaleString()} beta testers.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-card border border-primary/20 shadow-glow mb-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl text-muted-foreground line-through">$12/month</span>
                <span className="text-4xl font-semibold text-primary">FREE</span>
              </div>
              <p className="text-sm text-muted-foreground">During beta period</p>
            </div>

            {/* Beta spots counter */}
            {spotsRemaining !== null && (
              <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Beta spots filling up...</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((BETA_LIMIT - spotsRemaining) / BETA_LIMIT) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              onClick={handleBetaUpgrade} 
              variant="hero" 
              className="w-full min-h-[52px] rounded-xl"
              disabled={isLoading || (spotsRemaining !== null && spotsRemaining <= 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming access...
                </>
              ) : spotsRemaining !== null && spotsRemaining <= 0 ? (
                "Beta spots filled"
              ) : (
                "Claim Beta Access"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              No credit card required • Limited spots available
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-surface border border-border">
            <p className="text-sm text-muted-foreground">
              "Your thinking is your competitive edge."
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Premium;
