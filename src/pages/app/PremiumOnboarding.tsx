import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function PremiumOnboarding() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const isPro = tier === "pro" || tier === "founding_pro";
  const steps = isPro
    ? [
        { title: "Adaptive insights", body: "See what the coach is learning from your own history." },
        { title: "Advanced patterns", body: "Explore longer trends and professional workflows." },
        { title: "Full Lab", body: "Every training mode and protocol is available." },
      ]
    : [
        { title: "Full Lab", body: "Every training mode and protocol is available." },
        { title: "Daily routine", body: "Use personalized recommendations without session limits." },
        { title: "Progress", body: "Review your full history and weekly consistency." },
      ];
  return (
    <AppShell>
      <div className="container max-w-md mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
            Welcome to {tier === "founding_pro" ? "Founding Pro" : tier === "pro" ? "LOOMA Pro" : "LOOMA Core"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">You're in.</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your plan is active. Here's what just opened up.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {steps.map(({ title, body }, index) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border bg-card">
              <span className="pt-0.5 text-[10px] font-semibold tracking-[0.16em] text-primary">0{index + 1}</span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <Button variant="hero" className="w-full" onClick={() => navigate("/app")}>
          Begin <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </AppShell>
  );
}
