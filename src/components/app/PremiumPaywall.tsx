import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Lock } from "lucide-react";
import { trackProductEvent } from "@/lib/productAnalytics";

type PaywallFeature =
  | "area"
  | "duration"
  | "neuro-activation"
  | "session-limit"
  | "first-protocol"
  | "three-day-streak"
  | "report"
  | "training"
  | "advanced-analytics"
  | "coach";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: PaywallFeature;
  featureName?: string;
}

const COPY: Record<PaywallFeature, { plan: "Pro" | "Elite"; title: string; description: string; benefits: string[] }> = {
  area: { plan: "Pro", title: "Full training library", description: "Unlock every cognitive mode and build a complete daily routine.", benefits: ["All training areas", "Unlimited protocols", "Personalized daily recommendation"] },
  duration: { plan: "Pro", title: "Extended protocols", description: "Choose the protocol length that fits your day.", benefits: ["All session lengths", "Unlimited protocols", "Full history"] },
  "neuro-activation": { plan: "Pro", title: "Pre-performance activation", description: "Prime attention before a demanding work block.", benefits: ["Activation protocols", "Full library", "Personalized recommendation"] },
  "session-limit": { plan: "Pro", title: "Today's free protocol is complete", description: "Pro removes the daily limit and keeps your full training loop available.", benefits: ["Unlimited protocols", "All cognitive modes", "90-day trends"] },
  "first-protocol": { plan: "Pro", title: "Keep your daily loop going", description: "You completed the diagnostic loop. Pro adds the full routine and history.", benefits: ["Unlimited protocols", "Full library", "Weekly review"] },
  "three-day-streak": { plan: "Pro", title: "Your routine is taking shape", description: "Three consistent days are enough to start seeing a pattern. Pro keeps the loop open.", benefits: ["Unlimited protocols", "90-day trends", "Weekly consistency review"] },
  report: { plan: "Elite", title: "Advanced report", description: "Elite turns longer-term patterns into an exportable performance brief.", benefits: ["Advanced pattern analytics", "Formatted reports", "Adaptive Coach insights"] },
  training: { plan: "Pro", title: "Advanced training", description: "Unlock the full protocol library and every cognitive mode.", benefits: ["Full library", "Unlimited protocols", "Daily recommendation"] },
  "advanced-analytics": { plan: "Elite", title: "Advanced patterns", description: "See the personal patterns shaping focus, load and recovery over time.", benefits: ["Long-range analytics", "Pattern detection", "Adaptive Coach insights"] },
  coach: { plan: "Elite", title: "Adaptive Coach insights", description: "See what Looma is learning from your history and how its forecasts perform.", benefits: ["Explainable forecasts", "Pattern detection", "Personalized insights"] },
};

export function PremiumPaywall({ open, onOpenChange, feature = "area", featureName }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const copy = COPY[feature];
  const requiredPlanId = copy.plan === "Elite" ? "pro" : "core";

  useEffect(() => {
    if (open) {
      trackProductEvent("locked_feature_clicked", { triggerAction: feature, requiredPlan: requiredPlanId });
      trackProductEvent("paywall_viewed", { triggerAction: feature, requiredPlan: requiredPlanId });
    }
  }, [feature, open, requiredPlanId]);

  const upgrade = () => {
    trackProductEvent("paywall_cta_clicked", { triggerAction: feature, requiredPlan: requiredPlanId });
    onOpenChange(false);
    navigate(`/app/subscription?source=paywall&trigger=${feature}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl border-border/50 bg-card">
        <AlertDialogHeader className="text-left">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/40">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">LOOMA {copy.plan}</p>
          <AlertDialogTitle className="text-xl tracking-tight">
            {copy.title}
            {featureName && <span className="mt-1 block text-sm font-normal text-muted-foreground">{featureName}</span>}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-sm leading-relaxed">{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          {copy.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 text-sm text-foreground/80">
              <Check className="h-3.5 w-3.5 text-primary" />
              {benefit}
            </div>
          ))}
        </div>
        <AlertDialogFooter className="flex-col gap-2 pt-1 sm:flex-col">
          <Button onClick={upgrade} variant="hero" className="h-11 w-full rounded-full">
            Explore {copy.plan} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-muted-foreground">Not now</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
