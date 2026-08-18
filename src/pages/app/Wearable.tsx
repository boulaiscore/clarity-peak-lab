import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Check, ChevronRight, RefreshCw, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/app/AppShell";
import {
  AppleHealthIcon,
  GarminIcon,
  OuraIcon,
  OtherWearableIcon,
  WhoopIcon,
} from "@/components/icons/WearableIcons";
import { useAuth } from "@/contexts/AuthContext";
import { useDirectWearableConnections, type DirectWearableProvider } from "@/hooks/useDirectWearableConnections";
import { useWearableSync } from "@/hooks/useWearableSync";
import { useTodayPhoneHealthSnapshot } from "@/hooks/usePhoneHealthSync";
import { useDeviceUsagePermission } from "@/hooks/useDeviceUsagePermission";
import { useCalendarContextPermission } from "@/hooks/useCalendarContextPermission";
import { supabase } from "@/integrations/supabase/client";
import { getPlatform, isNativePlatform, openHealthSettings } from "@/lib/capacitor/health";
import { trackProductEvent } from "@/lib/productAnalytics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WearableIcon = React.ComponentType<{ className?: string; size?: number }>;
type DeviceId = "apple_watch" | "android_watch" | "whoop" | "oura" | "garmin" | "other";

interface DeviceOption {
  id: DeviceId;
  name: string;
  detail: string;
  icon: WearableIcon;
  provider?: DirectWearableProvider;
  usesPhoneHealth?: boolean;
}

