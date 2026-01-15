import { AppShell } from "@/components/app/AppShell";
import { Layers, Moon, Footprints, Heart, Activity, Flame, Info, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "coming_soon";
}

const SUPPORTED_METRICS: MetricItem[] = [
  {
    id: "sleep",
    name: "Sleep Analysis",
    description: "Duration, quality, and sleep stages",
    icon: Moon,
    status: "coming_soon",
  },
  {
    id: "steps",
    name: "Step Count",
    description: "Daily movement and activity levels",
    icon: Footprints,
    status: "coming_soon",
  },
  {
    id: "heart_rate",
    name: "Heart Rate",
    description: "Resting and active heart rate",
    icon: Heart,
    status: "coming_soon",
  },
  {
    id: "hrv",
    name: "HRV",
    description: "Heart rate variability (when available)",
    icon: Activity,
    status: "coming_soon",
  },
  {
    id: "energy",
    name: "Active Energy",
    description: "Calories burned through activity",
    icon: Flame,
    status: "coming_soon",
  },
];

const Health = () => {
  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Apple Health Integration</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Connect your Apple Health data to improve NeuroLoop accuracy. This integration is optional.
            </p>
          </div>

          {/* Subscription Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Premium & Pro Feature</p>
                <p className="text-xs text-muted-foreground">Available with Premium or Pro subscription</p>
              </div>
            </div>
          </div>

          {/* Performance Link Card */}
          <div className="p-4 rounded-xl bg-card border border-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Linked to Performance</p>
                <p className="text-xs text-muted-foreground">Health data directly enhances your cognitive metrics and readiness scores</p>
              </div>
            </div>
          </div>

          {/* Integration Status Card */}
          <div className="p-5 rounded-xl bg-card border border-border mb-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Integration status</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sleep, movement, and recovery signals will be used only to refine cognitive metrics.
            </p>
          </div>

          {/* Supported Metrics */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Supported Metrics
            </h2>
            <div className="space-y-2">
              {SUPPORTED_METRICS.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50",
                      "opacity-60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                NeuroLoop does not provide medical insights or diagnoses. Health data is used solely to enhance cognitive readiness calculations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Health;
