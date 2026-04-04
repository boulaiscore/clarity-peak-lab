import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    summary: "Get started with core training",
    features: [
      "3 training sessions/day",
      "Basic cognitive metrics",
      "Weekly progress summary",
      "System 1 training only",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$199",
    period: "/year",
    summary: "Full cognitive training suite (annual)",
    features: [
      "Unlimited daily sessions",
      "All training areas (S1 + S2)",
      "Extended sessions (5min, 7min)",
      "Neuro Activation warm-up",
      "Advanced analytics dashboard",
      "Cognitive Intelligence Report",
    ],
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$299",
    period: "/year",
    summary: "Peak performance optimization (annual)",
    features: [
      "Everything in Pro",
      "Priority support",
      "Early access to new games",
      "Personalized training protocols",
      "Monthly performance review",
      "Exclusive Elite community",
    ],
    highlighted: false,
  },
];

export default function PaywallPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    if (planName === "Free") {
      navigate("/app");
      return;
    }
    
    setIsLoading(planName);
    
    // Simulate API call delay (UI-only prototype)
    await new Promise((r) => setTimeout(r, 1500));
    
    toast({
      title: "Subscription Flow",
      description: `In the production app, this would open ${planName} checkout.`,
    });
    
    setIsLoading(null);
  };

  const handleRestorePurchases = async () => {
    setIsLoading("restore");
    
    // Simulate restore delay
    await new Promise((r) => setTimeout(r, 2000));
    
    toast({
      title: "Restore Complete",
      description: "No previous purchases found. In production, this would check App Store receipts.",
    });
    
    setIsLoading(null);
  };

  return (
    <AppShell>
      <div className="container px-4 py-6 sm:py-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Beta model: Free, Pro annual, Elite annual</p>
          </div>
        </div>

        <div className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium">Beta access is currently free.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Paid plans are shown as annual options only. No monthly plans or trial messaging in beta.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-5 rounded-2xl border transition-all",
                plan.highlighted
                  ? "bg-card border-primary shadow-lg scale-[1.02]"
                  : "bg-card/50 border-border"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {plan.name}
                  {plan.highlighted && <Crown className="w-4 h-4 text-primary" />}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{plan.summary}</p>
              </div>

              <div className="mb-4">
                {plan.name === "Free" ? (
                  <div className="text-3xl font-bold">
                    {plan.price}
                  </div>
                ) : (
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-base font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "hero" : "outline"}
                className="w-full"
                onClick={() => handleSubscribe(plan.name)}
                disabled={isLoading !== null}
              >
                {isLoading === plan.name ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : plan.name === "Free" ? (
                  "Continue Free"
                ) : (
                  `Choose ${plan.name} Annual`
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Restore Purchases */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestorePurchases}
            disabled={isLoading !== null}
            className="text-muted-foreground"
          >
            {isLoading === "restore" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Restore Purchases
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Already subscribed? Restore your purchase to unlock your plan.
          </p>
        </div>

        {/* Legal Note */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-8">
          Annual subscriptions auto-renew unless cancelled. Manage in store settings.
        </p>
      </div>
    </AppShell>
  );
}
