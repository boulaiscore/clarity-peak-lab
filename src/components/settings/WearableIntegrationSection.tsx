import { Watch, Heart, Moon, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WearableProvider {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

const WEARABLE_PROVIDERS: WearableProvider[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    icon: Heart,
    description: "iPhone & Apple Watch",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    icon: Activity,
    description: "Android & Wear OS",
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: Moon,
    description: "Sleep & Recovery",
  },
  {
    id: "whoop",
    name: "WHOOP",
    icon: Watch,
    description: "Performance Tracking",
  },
];

export function WearableIntegrationSection() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5 mb-6 relative overflow-hidden">
      {/* Coming Soon Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">Coming Soon</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Watch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Wearable Integration</h3>
          <p className="text-xs text-muted-foreground">
            Enhance your readiness score with biometric data
          </p>
        </div>
      </div>

      {/* Provider Cards - Dimmed */}
      <div className="grid grid-cols-2 gap-2 opacity-40 pointer-events-none">
        {WEARABLE_PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          return (
            <div
              key={provider.id}
              className="p-3 rounded-lg border border-border/30 text-left"
            >
              <Icon className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{provider.name}</p>
              <p className="text-[10px] text-muted-foreground/70">{provider.description}</p>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground text-center">
          We're building integrations with Apple Health, Google Fit, Oura, and WHOOP to enhance your cognitive readiness insights.
        </p>
      </div>
    </div>
  );
}
