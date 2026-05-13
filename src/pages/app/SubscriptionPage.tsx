import { useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Crown, Check, User, Rocket, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const plans = [
  {
    id: "free",
    name: "Free",
    priceId: null as string | null,
    price: "$0",
    period: "",
    tagline: "See your state",
    icon: User,
    iconColor: "text-muted-foreground",
    features: [
      "Daily readiness, sharpness & recovery",
      "3 training sessions per day",
      "Core System 1 drills",
      "Weekly summary",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceId: "looma_pro_yearly",
    price: "$199",
    period: "/year",
    tagline: "Train and recover, every day",
    icon: Crown,
    iconColor: "text-amber-400",
    badge: "MOST POPULAR",
    features: [
      "Unlimited training sessions",
      "System 2 — critical thinking drills",
      "Detox + social blocker (Android)",
      "Wearable sync (HRV, sleep, RHR)",
      "Quality Time library (reading & podcasts)",
      "Full trends dashboard",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    priceId: "looma_elite_yearly",
    price: "$299",
    period: "/year",
    tagline: "Coached recovery for high-stakes work",
    icon: Rocket,
    iconColor: "text-purple-400",
    features: [
      "Everything in Pro",
      "Monthly Cognitive Intelligence Report",
      "Personalized recovery protocol",
      "Decision Quality scenarios (early access)",
      "Priority support",
      "Early access to new modules",
    ],
  },
];

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tier, isActive, cancelAtPeriodEnd, currentPeriodEnd, paddleSubscriptionId, refetch } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();

  const currentPlanId = isActive ? tier : "free";

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to LOOMA premium — onboarding starting…");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
      // Refetch shortly after to pick up webhook write
      setTimeout(() => refetch(), 1500);
      setTimeout(() => navigate("/app/onboarding-premium"), 2500);
    }
  }, [searchParams, setSearchParams, refetch, navigate]);

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan?.priceId || planId === currentPlanId) return;
    openCheckout(plan.priceId);
  };

  const openPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("paddle-customer-portal", {
        body: { environment: getPaddleEnvironment() },
      });
      if (error || !data?.url) throw new Error(data?.error || error?.message);
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open billing portal");
    }
  };

  return (
    <AppShell>
      <div className="container px-5 py-8 sm:py-12 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-2">
            Recover focus. Rebuild thinking.
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the plan that fits your performance goals.
          </p>
        </div>

        {/* Current Plan Indicator */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border mb-6">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isActive ? "bg-primary/15" : "bg-muted/50"
          )}>
            {isActive ? (
              <Crown className="w-5 h-5 text-primary" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold capitalize">{isActive ? tier : "Free"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {cancelAtPeriodEnd && currentPeriodEnd
                ? `Ends ${new Date(currentPeriodEnd).toLocaleDateString()}`
                : "Current plan"}
            </p>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
            isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
          )}>
            {isActive ? (cancelAtPeriodEnd ? "Canceling" : "Active") : "Free"}
          </span>
        </div>

        {paddleSubscriptionId && (
          <Button variant="outline" size="sm" className="w-full mb-6" onClick={openPortal}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Manage billing
          </Button>
        )}

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
                    disabled={loading}
                    variant={isHighlighted ? "hero" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    {currentPlanId !== "free" && plan.id === "elite" ? "Upgrade to Elite" : `Choose ${plan.name}`}
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

    </AppShell>
  );
};

export default SubscriptionPage;