function compactTime(timestamp: string | Date | null | undefined): string | null {
  if (!timestamp) return null;
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function providerName(provider: DirectWearableProvider) {
  return provider === "whoop" ? "WHOOP" : "Oura Ring";
}

function deviceStorageKey(userId: string, platform: string) {
  return `looma:selected-health-device:${userId}:${platform}`;
}

function isDeviceId(value: string | null): value is DeviceId {
  return ["apple_watch", "android_watch", "whoop", "oura", "garmin", "other"].includes(value ?? "");
}

function SignalState({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 text-[10px]",
      active ? "text-white/75" : "text-white/25",
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white/75" : "bg-white/15")} />
      {label}
    </span>
  );
}

const Health = () => {
  const { user } = useAuth();
  const healthHub = useWearableSync();
  const direct = useDirectWearableConnections();
  const { data: phoneHealth } = useTodayPhoneHealthSnapshot();
  const deviceUsage = useDeviceUsagePermission();
  const calendarContext = useCalendarContextPermission();
  const platform = getPlatform();
  const native = isNativePlatform();
  const today = format(new Date(), "yyyy-MM-dd");
  const [syncingProvider, setSyncingProvider] = useState<DirectWearableProvider | null>(null);
  const [selectedHealthDevice, setSelectedHealthDevice] = useState<DeviceId | null>(null);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const { data: wearableData } = useQuery({
    queryKey: ["wearable-snapshot", "canonical-latest", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wearable_daily_canonical")
        .select("date, source, sleep_duration_min, sleep_efficiency, hrv_ms, resting_hr, updated_at")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const isAndroid = platform === "android";
  const isIos = platform === "ios";
  const hubName = isAndroid ? "Health Connect" : isIos ? "Apple Health" : "phone health access";
  const hasTodayWearableData = wearableData?.date === today;
  const latestCloudUpdate = [wearableData?.updated_at, phoneHealth?.updated_at]
    .filter((value): value is string => !!value)
    .sort()
    .at(-1) ?? null;
  const signals = useMemo(() => ({
    sleep: phoneHealth?.sleep_min != null || (hasTodayWearableData && wearableData?.sleep_duration_min != null),
    hrv: hasTodayWearableData && wearableData?.hrv_ms != null,
    rhr: hasTodayWearableData && wearableData?.resting_hr != null,
    movement: phoneHealth?.steps != null || phoneHealth?.active_min != null,
  }), [hasTodayWearableData, phoneHealth, wearableData]);
  const observedCount = Object.values(signals).filter(Boolean).length;
  const connectedDirect = direct.connections.filter((connection) => connection.status === "connected");
  const primaryDirect = connectedDirect.find((connection) => connection.is_primary) ?? connectedDirect[0] ?? null;
  const anyConnected = connectedDirect.length > 0 || healthHub.isConnected;

  const devices = useMemo<DeviceOption[]>(() => {
    const directOptions: DeviceOption[] = [
      { id: "whoop", name: "WHOOP", detail: "Recovery, sleep, HRV and resting heart rate", icon: WhoopIcon, provider: "whoop" },
      { id: "oura", name: "Oura Ring", detail: "Sleep, HRV, resting heart rate and activity", icon: OuraIcon, provider: "oura" },
    ];
    const sharedOptions: DeviceOption[] = [
      { id: "garmin", name: "Garmin", detail: "Available sleep, heart and activity signals", icon: GarminIcon, usesPhoneHealth: true },
      { id: "other", name: "Another wearable", detail: "Use the health data shared by your wearable", icon: OtherWearableIcon, usesPhoneHealth: true },
    ];

    if (isIos) {
      return [
        { id: "apple_watch", name: "Apple Watch", detail: "Sleep, HRV, resting heart rate and movement", icon: AppleHealthIcon, usesPhoneHealth: true },
        ...directOptions,
        ...sharedOptions,
      ];
    }
    if (isAndroid) {
      return [
        { id: "android_watch", name: "Android watch", detail: "Sleep, heart and movement shared with your phone", icon: OtherWearableIcon, usesPhoneHealth: true },
        ...directOptions,
        ...sharedOptions,
      ];
    }
    return [
      ...directOptions,
      { id: "apple_watch", name: "Apple Watch", detail: "Continue in the LOOMA iPhone app", icon: AppleHealthIcon, usesPhoneHealth: true },
      { id: "android_watch", name: "Android watch", detail: "Continue in the LOOMA Android app", icon: OtherWearableIcon, usesPhoneHealth: true },
      ...sharedOptions,
    ];
  }, [isAndroid, isIos]);

  const deviceKey = user?.id ? deviceStorageKey(user.id, platform) : null;

  useEffect(() => {
    if (!deviceKey) return;
    const stored = localStorage.getItem(deviceKey);
    setSelectedHealthDevice(isDeviceId(stored) ? stored : null);
  }, [deviceKey]);

  useEffect(() => {
    if (anyConnected) setShowDevicePicker(false);
  }, [anyConnected]);

  const selectedHubOption = devices.find((device) => device.id === selectedHealthDevice) ?? null;
  const activeOption = primaryDirect
    ? devices.find((device) => device.provider === primaryDirect.provider) ?? null
    : healthHub.isConnected
      ? selectedHubOption
      : null;
  const ActiveIcon = activeOption?.icon ?? (isIos ? AppleHealthIcon : Activity);
  const activeName = activeOption?.name ?? (primaryDirect ? providerName(primaryDirect.provider) : hubName);

  const rememberHealthDevice = (device: DeviceOption) => {
    setSelectedHealthDevice(device.id);
    if (deviceKey) localStorage.setItem(deviceKey, device.id);
  };

  const connectPhoneDevice = async (device: DeviceOption) => {
    rememberHealthDevice(device);
    trackProductEvent("wearable_device_selected", { deviceId: device.id, path: "phone_health", platform });

    if (!native) {
      toast.message("Continue in the LOOMA mobile app", { description: `${device.name} connects securely from your phone.` });
      return;
    }
    if (healthHub.isConnected) {
      toast.success(`${device.name} selected`, { description: "LOOMA is checking the signals available today." });
      await healthHub.forceSync();
      setShowDevicePicker(false);
      return;
    }
    if (!healthHub.isAvailable) {
      if (isAndroid) await openHealthSettings();
      toast.error(isAndroid ? "Set up Health Connect, then return to LOOMA" : "Health access is not available on this phone");
      return;
    }
    const connected = await healthHub.connect();
    if (!connected) {
      toast.error("Health access was not enabled", { description: `Allow the signals you want ${device.name} to share.` });
      return;
    }
    toast.success(`${device.name} connected`, { description: "LOOMA is importing the first available signals." });
    setShowDevicePicker(false);
    await healthHub.forceSync();
  };

  const chooseDevice = async (device: DeviceOption) => {
    if (device.provider) {
      const connection = direct.connections.find((item) => item.provider === device.provider);
      if (connection?.status === "connected") {
        if (!connection.is_primary && connectedDirect.length > 1) await direct.setPrimary(device.provider);
        setShowDevicePicker(false);
        return;
      }
      trackProductEvent("wearable_device_selected", { deviceId: device.id, path: "direct", platform });
      await direct.connect(device.provider);
      return;
    }
    await connectPhoneDevice(device);
  };

  const syncDirect = async (provider: DirectWearableProvider) => {
    setSyncingProvider(provider);
    try {
      await direct.sync(provider);
    } catch (error) {
      toast.error("Sync failed", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setSyncingProvider(null);
    }
  };

  const syncActive = async () => {
    if (primaryDirect) {
      await syncDirect(primaryDirect.provider);
      return;
    }
    if (healthHub.isConnected) {
      const synced = await healthHub.forceSync();
      if (synced) toast.success("Device data updated");
    }
  };

  const managePhoneAccess = async () => {
    if (!native) {
      toast.message("Manage health access in the LOOMA mobile app");
      return;
    }
    await openHealthSettings();
  };

  const showChoices = !anyConnected || showDevicePicker;
  const directBusy = primaryDirect ? syncingProvider === primaryDirect.provider : false;
  const activeBusy = directBusy || healthHub.isSyncing;

  return (
    <AppShell>
      <div className="container px-5 py-8 sm:py-12">
        <div className="mx-auto max-w-lg space-y-8">
          <header>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/65">Device data</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{anyConnected ? "Your device" : "Connect your device"}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {anyConnected ? "LOOMA updates your daily state in the background." : "Choose what you wear. LOOMA takes care of the rest."}
            </p>
          </header>

          {anyConnected && (
            <section className="rounded-[22px] bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20">
                  <ActiveIcon size={22} className="text-white/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{activeName} connected</p>
                    <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/55">
                      <Check className="h-3.5 w-3.5" /> Active
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {observedCount > 0
                      ? `${observedCount} of 4 daily signal groups received.`
                      : "Connected. Waiting for the first available reading."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-white/[0.06] pt-4">
                <SignalState label="Sleep" active={signals.sleep} />
                <SignalState label="HRV" active={signals.hrv} />
                <SignalState label="Resting heart rate" active={signals.rhr} />
                <SignalState label="Movement" active={signals.movement} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-[10px] font-medium text-white/70">
                    {observedCount > 0 ? "Improving Recovery and Readiness" : "Recovery and Readiness will update automatically"}
                  </p>
                  <p className="mt-1 text-[9px] text-muted-foreground/65">
                    {latestCloudUpdate ? `Last data · ${compactTime(latestCloudUpdate)}` : "No manual check-in needed"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void syncActive()}
                  disabled={activeBusy}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.055] text-white/65 disabled:opacity-35"
                  aria-label={`Sync ${activeName}`}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", activeBusy && "animate-spin")} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-[10px]">
                <button type="button" onClick={() => setShowDevicePicker(true)} className="text-white/60">Add or change device</button>
                {primaryDirect ? (
                  <button type="button" onClick={() => void direct.disconnect(primaryDirect.provider)} className="text-white/30">Disconnect</button>
                ) : (
                  <button type="button" onClick={() => void managePhoneAccess()} className="text-white/30">Manage access</button>
                )}
              </div>
            </section>
          )}

          {showChoices && (
            <section>
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <h2 className="text-sm font-semibold">Choose your wearable</h2>
                  <p className="mt-1 text-[11px] text-muted-foreground">You will only see the steps needed for that device.</p>
                </div>
                {anyConnected && (
                  <button type="button" onClick={() => setShowDevicePicker(false)} className="pb-0.5 text-[10px] text-white/45">Done</button>
                )}
              </div>
              <div className="overflow-hidden rounded-[20px] bg-white/[0.03] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                {devices.map((device) => {
                  const directConnection = device.provider
                    ? direct.connections.find((connection) => connection.provider === device.provider)
                    : null;
                  const connected = directConnection?.status === "connected"
                    || (!!device.usesPhoneHealth && healthHub.isConnected && selectedHealthDevice === device.id);
                  const busy = device.provider
                    ? direct.connectingProvider === device.provider
                    : healthHub.isSyncing && selectedHealthDevice === device.id;
                  const error = directConnection?.status === "error" ? directConnection.last_error : null;

                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => void chooseDevice(device)}
                      disabled={busy}
                      className="flex w-full items-center gap-3.5 border-b border-white/[0.055] py-4 text-left last:border-0 disabled:opacity-45"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
                        <device.icon size={21} className="text-white/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white/90">{device.name}</p>
                        <p className={cn("mt-0.5 text-[10px]", error ? "text-amber-300/70" : "text-muted-foreground")}>
                          {error || device.detail}
                        </p>
                      </div>
                      {busy ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/35" />
                      ) : connected ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white/55">
                          <Check className="h-3.5 w-3.5" /> Connected
                        </span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-white/25" />
                      )}
                    </button>
                  );
                })}
              </div>

              {connectedDirect.length > 1 && (
                <div className="mt-3 rounded-[16px] bg-white/[0.025] px-4 py-3">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">Preferred source</p>
                  <div className="mt-2 flex gap-2">
                    {connectedDirect.map((connection) => (
                      <button
                        key={connection.provider}
                        type="button"
                        onClick={() => void direct.setPrimary(connection.provider)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[10px]",
                          connection.is_primary ? "bg-white text-black" : "bg-white/[0.055] text-white/55",
                        )}
                      >
                        {providerName(connection.provider)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {(deviceUsage.supported || calendarContext.supported) && (
            <details className="group rounded-[18px] bg-white/[0.025] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">More personalization</h2>
                  <p className="mt-1 text-[10px] text-muted-foreground">Optional schedule and attention context</p>
                </div>
                <Settings2 className="h-4 w-4 text-white/35" />
              </summary>
              <div className="mt-3 divide-y divide-white/[0.055] border-t border-white/[0.055]">
                {calendarContext.supported && <PermissionRow label="Schedule" detail="Meeting load and open windows" granted={calendarContext.granted} loading={calendarContext.isLoading} onConnect={() => void calendarContext.request()} />}
                {deviceUsage.supported && <PermissionRow label="Attention" detail="Aggregate attention-app time" granted={deviceUsage.granted} loading={deviceUsage.isLoading} onConnect={() => void deviceUsage.request()} />}
              </div>
            </details>
          )}

          <p className="px-3 text-center text-[10px] leading-relaxed text-muted-foreground/45">
            Read only · revoke access anytime · LOOMA is not a medical device.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

function PermissionRow({ label, detail, granted, loading, onConnect }: { label: string; detail: string; granted: boolean; loading: boolean; onConnect: () => void }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
      </div>
      {granted ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">Connected</span>
      ) : !loading ? (
        <button type="button" onClick={onConnect} className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-[10px] font-medium text-white/75">Connect</button>
      ) : null}
    </div>
  );
}

export default Health;
