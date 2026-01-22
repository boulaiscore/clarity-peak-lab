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
    monthlyEquivalent: "~$16.60/mo • 2 months free",
    monthlyOption: "$19.90/mo",
    summary: "Full cognitive training suite",
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
    monthlyEquivalent: "~$24.90/mo • 2 months free",
    monthlyOption: "$29.90/mo",
    summary: "Peak performance optimization",
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
  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">("yearly");
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
            <h1 className="text-xl font-semibold">Upgrade Your Mind</h1>
            <p className="text-sm text-muted-foreground">Choose your training plan</p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Button
            variant={billingCycle === "yearly" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingCycle("yearly")}
            className="rounded-full"
          >
            Yearly
            <span className="ml-1.5 text-xs bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full">
              Save 2 mo
            </span>
          </Button>
          <Button
            variant={billingCycle === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setBillingCycle("monthly")}
            className="rounded-full"
          >
            Monthly
          </Button>
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
                  <div className="text-3xl font-bold">{plan.price}</div>
                ) : billingCycle === "yearly" ? (
                  <>
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-base font-normal text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.monthlyEquivalent}
                    </p>
                  </>
                ) : (
                  <div className="text-3xl font-bold">
                    {plan.monthlyOption}
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
                  "Subscribe"
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
            Already subscribed? Restore your purchase to unlock premium features.
          </p>
        </div>

        {/* Legal Note */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-8">
          Subscriptions auto-renew unless cancelled. Manage in App Store settings.
        </p>
      </div>
    </AppShell>
  );
}
