import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Watch, Moon, Footprints, Heart, Activity, Flame, Info, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, PrimaryDevice } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DeviceOption {
  id: PrimaryDevice;
  name: string;
  icon: React.ElementType;
  status: "available" | "coming_soon";
  metrics: string[];
}

const DEVICES: DeviceOption[] = [
  {
    id: "apple_health",
    name: "Apple Watch / Apple Health",
    icon: Watch,
    status: "coming_soon",
    metrics: ["Sleep Analysis", "Step Count", "Heart Rate", "HRV", "Active Energy"],
  },
  {
    id: "whoop",
    name: "Whoop",
    icon: Activity,
    status: "coming_soon",
    metrics: ["HRV", "Sleep", "Strain", "Recovery"],
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: Activity,
    status: "coming_soon",
    metrics: ["Sleep", "Readiness", "Activity", "HRV"],
  },
  {
    id: "garmin",
    name: "Garmin",
    icon: Watch,
    status: "coming_soon",
    metrics: ["Heart Rate", "Sleep", "Stress", "Steps", "HRV"],
  },
  {
    id: "other",
    name: "Other",
    icon: Activity,
    status: "coming_soon",
    metrics: [],
  },
];

const METRIC_ICONS: Record<string, React.ElementType> = {
  "Sleep Analysis": Moon,
  "Sleep": Moon,
  "Step Count": Footprints,
  "Steps": Footprints,
  "Heart Rate": Heart,
  "HRV": Activity,
  "Active Energy": Flame,
  "Strain": Flame,
  "Recovery": Activity,
  "Readiness": Activity,
  "Activity": Flame,
  "Stress": Activity,
};

const Health = () => {
  const { user, updateUser } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<PrimaryDevice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial device from user profile
  useEffect(() => {
    if (user?.primaryDevice) {
      setSelectedDevice(user.primaryDevice);
    }
  }, [user?.primaryDevice]);

  const handleDeviceSelect = async (deviceId: PrimaryDevice) => {
    setSelectedDevice(deviceId);
    setIsSaving(true);

    try {
      await updateUser({ primaryDevice: deviceId });
      toast.success("Device preference saved");
    } catch (error) {
      console.error("Failed to save device preference:", error);
      toast.error("Failed to save preference");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDeviceData = DEVICES.find((d) => d.id === selectedDevice);

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Watch className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Your primary health device</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Select the device you currently use. We'll notify you when support is available.
            </p>
          </div>

          {/* Device Cards */}
          <div className="space-y-2 mb-6">
            {DEVICES.map((device) => {
              const Icon = device.icon;
              const isSelected = selectedDevice === device.id;
              const isAvailable = device.status === "available";

              return (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device.id)}
                  disabled={isSaving}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-primary/10" : "bg-muted/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isSelected && "text-foreground")}>
                      {device.name}
                    </p>
                    {device.id === "other" && (
                      <p className="text-xs text-muted-foreground">Specify later</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                        Available
                      </span>
                    ) : device.id !== "other" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Coming soon
                      </span>
                    ) : null}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Metrics Preview (if device selected) */}
          {selectedDeviceData && selectedDeviceData.metrics.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Metrics from {selectedDeviceData.name}
              </h2>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="grid grid-cols-2 gap-3">
                  {selectedDeviceData.metrics.map((metric) => {
                    const MetricIcon = METRIC_ICONS[metric] || Activity;
                    return (
                      <div key={metric} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                          <MetricIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-foreground">{metric}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Section */}
          {selectedDeviceData && (
            <div className="mb-6 animate-fade-in">
              {selectedDeviceData.status === "available" ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/5 to-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Apple Health integration available</p>
                      <p className="text-xs text-muted-foreground">Connect to enhance cognitive predictions</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg bg-primary/20 text-primary text-sm font-medium cursor-not-allowed opacity-60"
                  >
                    Connect Apple Health — Coming Soon
                  </button>
                </div>
              ) : selectedDevice !== "other" ? (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Integration not available yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You'll be notified when {selectedDeviceData.name} support is ready.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

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
