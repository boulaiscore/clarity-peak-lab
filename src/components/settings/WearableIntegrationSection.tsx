import { useState } from "react";
import { Watch, Smartphone, Heart, Moon, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

interface WearableProvider {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  available: boolean;
}

const WEARABLE_PROVIDERS: WearableProvider[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    icon: Heart,
    description: "iPhone & Apple Watch",
    available: true,
  },
  {
    id: "google_fit",
    name: "Google Fit",
    icon: Activity,
    description: "Android & Wear OS",
    available: true,
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: Moon,
    description: "Sleep & Recovery",
    available: true,
  },
  {
    id: "whoop",
    name: "WHOOP",
    icon: Watch,
    description: "Performance Tracking",
    available: false,
  },
];

export function WearableIntegrationSection() {
  const { hasWearableData, wearableSnapshot } = useCognitiveReadiness();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-5">
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

      {/* Status */}
      {hasWearableData && wearableSnapshot ? (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </div>
          <p className="text-xs text-muted-foreground">
            Receiving data from {wearableSnapshot.source?.replace("_", " ")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {wearableSnapshot.hrv_ms && (
              <div>HRV: {Number(wearableSnapshot.hrv_ms).toFixed(0)} ms</div>
            )}
            {wearableSnapshot.resting_hr && (
              <div>RHR: {Number(wearableSnapshot.resting_hr).toFixed(0)} bpm</div>
            )}
            {wearableSnapshot.sleep_duration_min && (
              <div>Sleep: {(Number(wearableSnapshot.sleep_duration_min) / 60).toFixed(1)}h</div>
            )}
            {wearableSnapshot.sleep_efficiency && (
              <div>Efficiency: {(Number(wearableSnapshot.sleep_efficiency) * 100).toFixed(0)}%</div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-muted-foreground">
            No wearable data connected yet. Your readiness score is based purely on cognitive performance.
          </p>
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {WEARABLE_PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              disabled={!provider.available}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                provider.available
                  ? "border-border/50 hover:border-primary/40 hover:bg-card"
                  : "border-border/30 opacity-50 cursor-not-allowed",
                selectedProvider === provider.id && "border-primary bg-primary/5"
              )}
            >
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium">{provider.name}</p>
              <p className="text-[10px] text-muted-foreground">{provider.description}</p>
              {!provider.available && (
                <span className="text-[10px] text-muted-foreground/60">Coming soon</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Integration Instructions */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-start gap-2">
          <Smartphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium mb-1">Mobile App Integration</p>
            <p className="text-xs text-muted-foreground mb-2">
              Wearable data is synced via our mobile companion app. Install the NeuroLoop app on your phone to connect Apple Health, Google Fit, or other supported platforms.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              API Endpoint: <code className="bg-muted/50 px-1 rounded">/functions/v1/wearables-ingest</code>
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <p className="text-[10px] text-muted-foreground/60 mt-3 pt-3 border-t border-border/30">
        We only use aggregated sleep, HRV, and recovery data to contextualize your cognitive performance. 
        No continuous tracking or invasive monitoring.
      </p>
    </div>
  );
}
