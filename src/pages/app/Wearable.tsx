import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Check, ExternalLink } from "lucide-react";
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
import { useWearableSync } from "@/hooks/useWearableSync";
import { useTodayPhoneHealthSnapshot } from "@/hooks/usePhoneHealthSync";
import { useDeviceUsagePermission } from "@/hooks/useDeviceUsagePermission";
import { useCalendarContextPermission } from "@/hooks/useCalendarContextPermission";
import { supabase } from "@/integrations/supabase/client";
import {
  getPlatform,
  isNativePlatform,
  openHealthSettings,
} from "@/lib/capacitor/health";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WearableItem {
  id: string;
  name: string;
  detail: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const ANDROID_WEARABLES: WearableItem[] = [
  { id: "whoop", name: "WHOOP", detail: "Sync through Health Connect", icon: WhoopIcon },
  { id: "oura", name: "Oura Ring", detail: "Sync through Health Connect", icon: OuraIcon },
  { id: "garmin", name: "Garmin", detail: "Health Connect sharing · Android 14+", icon: GarminIcon },
  { id: "other", name: "Other wearable", detail: "Works when its app writes to Health Connect", icon: OtherWearableIcon },
];

const IOS_WEARABLES: WearableItem[] = [
  { id: "whoop", name: "WHOOP", detail: "Sync through Apple Health", icon: WhoopIcon },
  { id: "oura", name: "Oura Ring", detail: "Sync through Apple Health", icon: OuraIcon },
  { id: "garmin", name: "Garmin", detail: "Sync through Apple Health", icon: GarminIcon },
  { id: "other", name: "Other wearable", detail: "Works when its app writes to Apple Health", icon: OtherWearableIcon },
];

const WEB_WEARABLES: WearableItem[] = [
  { id: "whoop", name: "WHOOP", detail: "Via Apple Health or Health Connect", icon: WhoopIcon },
  { id: "oura", name: "Oura Ring", detail: "Via Apple Health or Health Connect", icon: OuraIcon },
  { id: "garmin", name: "Garmin", detail: "Via a supported system health hub", icon: GarminIcon },
  { id: "other", name: "Other wearable", detail: "When its app shares supported health data", icon: OtherWearableIcon },
];

function compactTime(timestamp: string | Date | null | undefined): string | null {
  if (!timestamp) return null;
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function DataCode({ children, active }: { children: string; active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-[9px] font-semibold tracking-[0.12em]",
        active
          ? "border-foreground/20 bg-foreground/[0.07] text-foreground/85"
          : "border-border/35 text-muted-foreground/35",
      )}
    >
      {children}
    </span>
  );
}

