import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { Crown, Check, User, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    tagline: "Core training & essential metrics",
    icon: User,
    iconColor: "text-muted-foreground",
    features: [
      "3 sessions per day",
      "System 1 training",
      "Basic cognitive metrics",
      "Weekly progress summary",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    period: "/year",
    tagline: "Complete cognitive training for high performers",
    icon: Crown,
    iconColor: "text-amber-400",
    badge: "MOST POPULAR",
    features: [
      "Unlimited daily sessions",
      "All training areas (S1 + S2)",
      "Extended sessions (5 min, 7 min)",
      "Neuro Activation warm-up",
      "Advanced analytics dashboard",
      "Monthly performance report",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$299",
    period: "/year",
    tagline: "Peak cognitive supervision & deep insights",
    icon: Rocket,
    iconColor: "text-purple-400",
    features: [
      "Everything in Pro",
      "Reasoning Quality insights",
      "On-demand intelligence reports",
      "Weekly cognitive brief",
      "Priority support",
      "Early access to new modules",
    ],
  },
];

const SubscriptionPage = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumGating();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentPlanId = isPremium ? "pro" : "free";

  const handleSelectPlan = (planId: string) => {
    if (planId === "free" || planId === currentPlanId) return;
    setSelectedPlan(plans.find((p) => p.id === planId)?.name || planId);
    setShowConfirmation(true);
  };

  return (
    <AppShell>
      <div className="container px-5 py-8 sm:py-12 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the plan that fits your performance goals.
          </p>
        </div>

        {/* Current Plan Indicator */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border mb-6">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isPremium ? "bg-primary/15" : "bg-muted/50"
          )}>
            {isPremium ? (
              <Crown className="w-5 h-5 text-primary" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{isPremium ? "Pro" : "Free"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Current plan
            </p>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
            isPremium
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {isPremium ? "Active" : "Free"}
          </span>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isHighlighted = plan.id === "pro";
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-5 rounded-xl border transition-all",
                  isHighlighted && !isCurrent
                    ? "bg-card border-primary/40 shadow-sm"
                    : isCurrent
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border"
                )}
              >
                {/* Badge */}
                {plan.badge && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold tracking-wider">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-5 h-5", plan.iconColor)} />
                    <span className="font-semibold">{plan.name}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-xs text-muted-foreground mb-3">{plan.tagline}</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className={cn("w-3.5 h-3.5 shrink-0", 
                        plan.id === "elite" ? "text-purple-400" : "text-primary"
                      )} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {!isCurrent && plan.id !== "free" && (
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    variant={isHighlighted ? "hero" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    Choose {plan.name}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
          Annual subscriptions auto-renew unless cancelled.
        </p>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-lg">
              {selectedPlan} Selected
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Plan selection saved. Billing activation will be connected in the next release.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col pt-2">
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="hero"
              className="w-full"
            >
              Got It
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default SubscriptionPage;
