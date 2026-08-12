import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PENDING_CHECKOUT_KEY, useCheckout } from "@/hooks/useCheckout";
import { useLocalizedPrices } from "@/hooks/useLocalizedPrices";
import { useSubscription } from "@/hooks/useSubscription";
import {
  COMPARISON_FEATURES,
  DEFAULT_BILLING_INTERVAL,
  FEATURE_LABELS,
  PLAN_CATALOG,
  paidOptionFor,
  pricingConfig,
  type BillingInterval,
  type PlanId,
  type PricingOption,
  type PricingOptionId,
} from "@/config/pricing";
import { trackProductEvent } from "@/lib/productAnalytics";
import { cn } from "@/lib/utils";

type StandardPaidCardId = "core" | "pro";
type PaidCardId = StandardPaidCardId | "founding_pro";
type SelectedInterval = Exclude<BillingInterval, "none">;

const CARD_FEATURES: Record<PaidCardId, string[]> = {
  core: [
    "Unlimited daily protocols",
    "Complete training library",
    "Personalized daily recommendation",
    "90-day trends and weekly review",
  ],
  pro: [
    "Everything in Pro",
    "Explainable Adaptive Coach insights",
    "Advanced personal-pattern analytics",
    "Formatted reports and early access",
  ],
  founding_pro: [
    "Everything in Elite",
    "First-year launch price",
    "Founding Member badge",
    "Early access to new protocols",
  ],
};

function recommendedPlan(workType?: string, primaryOutcome?: string): StandardPaidCardId {
  if (workType === "management") return "pro";
  if (workType === "knowledge" && (primaryOutcome === "decide" || primaryOutcome === "reason")) return "pro";
  return "core";
}

