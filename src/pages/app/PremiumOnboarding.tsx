import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const steps = [
  { title: "System 2 unlocked", body: "Critical-thinking drills now in your library." },
  { title: "Full Monitor", body: "Trends, intraday decay and Cognitive Age — all on." },
  { title: "Wearable sync", body: "Connect HealthKit / Health Connect for HRV, sleep, RHR." },
];

export default function PremiumOnboarding() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  return (
    <AppShell>
      <div className="container max-w-md mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
            Welcome to LOOMA {tier === "elite" ? "Elite" : "Pro"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">You're in.</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your cognitive OS is fully active. Here's what just opened up.
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
