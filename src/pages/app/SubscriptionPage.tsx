import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

type BillingCycle = "monthly" | "yearly";
type PaidPlanId = "pro" | "elite";

const PLAN_PRICING: Record<PaidPlanId, Record<BillingCycle, { priceId: string; amount: string; period: string; perMonth?: string }>> = {
  pro: {
    monthly: { priceId: "looma_pro_monthly", amount: "19.90", period: "month" },
    yearly: { priceId: "looma_pro_yearly", amount: "199", period: "year", perMonth: "$16.58 / month" },
  },
  elite: {
    monthly: { priceId: "looma_elite_monthly", amount: "29.90", period: "month" },
    yearly: { priceId: "looma_elite_yearly", amount: "299", period: "year", perMonth: "$24.92 / month" },
  },
};

type BasePlan = {
  id: "free" | PaidPlanId;
  name: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
};

const basePlans: BasePlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Explore cognitive training at your own pace.",
    features: [
      "2 sessions/day",
      "Limited S1 & S2 games",
      "Core dashboard",
      "Baseline calibration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "The complete cognitive training experience for high performers.",
    highlighted: true,
    features: [
      "Unlimited sessions",
      "Full training library",
      "Load & Capacity tracking",
      "Monthly performance report",
      "Personalized recommendations",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "Deeper cognitive supervision and advanced reasoning insights.",
    features: [
      "Everything in Pro",
      "Expanded S2 access",
      "Reasoning Quality insights",
      "On-demand reports",
      "Weekly cognitive brief",
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
      <div className="container px-5 py-12 sm:py-16 max-w-6xl mx-auto">
        {/* Header — LOOMA marketing style */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-foreground">
            Choose Your Level
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/80 mt-4 font-light">
            Start free. Upgrade when you're ready to go deeper.
          </p>
        </div>

        {/* Status row — current plan + manage billing */}
        {(isActive || paddleSubscriptionId) && (
          <div className="flex items-center justify-center gap-6 mb-10 text-[11px] uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  cancelAtPeriodEnd ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
              <span className="text-muted-foreground">
                {cancelAtPeriodEnd ? "Canceling" : "Active"} · {tier}
                {cancelAtPeriodEnd && currentPeriodEnd && (
                  <span className="ml-1 normal-case tracking-normal opacity-70">
                    until {new Date(currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </span>
            </div>
            {paddleSubscriptionId && (
              <button
                onClick={openPortal}
                className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Manage billing
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        )}

        {/* Billing cycle toggle (WHOOP-style, default Yearly) */}
        <div className="flex items-center justify-center mb-10 sm:mb-12">
          <div className="inline-flex border border-border/60 rounded-full p-1 bg-card/40">
            {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition-all",
                  cycle === c
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c === "yearly" ? (
                  <span className="flex items-center gap-2">
                    Yearly
                    <span className="text-[9px] tracking-[0.2em] opacity-80 normal-case">
                      2 months free
                    </span>
                  </span>
                ) : (
                  "Monthly"
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans — three cards side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch">
          {basePlans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isPaid = plan.id !== "free";
            const monthly = isPaid ? PLAN_PRICING[plan.id as PaidPlanId].monthly : null;
            const yearly = isPaid ? PLAN_PRICING[plan.id as PaidPlanId].yearly : null;
            const highlighted = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-3xl p-7 sm:p-8 flex flex-col transition-all",
                  highlighted
                    ? "bg-gradient-to-br from-[hsl(220_28%_42%)] via-[hsl(222_30%_36%)] to-[hsl(225_32%_28%)] text-white shadow-xl shadow-black/20 md:-my-3 md:scale-[1.03]"
                    : "bg-gradient-to-b from-card to-card/40 border border-border/50 text-foreground"
                )}
              >
                {/* MOST POPULAR badge */}
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-background text-foreground text-[10px] uppercase tracking-[0.22em] px-4 py-1.5 rounded-full font-medium shadow-md border border-border/50">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <h3
                  className={cn(
                    "text-xl font-medium tracking-tight mb-3",
                    highlighted ? "text-white" : "text-foreground"
                  )}
                >
                  {plan.name}
                </h3>

                {/* Tagline */}
                <p
                  className={cn(
                    "text-[13px] font-light leading-relaxed mb-7 min-h-[3em]",
                    highlighted ? "text-white/85" : "text-muted-foreground"
                  )}
                >
                  {plan.tagline}
                </p>

                {/* Price */}
                <div className="mb-7">
                  {monthly && yearly ? (
                    (() => {
                      const active = cycle === "yearly" ? yearly : monthly;
                      return (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span
                              className={cn(
                                "text-5xl font-light tabular-nums tracking-tight",
                                highlighted ? "text-white" : "text-foreground"
                              )}
                            >
                              ${active.amount}
                            </span>
                            <span
                              className={cn(
                                "text-sm font-light",
                                highlighted ? "text-white/70" : "text-muted-foreground"
                              )}
                            >
                              / {active.period}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-[11px] mt-2 tabular-nums font-light",
                              highlighted ? "text-white/70" : "text-muted-foreground/70"
                            )}
                          >
                            {cycle === "yearly"
                              ? `${yearly.perMonth} · 2 months free vs monthly`
                              : `or $${yearly.amount}/yr (save 2 months)`}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-light tabular-nums tracking-tight text-foreground">
                          $0
                        </span>
                        <span className="text-sm font-light text-muted-foreground">
                          forever
                        </span>
                      </div>
                      <p className="text-[11px] mt-2 font-light text-muted-foreground/60">
                        No card required
                      </p>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={cn(
                        "flex items-start gap-3 text-[13px] font-light leading-snug",
                        highlighted ? "text-white/95" : "text-foreground/85"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 mt-[2px] shrink-0",
                          highlighted ? "text-white/90" : "text-foreground/70"
                        )}
                        strokeWidth={2}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div
                    className={cn(
                      "w-full h-12 rounded-full flex items-center justify-center text-[11px] uppercase tracking-[0.22em] font-medium",
                      highlighted
                        ? "bg-white/15 text-white border border-white/20"
                        : "bg-muted/40 text-muted-foreground border border-border/40"
                    )}
                  >
                    Current Plan
                  </div>
                ) : isPaid ? (
                  <Button
                    onClick={() => handleSelectPlan(plan.id as PaidPlanId)}
                    disabled={loading}
                    className={cn(
                      "w-full h-12 rounded-full text-[11px] uppercase tracking-[0.22em] font-medium",
                      highlighted
                        ? "bg-white text-[hsl(225_32%_22%)] hover:bg-white/90"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    )}
                  >
                    Start 14-day free trial
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/app")}
                    variant="outline"
                    className="w-full h-12 rounded-full text-[11px] uppercase tracking-[0.22em] font-medium border-border/60 bg-foreground text-background hover:bg-foreground/90 border-0"
                  >
                    Try It For Free
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-[12px] text-muted-foreground/60 mt-12 max-w-xl mx-auto font-light leading-relaxed">
          XP measures training volume, not intelligence. LOOMA adapts difficulty, load, and insight depth to your cognitive profile.
        </p>
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mt-4">
          14-day free trial · then {cycle === "yearly" ? "billed annually" : "billed monthly"} · cancel anytime
        </p>
      </div>
    </AppShell>
  );
};

export default SubscriptionPage;