const Health = () => {
  const { user } = useAuth();
  const wearableSync = useWearableSync();
  const { data: phoneHealth } = useTodayPhoneHealthSnapshot();
  const deviceUsage = useDeviceUsagePermission();
  const calendarContext = useCalendarContextPermission();
  const platform = getPlatform();
  const isNative = isNativePlatform();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: wearableData } = useQuery({
    queryKey: ["wearable-snapshot", "latest", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wearable_snapshots")
        .select("date, source, sleep_duration_min, sleep_efficiency, hrv_ms, resting_hr, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
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
  const platformName = isAndroid ? "Health Connect" : isIos ? "Apple Health" : "Health data";
  const PlatformIcon = isIos ? AppleHealthIcon : Activity;
  const wearableItems = isAndroid ? ANDROID_WEARABLES : isIos ? IOS_WEARABLES : WEB_WEARABLES;
  const isConnected = wearableSync.isConnected;
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

  const handleConnect = async () => {
    if (!wearableSync.isAvailable) {
      if (isAndroid) await openHealthSettings();
      toast.error(isAndroid ? "Install or update Health Connect, then try again" : "Health data is not available");
      return;
    }
    const connected = await wearableSync.connect();
    if (!connected) {
      toast.error("Health access was not enabled");
      return;
    }
    toast.success(`${platformName} connected`, {
      description: "LOOMA is checking for today's available signals.",
    });
    await wearableSync.forceSync();
  };

  return (
    <AppShell>
      <div className="container px-5 py-8 sm:py-12">
        <div className="mx-auto max-w-lg space-y-8">
          <header>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/65">
              Data sources
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Health & wearables</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Passive signals refine Recovery, Readiness and today’s outlook. LOOMA reads only the permitted totals.
            </p>
          </header>

          <section className="rounded-2xl border border-border/40 bg-card/45 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-background/45">
                <PlatformIcon className="text-foreground/80" size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">{platformName}</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isAndroid ? "Android health-data hub" : isIos ? "iPhone health-data hub" : "Available in the mobile app"}
                    </p>
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/75">
                      <Check className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : isNative ? (
                    <button
                      type="button"
                      onClick={() => void handleConnect()}
                      disabled={wearableSync.isSyncing}
                      className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity active:opacity-80 disabled:opacity-45"
                    >
                      Connect
                    </button>
                  ) : null}
                </div>

                {isAndroid && (
                  <p className="mt-4 border-t border-border/25 pt-4 text-[11px] leading-relaxed text-muted-foreground">
                    Wearable app <span className="px-1 text-foreground/50">→</span> Health Connect <span className="px-1 text-foreground/50">→</span> LOOMA
                  </p>
                )}
              </div>
            </div>

            {isConnected && (
              <div className="mt-5 border-t border-border/25 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Data received today</p>
                    <p className="mt-1 text-xs text-foreground/80">
                      {observedCount > 0 ? `${observedCount} of 4 signal groups` : "Waiting for shared data"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <DataCode active={signals.sleep}>SLP</DataCode>
                    <DataCode active={signals.hrv}>HRV</DataCode>
                    <DataCode active={signals.rhr}>RHR</DataCode>
                    <DataCode active={signals.movement}>MOV</DataCode>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/55">
                  <span>{latestCloudUpdate ? `Stored in your cloud · ${compactTime(latestCloudUpdate)}` : "No health snapshot stored yet"}</span>
                  <button
                    type="button"
                    onClick={() => void openHealthSettings()}
                    className="flex items-center gap-1.5 text-foreground/65"
                  >
                    Manage <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {wearableSync.error && (
              <p className="mt-4 border-t border-border/25 pt-4 text-[11px] text-amber-400/85">
                Sync failed: {wearableSync.error}
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4 px-1">
              <div>
                <h2 className="text-sm font-semibold">Compatible wearables</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">No separate LOOMA pairing is required.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/35 bg-card/30 px-4">
              {wearableItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-border/25 py-4 last:border-0">
                  <item.icon size={19} className="text-foreground/65" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground/90">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground/55">
              Available metrics depend on what the wearable’s companion app shares with {platformName}.
            </p>
          </section>

          {(deviceUsage.supported || calendarContext.supported) && (
            <section className="rounded-2xl border border-border/35 bg-card/30 p-4">
              <h2 className="text-sm font-semibold">Other passive context</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">Aggregate totals only. No app or calendar content.</p>
              <div className="mt-3 divide-y divide-border/25 border-t border-border/25">
                {calendarContext.supported && (
                  <PermissionRow
                    label="Schedule"
                    detail="Meeting load and open windows"
                    granted={calendarContext.granted}
                    loading={calendarContext.isLoading}
                    onConnect={() => void calendarContext.request()}
                  />
                )}
                {deviceUsage.supported && (
                  <PermissionRow
                    label="Attention"
                    detail="Aggregate attention-app time"
                    granted={deviceUsage.granted}
                    loading={deviceUsage.isLoading}
                    onConnect={() => void deviceUsage.request()}
                  />
                )}
              </div>
            </section>
          )}

          <p className="px-3 text-center text-[10px] leading-relaxed text-muted-foreground/45">
            LOOMA is not a medical device and does not provide diagnoses. Health data is used only for your private cognitive estimates.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

function PermissionRow({
  label,
  detail,
  granted,
  loading,
  onConnect,
}: {
  label: string;
  detail: string;
  granted: boolean;
  loading: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
      </div>
      {granted ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/65">Connected</span>
      ) : !loading ? (
        <button
          type="button"
          onClick={onConnect}
          className="rounded-lg border border-foreground/20 px-3 py-1.5 text-[10px] font-medium text-foreground/80"
        >
          Connect
        </button>
      ) : null}
    </div>
  );
}

export default Health;
