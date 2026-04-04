import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { toast } from "@/hooks/use-toast";
import { User, Crown, Shield, CreditCard, Rocket, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SubscriptionPage = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumGating();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectPlan = (tier: string) => {
    setSelectedTier(tier);
    setShowConfirmation(true);
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
                        <p className="text-[10px] text-muted-foreground">FULL ACCESS ENABLED</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Free</p>
                        <p className="text-[10px] text-muted-foreground">CORE ACCESS</p>
                      </div>
                    </>
                  )}
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase",
                  isPremium ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                )}>
                  {isPremium ? "Active" : "Free"}
                </span>
              </div>
            </div>

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
              {!isPremium && (
                <Button 
                  onClick={() => handleSelectPlan('Pro')} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Select Pro Annual
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
              <Button 
                onClick={() => handleSelectPlan('Elite')}
                variant="hero" 
                size="sm"
                className="w-full"
              >
                Select Elite Annual
              </Button>
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
                <span className="text-sm font-bold text-muted-foreground">$0</span>
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                Core training and essential metrics.
              </p>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 pt-2">
              Annual subscriptions auto-renew unless cancelled.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Selection Confirmation Modal */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              {selectedTier} Plan Selected
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Plan selection saved. Billing activation will be connected in the next release.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={() => setShowConfirmation(false)} variant="hero" className="w-full min-h-[48px]">
              Got It
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default SubscriptionPage;
