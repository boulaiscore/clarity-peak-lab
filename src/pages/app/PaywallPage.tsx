import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowLeft } from "lucide-react";
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectPlan = (planName: string) => {
    if (planName === "Free") {
      navigate("/app");
      return;
    }
    setSelectedPlan(planName);
    setShowConfirmation(true);
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
            <h1 className="text-xl font-semibold">Choose Your Plan</h1>
            <p className="text-sm text-muted-foreground">Unlock your full cognitive potential</p>
          </div>
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
                <div className="text-3xl font-bold">
                  {plan.price}
                  {plan.name !== "Free" && (
                    <span className="text-base font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
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
                onClick={() => handleSelectPlan(plan.name)}
              >
                {plan.name === "Free" ? "Continue Free" : `Choose ${plan.name} Annual`}
              </Button>
            </div>
          ))}
        </div>

        {/* Legal Note */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-8">
          Annual subscriptions auto-renew unless cancelled. Manage in store settings.
        </p>
      </div>

      {/* Plan Selection Confirmation Modal */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              {selectedPlan} Plan Selected
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
}
