import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Sparkles, Loader2 } from "lucide-react";
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

const Premium = () => {
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upgrade to Premium.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          userEmail: user.email,
          successUrl: `${window.location.origin}/app/premium?success=true`,
          cancelUrl: `${window.location.origin}/app/premium?canceled=true`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        toast({
          title: "Opening Stripe Checkout",
          description: "A new window will open for secure payment.",
        });
        
        // Try to open in new tab first
        const newWindow = window.open(data.url, '_blank');
        
        // Fallback to redirect if popup blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = data.url;
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for success/canceled URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';
  const isCanceled = urlParams.get('canceled') === 'true';

  if (isSuccess && !isPremium) {
    return (
      <AppShell>
        <div className="container px-6 py-10 sm:py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              Payment <span className="text-gradient">Successful!</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Your Premium subscription is being activated. This may take a few moments.
            </p>
            <Button onClick={() => window.location.href = '/app'} variant="hero" className="min-h-[52px] rounded-xl">
              Start Training
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isPremium) {
    return (
      <AppShell>
        <div className="container px-6 py-10 sm:py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              You're <span className="text-gradient">Premium</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Full access to all cognitive training protocols and features.
            </p>

            <div className="p-6 rounded-xl bg-card border border-border text-left shadow-card">
              <h3 className="font-semibold mb-4">Your Premium Benefits</h3>
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
          {isCanceled && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
              <p className="text-sm text-warning">Checkout was canceled. No charges were made.</p>
            </div>
          )}
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary/90">Premium</span>
            </div>
            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
              Unlock Your <span className="text-gradient">Cognitive Edge</span>
            </h1>
            <p className="text-muted-foreground">
              Advanced protocols and insights for serious cognitive development.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-card border border-primary/20 shadow-glow mb-8">
            <div className="text-center mb-6">
              <span className="text-4xl font-semibold">$12</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              onClick={handleUpgrade} 
              variant="hero" 
              className="w-full min-h-[52px] rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade to Premium"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              7-day free trial included. Cancel anytime.
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