function optionFor(planId: StandardPaidCardId, interval: SelectedInterval): PricingOption {
  return paidOptionFor(planId, interval);
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const subscription = useSubscription();
  const checkout = useCheckout();
  const { prices, formatInCurrency } = useLocalizedPrices();
  const [interval, setInterval] = useState<SelectedInterval>(DEFAULT_BILLING_INTERVAL);
  const [selectedPlan, setSelectedPlan] = useState<PaidCardId | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamEmail, setTeamEmail] = useState(user?.email ?? "");
  const [teamName, setTeamName] = useState("");
  const [teamSeats, setTeamSeats] = useState("5");
  const recommendation = useMemo(
    () => recommendedPlan(user?.workType, user?.primaryOutcome),
    [user?.primaryOutcome, user?.workType],
  );

  useEffect(() => {
    trackProductEvent("pricing_page_viewed", {
      sourcePage: searchParams.get("source") ?? "account",
      triggerAction: searchParams.get("trigger") ?? null,
      cognitiveRole: user?.workType ?? null,
      primaryBottleneck: user?.primaryOutcome ?? null,
    });
  }, [searchParams, user?.primaryOutcome, user?.workType]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success" && searchParams.get("success") !== "true") return;
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY) || "null") as Record<string, string | null> | null;
      trackProductEvent("checkout_completed", {
        planId: pending?.planId ?? null,
        billingInterval: pending?.billingInterval ?? null,
        sourcePage: pending?.sourcePage ?? "subscription_return",
      });
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch {
      trackProductEvent("checkout_completed", { sourcePage: "subscription_return" });
    }
    toast.success("Subscription activated");
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    next.delete("success");
    setSearchParams(next, { replace: true });
    const refreshTimer = window.setTimeout(() => void subscription.refetch(), 900);
    const navigateTimer = window.setTimeout(() => navigate("/app/onboarding-premium"), 1500);
    return () => {
      window.clearTimeout(refreshTimer);
      window.clearTimeout(navigateTimer);
    };
  }, [navigate, searchParams, setSearchParams, subscription]);

  const displayPrice = (option: PricingOption) => {
    const localized = option.webPriceId ? prices[option.webPriceId] : null;
    return localized?.formatted ?? formatInCurrency(option.amountEur, "EUR");
  };

  const activeOption = (planId: PaidCardId): PricingOption => {
    return planId === "founding_pro"
      ? pricingConfig.founding_pro_annual
      : optionFor(planId, interval);
  };

  const displayedAnnualSavings = (planId: StandardPaidCardId) => {
    const monthly = optionFor(planId, "monthly");
    const annual = optionFor(planId, "annual");
    const localizedMonthly = monthly.webPriceId ? prices[monthly.webPriceId]?.amount : null;
    const localizedAnnual = annual.webPriceId ? prices[annual.webPriceId]?.amount : null;
    const monthlyAmount = localizedMonthly ?? monthly.amountEur;
    const annualAmount = localizedAnnual ?? annual.amountEur;
    return Math.max(0, Math.round((1 - annualAmount / (monthlyAmount * 12)) * 100));
  };

  const isCurrent = (planId: PaidCardId) => {
    return subscription.tier === planId;
  };

  const selectPlan = async (optionId: PricingOptionId) => {
    await checkout.startCheckout(optionId, {
      sourcePage: searchParams.get("source") ?? "subscription",
      triggerAction: searchParams.get("trigger") ?? undefined,
      primaryBottleneck: user?.primaryOutcome,
    });
  };

  const submitTeamWaitlist = async (event: FormEvent) => {
    event.preventDefault();
    const seats = Number(teamSeats);
    if (!teamEmail.trim() || !Number.isFinite(seats)) return;
    try {
      await checkout.joinTeamWaitlist({
        email: teamEmail,
        companyOrGroup: teamName,
        seats,
      });
      setTeamOpen(false);
      toast.success("You're on the Team waitlist");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the waitlist");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-8 sm:pt-12">
        <header className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">LOOMA Membership</p>
          <div className="mt-5 inline-flex rounded-full border border-border/50 bg-card/50 p-1">
            {(["annual", "monthly"] as SelectedInterval[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setInterval(value);
                  trackProductEvent("billing_toggle_changed", { billingInterval: value });
                }}
                className={cn(
                  "rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors",
                  interval === value ? "bg-foreground text-background" : "text-muted-foreground",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </header>

        {subscription.isActive && (
          <div className="mx-auto mt-7 flex max-w-xl items-center justify-between rounded-2xl border border-border/40 bg-card/35 px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              Current plan · <strong className="font-medium text-foreground">{PLAN_CATALOG[subscription.tier].name}</strong>
            </span>
            <button
              type="button"
              onClick={() => void checkout.manageSubscription().catch(() => toast.error("Billing portal unavailable"))}
              className="inline-flex items-center gap-1.5 font-medium text-foreground"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}

        <section className="mt-9 grid gap-4 md:grid-cols-3">
          {(["core", "pro", "founding_pro"] as PaidCardId[]).map((planId) => {
            const plan = PLAN_CATALOG[planId];
            const option = activeOption(planId);
            const current = isCurrent(planId);
            const founding = planId === "founding_pro";
            const highlighted = planId === recommendation;
            const isSelected = (selectedPlan ?? recommendation) === planId;
            return (
              <article
                key={planId}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedPlan(planId);
                  trackProductEvent("plan_card_clicked", {
                    planId,
                    billingInterval: founding ? "annual" : interval,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedPlan(planId);
                  }
                }}
                className={cn(
                  "relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border p-5 transition-all sm:min-h-[420px] sm:rounded-[28px] sm:p-7",
                  planId === "pro"
                    ? "border-primary/35 bg-[linear-gradient(150deg,hsl(var(--card)),hsl(var(--primary)/0.09))]"
                    : founding
                      ? "border-foreground/20 bg-[linear-gradient(150deg,hsl(var(--card)),hsl(var(--foreground)/0.04))]"
                    : "border-border/50 bg-card/45",
                  isSelected ? "ring-1 ring-primary/50" : "opacity-90 hover:opacity-100",
                )}
              >
                <div className="flex min-h-7 items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {plan.promise}
                  </p>
                  {founding ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full border border-foreground/15 bg-foreground/5 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-foreground/75">
                        New
                      </span>
                      <span className="rounded-full border border-foreground/20 bg-foreground/[0.07] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-foreground/85">
                        Early adopters
                      </span>
                    </span>
                  ) : highlighted && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Recommended
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{plan.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:min-h-10">{plan.description}</p>

                <div className="mt-5 sm:mt-7">
                  {founding && (
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
                      Early adopter offer · annual only
                    </p>
                  )}
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-medium tabular-nums tracking-tight sm:text-4xl">{displayPrice(option)}</span>
                    <span className="pb-1 text-xs text-muted-foreground">/{founding || interval === "annual" ? "year" : "month"}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {founding
                      ? `First year · then Elite ${displayPrice(pricingConfig.pro_annual)}/year`
                      : interval === "annual"
                        ? `Save ${displayedAnnualSavings(planId as StandardPaidCardId)}% vs monthly`
                        : `Annual option ${displayPrice(optionFor(planId as StandardPaidCardId, "annual"))}`}
                  </p>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5 sm:mt-7 sm:space-y-3">
                  {CARD_FEATURES[planId].map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  disabled={current || checkout.loading}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedPlan(planId);
                    void selectPlan(option.id);
                  }}
                  className="mt-5 h-12 w-full rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] sm:mt-7"
                  variant={planId === "pro" ? "hero" : "outline"}
                >
                  {current ? "Current plan" : option.ctaLabel}
                </Button>
              </article>
            );
          })}
        </section>

        <section className="mt-5 flex flex-col gap-4 rounded-3xl border border-border/40 bg-card/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Free / Diagnostic</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Daily state, data connections, one protocol per day and 7-day history.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 rounded-full"
            onClick={() => {
              trackProductEvent("plan_card_clicked", { planId: "free", billingInterval: "none" });
              navigate("/app");
            }}
          >
            {subscription.tier === "free" ? "Current plan" : "Go to Home"}
          </Button>
        </section>

        <details className="group mt-5 rounded-3xl border border-border/40 bg-card/25">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium">
            Compare plans
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border/35 px-5 pb-5 pt-3">
            {/* Mobile: stacked, no horizontal scrolling */}
            <div className="divide-y divide-border/25 md:hidden">
              {COMPARISON_FEATURES.map((feature) => (
                <div key={feature} className="py-3">
                  <p className="text-xs font-medium text-foreground/85">{FEATURE_LABELS[feature]}</p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {(["free", "core", "pro", "founding_pro"] as PlanId[]).map((id) => {
                      const included = PLAN_CATALOG[id].features[feature];
                      return (
                        <div
                          key={id}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border px-1 py-1.5",
                            included ? "border-primary/25 bg-primary/5" : "border-border/30 bg-transparent",
                          )}
                        >
                          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {PLAN_CATALOG[id].shortName}
                          </span>
                          {included
                            ? <Check className="h-3.5 w-3.5 text-primary" />
                            : <span className="text-[11px] leading-none text-muted-foreground/40">—</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: full table */}
            <table className="hidden w-full text-left text-xs md:table">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Feature</th>
                  {(["free", "core", "pro", "founding_pro"] as PlanId[]).map((id) => (
                    <th key={id} className="px-3 py-2 text-center font-medium">{PLAN_CATALOG[id].shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/25">
                {COMPARISON_FEATURES.map((feature) => (
                  <tr key={feature}>
                    <td className="py-2.5 text-foreground/80">{FEATURE_LABELS[feature]}</td>
                    {(["free", "core", "pro", "founding_pro"] as PlanId[]).map((id) => (
                      <td key={id} className="px-3 py-2.5 text-center">
                        {PLAN_CATALOG[id].features[feature]
                          ? <Check className="mx-auto h-3.5 w-3.5 text-primary" />
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <section className="mt-5 rounded-3xl border border-border/40 bg-card/25 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-medium">Team / Cohort Pilot</p>
              <span className="rounded-full border border-border/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                From €799/year · 5 seats
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/80">
              Members train individually. The organizer sets a weekly protocol and sees group participation and progress.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Personal scores and cognitive data always remain private.
            </p>
          </div>
          <Button type="button" variant="outline" className="mt-4 rounded-full sm:mt-0" onClick={() => setTeamOpen(true)}>
            Join pilot waitlist
          </Button>
        </section>

        <footer className="mt-8 flex flex-col items-center gap-3 text-center">
          <button type="button" onClick={() => void checkout.restorePurchases()} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Restore purchases
          </button>
          <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground/65">
            LOOMA tracks trainable performance signals, not intelligence or medical status. Health and wearable connections remain available on every plan.
          </p>
        </footer>
      </div>

      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl border-border/50">
          <DialogHeader>
            <DialogTitle>Team / Cohort pilot</DialogTitle>
            <DialogDescription>
              Join the pilot for shared weekly protocols and a privacy-safe group dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTeamWaitlist} className="space-y-3">
            <Input type="email" required value={teamEmail} onChange={(event) => setTeamEmail(event.target.value)} placeholder="Work email" />
            <Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team or cohort (optional)" />
            <Input type="number" required min={2} max={100} value={teamSeats} onChange={(event) => setTeamSeats(event.target.value)} placeholder="Seats" />
            <DialogFooter>
              <Button type="submit" className="w-full rounded-full">Join waitlist</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
