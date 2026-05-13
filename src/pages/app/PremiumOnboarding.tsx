import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Activity, Brain, Watch, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const steps = [
  { icon: Brain, title: "System 2 unlocked", body: "Critical-thinking drills now in your library." },
  { icon: Activity, title: "Full Monitor", body: "Trends, intraday decay and Cognitive Age — all on." },
  { icon: Watch, title: "Wearable sync", body: "Connect HealthKit / Health Connect for HRV, sleep, RHR." },
];

export default function PremiumOnboarding() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  return (
    <AppShell>
      <div className="container max-w-md mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/15 mx-auto flex items-center justify-center mb-4">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
            <Sparkles className="inline w-3 h-3 mr-1" /> Welcome to LOOMA {tier === "elite" ? "Elite" : "Pro"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">You're in.</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your cognitive OS is fully active. Here's what just opened up.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
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
