import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

type BillingCycle = "monthly" | "yearly";
type PaidPlanId = "pro" | "elite";

const PLAN_PRICING: Record<PaidPlanId, Record<BillingCycle, { priceId: string; amount: string; suffix: string; perMonth?: string }>> = {
  pro: {
    monthly: { priceId: "looma_pro_monthly", amount: "19.90", suffix: "USD / month" },
    yearly: { priceId: "looma_pro_yearly", amount: "199", suffix: "USD / year", perMonth: "$16.58/mo" },
  },
  elite: {
    monthly: { priceId: "looma_elite_monthly", amount: "29.90", suffix: "USD / month" },
    yearly: { priceId: "looma_elite_yearly", amount: "299", suffix: "USD / year", perMonth: "$24.92/mo" },
  },
};

type BasePlan = {
  id: "free" | PaidPlanId;
  name: string;
  monogram: string;
  tagline: string;
  features: string[];
};

const basePlans: BasePlan[] = [
  {
    id: "free",
    name: "Free",
    monogram: "00",
    tagline: "Observe your cognitive state",
    features: [
      "Daily readiness, sharpness, recovery",
      "3 training sessions / day",
      "Core System 1 drills",
      "Weekly summary",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monogram: "01",
    tagline: "Train and recover, every day",
    features: [
      "Unlimited training sessions",
      "System 2 — critical thinking drills",
      "Wearable sync (HRV, sleep, RHR)",
      "Quality Time library",
      "Full trends dashboard",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monogram: "02",
    tagline: "Coached recovery for high-stakes work",
    features: [
      "Everything in Pro",
      "Monthly Cognitive Intelligence Report",
      "Personalized recovery protocol",
      "Decision Quality scenarios (early access)",
      "Priority support",
    ],
  },
];

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const { tier, isActive, cancelAtPeriodEnd, currentPeriodEnd, paddleSubscriptionId, refetch } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();

  const currentPlanId = isActive ? tier : "free";

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to LOOMA premium — onboarding starting…");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => refetch(), 1500);
      setTimeout(() => navigate("/app/onboarding-premium"), 2500);
    }
  }, [searchParams, setSearchParams, refetch, navigate]);

  const handleSelectPlan = (planId: PaidPlanId) => {
    if (planId === currentPlanId) return;
    const pricing = PLAN_PRICING[planId][cycle];
    openCheckout(pricing.priceId);
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
      <div className="container px-5 py-10 sm:py-14 max-w-xl mx-auto">
        {/* Header — editorial spacing */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60 mb-3">
            Membership
          </p>
          <h1 className="text-[28px] leading-tight font-light tracking-tight">
            Choose your tier.
          </h1>
          <p className="text-[13px] text-muted-foreground/80 mt-2 max-w-sm">
            Built for professionals who treat cognition as performance.
          </p>
        </div>

        {/* Current plan — minimal hairline status */}
        <div className="flex items-center justify-between py-4 border-y border-border/60 mb-10">
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60 mb-1">
              Current plan
            </p>
            <p className="text-sm font-medium capitalize tracking-tight">
              {isActive ? tier : "Free"}
              {cancelAtPeriodEnd && currentPeriodEnd && (
                <span className="ml-2 text-[10px] text-muted-foreground/70 font-normal uppercase tracking-wider">
                  · ends {new Date(currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive
                  ? cancelAtPeriodEnd
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                  : "bg-muted-foreground/40"
              )}
            />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {isActive ? (cancelAtPeriodEnd ? "Canceling" : "Active") : "Free"}
            </span>
          </div>
        </div>

        {paddleSubscriptionId && (
          <button
            onClick={openPortal}
            className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            Manage billing
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Billing cycle toggle — minimal segmented */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex border border-border/60 rounded-full p-0.5">
            {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.16em] transition-all",
                  cycle === c
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c === "yearly" ? (
                  <span className="flex items-center gap-1.5">
                    Yearly
                    <span className="text-[8px] tracking-[0.2em] opacity-70">−17%</span>
                  </span>
                ) : (
                  "Monthly"
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans — editorial tier cards */}
        <div className="space-y-px bg-border/40 rounded-2xl overflow-hidden border border-border/60">
          {basePlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isElite = plan.id === "elite";
            const isPaid = plan.id !== "free";
            const pricing = isPaid ? PLAN_PRICING[plan.id as PaidPlanId][cycle] : null;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 sm:p-7 bg-background transition-colors",
                  isCurrent && "bg-card"
                )}
              >
                {/* Top row: monogram + name + price */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-[10px] tracking-[0.22em] tabular-nums",
                        isElite ? "text-foreground" : "text-muted-foreground/60"
                      )}
                    >
                      {plan.monogram}
                    </span>
                    <div className="h-px w-6 bg-border/80" />
                    <div>
                      <h3 className="text-base font-medium tracking-tight">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-[0.22em] text-emerald-400/90">
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {pricing ? (
                      <>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-[11px] text-muted-foreground/70 font-light">$</span>
                          <span className="text-2xl font-light tabular-nums tracking-tight">
                            {pricing.amount}
                          </span>
                        </div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mt-0.5">
                          {pricing.suffix}
                        </p>
                        {pricing.perMonth && (
                          <p className="text-[9px] tracking-wider text-muted-foreground/50 mt-0.5 tabular-nums">
                            ≈ {pricing.perMonth}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-light tabular-nums tracking-tight">
                          $0
                        </span>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mt-0.5">
                          Forever
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-[12px] text-muted-foreground/80 mb-5 font-light leading-relaxed">
                  {plan.tagline}
                </p>

                {/* Features — minimalist list, no colored checks */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[12px] text-foreground/75 font-light leading-snug"
                    >
                      <span className="mt-[7px] w-1 h-px bg-foreground/40 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isPaid && !isCurrent && (
                  <Button
                    onClick={() => handleSelectPlan(plan.id as PaidPlanId)}
                    disabled={loading}
                    variant={isElite ? "default" : "outline"}
                    className={cn(
                      "w-full h-11 rounded-full text-[11px] uppercase tracking-[0.2em] font-medium",
                      isElite
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border-border/80 hover:bg-card"
                    )}
                  >
                    {currentPlanId !== "free" && plan.id === "elite"
                      ? "Upgrade to Elite"
                      : `Choose ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer — disclaimer */}
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 mt-8">
          {cycle === "yearly"
            ? "Annual · auto-renews · cancel anytime"
            : "Monthly · auto-renews · cancel anytime"}
        </p>
      </div>
    </AppShell>
  );
};

export default SubscriptionPage;
