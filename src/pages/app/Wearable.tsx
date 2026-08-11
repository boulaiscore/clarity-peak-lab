import { AppShell } from "@/components/app/AppShell";
import { Activity, Heart, Moon, Check, ExternalLink } from "lucide-react";
import { AppleHealthIcon, WhoopIcon, OuraIcon, GarminIcon, OtherWearableIcon } from "@/components/icons/WearableIcons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWearableSync } from "@/hooks/useWearableSync";
import { isNativePlatform, openHealthSettings } from "@/lib/capacitor/health";
import { useDeviceUsagePermission } from "@/hooks/useDeviceUsagePermission";
import { useCalendarContextPermission } from "@/hooks/useCalendarContextPermission";

// Wearable brands that sync via system health platforms
interface WearableItem {
  id: string;
  name: string;
  subLabel: string;
  type: "primary" | "system_sync" | "other";
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const WEARABLE_ITEMS: WearableItem[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    subLabel: "Includes Apple Watch and compatible wearables",
    type: "primary",
    icon: AppleHealthIcon,
  },
  {
    id: "garmin",
    name: "Garmin",
    subLabel: "Available via Apple Health or Health Connect",
    type: "system_sync",
    icon: GarminIcon,
  },
  {
    id: "whoop",
    name: "WHOOP",
    subLabel: "Available via Apple Health or Health Connect",
    type: "system_sync",
    icon: WhoopIcon,
  },
  {
    id: "oura",
    name: "Oura Ring",
    subLabel: "Available via Apple Health or Health Connect",
    type: "system_sync",
    icon: OuraIcon,
  },
  {
    id: "other",
    name: "Other wearable",
    subLabel: "Works if synced with Apple Health or Health Connect",
    type: "other",
    icon: OtherWearableIcon,
  },
];

const Health = () => {
  // Wearable sync hook for native platforms
  const wearableSync = useWearableSync();
  const deviceUsage = useDeviceUsagePermission();
  const calendarContext = useCalendarContextPermission();
  const isNative = isNativePlatform();

  const isConnected = wearableSync.isConnected;

  // Handle native health connection
  const handleConnect = async () => {
    if (!wearableSync.isAvailable) {
      toast.error("Health data not available on this device");
      return;
    }

    const connected = await wearableSync.connect();
    if (connected) {
      toast.success("Successfully connected!", {
        description: "Your health data will now sync automatically."
      });
      wearableSync.forceSync();
    } else if (wearableSync.error) {
      toast.error("Connection failed", {
        description: wearableSync.error
      });
    }
  };

  // Handle manage permissions (open system settings)
  const handleManagePermissions = () => {
    openHealthSettings();
  };

  // Format last sync time
  const formatLastSync = (timestamp: Date | string | null) => {
    if (!timestamp) return null;
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <WhoopIcon className="text-primary" size={32} />
            </div>
            <h1 className="text-2xl font-semibold mb-3">
              Enhance your cognitive metrics
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Connect your wearable to unlock deeper insights.
              LOOMA uses physiological data such as sleep, heart rate variability,
              and resting heart rate to refine Cognitive Readiness and personalize
              daily focus and recovery.
            </p>
          </div>

          {/* Connected State */}
          {isConnected && (
            <div className="mb-8 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold">Wearable connected</h2>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Connected</span>
                    {wearableSync.lastSyncAt && (
                      <span className="text-muted-foreground">
                        · Last sync {formatLastSync(wearableSync.lastSyncAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Sources */}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Data sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50 text-xs">
                      <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Sleep</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50 text-xs">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Heart Rate Variability</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50 text-xs">
                      <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Resting Heart Rate</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <p className="text-xs text-muted-foreground mb-4">
                  LOOMA reads only the data required to calculate Cognitive Readiness.
                  You can revoke access at any time from system settings.
                </p>

                {/* Manage Permissions */}
                <button
                  onClick={handleManagePermissions}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Manage permissions</span>
                </button>
              </div>
            </div>
          )}

          {/* Connection List */}
          <div className="space-y-2 mb-8">
            {WEARABLE_ITEMS.map((item) => {
              const isPrimary = item.type === "primary";
              const isSystemSync = item.type === "system_sync";
              const showConnectButton = isPrimary && !isConnected && isNative;
              const showConnectedBadge = isPrimary && isConnected;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                    isPrimary
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-card/30"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isPrimary ? "bg-primary/10" : "bg-muted/30"
                    )}
                  >
                    <item.icon 
                      size={20} 
                      className={cn(isPrimary ? "text-primary" : "text-muted-foreground")} 
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.subLabel}</p>
                  </div>

                  {/* Actions/Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSystemSync && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-muted/50 text-muted-foreground">
                        System sync
                      </span>
                    )}

                    {showConnectedBadge && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </div>
                    )}

                    {showConnectButton && (
                      <button
                        onClick={handleConnect}
                        disabled={wearableSync.isSyncing}
                        className="rounded-lg border border-foreground/15 bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50"
                      >
                        {wearableSync.isSyncing ? "Connecting..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(deviceUsage.supported || calendarContext.supported) && (
            <div className="mb-8 rounded-xl border border-border/40 bg-card/30 p-4">
              <div>
                <h2 className="text-sm font-semibold">Passive context</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Daily totals only. No event or app content.
                </p>
              </div>

              <div className="mt-4 divide-y divide-border/25 border-y border-border/25">
                {calendarContext.supported && (
                  <div className="flex min-h-12 items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-xs font-medium">Schedule</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Meeting load and open windows</p>
                    </div>
                    {calendarContext.granted ? (
                      <span className="text-[10px] font-medium text-green-500">Connected</span>
                    ) : !calendarContext.isLoading ? (
                      <button
                        type="button"
                        onClick={() => void calendarContext.request()}
                        className="rounded-lg border border-primary/30 px-3 py-1.5 text-[10px] font-medium text-primary"
                      >
                        Connect
                      </button>
                    ) : null}
                  </div>
                )}

                {deviceUsage.supported && (
                  <div className="flex min-h-12 items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-xs font-medium">Attention</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Aggregate attention-app time</p>
                    </div>
                    {deviceUsage.granted ? (
                      <span className="text-[10px] font-medium text-green-500">Connected</span>
                    ) : !deviceUsage.isLoading ? (
                      <button
                        type="button"
                        onClick={() => void deviceUsage.request()}
                        className="rounded-lg border border-primary/30 px-3 py-1.5 text-[10px] font-medium text-primary"
                      >
                        Connect
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-muted/10 border border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
            LOOMA does not provide medical advice or diagnoses.
            Health data is used solely to estimate LOOMA's metrics
            and personalize cognitive training and recovery.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Health;
