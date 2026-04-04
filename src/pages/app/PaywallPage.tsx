import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowLeft, User, Rocket, ArrowRight } from "lucide-react";
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
    tagline: "Get started with core training",
    icon: User,
    iconColor: "text-muted-foreground",
    features: [
      "3 training sessions per day",
      "Basic cognitive metrics",
      "Weekly progress summary",
      "System 1 training only",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    period: "/year",
    tagline: "Full cognitive training suite",
    icon: Crown,
    iconColor: "text-amber-400",
    badge: "MOST POPULAR",
    features: [
      "Unlimited daily sessions",
      "All training areas (S1 + S2)",
      "Extended sessions (5 min, 7 min)",
      "Neuro Activation warm-up",
      "Advanced analytics dashboard",
      "Cognitive Intelligence Report",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$299",
    period: "/year",
    tagline: "Peak performance optimization",
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

export default function PaywallPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      navigate("/app");
      return;
    }
    setSelectedPlan(plans.find((p) => p.id === planId)?.name || planId);
    setShowConfirmation(true);
  };

  return (
    <AppShell>
      <div className="container px-4 py-6 sm:py-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Choose Your Plan</h1>
            <p className="text-sm text-muted-foreground">Unlock your full cognitive potential</p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isHighlighted = plan.id === "pro";
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-5 rounded-2xl border transition-all flex flex-col",
                  isHighlighted
                    ? "bg-card border-primary/40 shadow-lg md:scale-[1.03]"
                    : "bg-card/50 border-border"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", plan.iconColor)} />
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{plan.tagline}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={cn(
                        "w-4 h-4 shrink-0 mt-0.5",
                        plan.id === "elite" ? "text-purple-400" : "text-primary"
                      )} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isHighlighted ? "hero" : "outline"}
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.id === "free" ? "Continue Free" : (
                    <>
                      Choose {plan.name}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-8">
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
}
