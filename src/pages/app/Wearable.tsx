import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Check, ChevronRight, RefreshCw } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WearableIcon = React.ComponentType<{ className?: string; size?: number }>;

function compactTime(timestamp: string | Date | null | undefined): string | null {
  if (!timestamp) return null;
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function providerName(provider: DirectWearableProvider) {
  return provider === "whoop" ? "WHOOP" : "Oura Ring";
}

function DataCode({ children, active }: { children: string; active: boolean }) {
  return (
    <span className={cn(
      "rounded-md border px-2 py-1 text-[9px] font-semibold tracking-[0.12em]",
      active ? "border-white/15 bg-white/[0.06] text-white/85" : "border-white/[0.05] text-white/25",
    )}>
      {children}
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
  const hubName = isAndroid ? "Health Connect" : isIos ? "Apple Health" : "Phone health hub";
  const HubIcon = isIos ? AppleHealthIcon : Activity;
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
  const anyConnected = connectedDirect.length > 0 || healthHub.isConnected;

  const connectHub = async () => {
    if (!native) {
      toast.message("Open LOOMA on your phone to connect health data");
      return;
    }
    if (!healthHub.isAvailable) {
      if (isAndroid) await openHealthSettings();
      toast.error(isAndroid ? "Set up Health Connect, then return to LOOMA" : "Apple Health is not available");
      return;
    }
    const connected = await healthHub.connect();
    if (!connected) {
      toast.error("Health access was not enabled");
      return;
    }
    toast.success(`${hubName} connected`, { description: "LOOMA is checking the signals your device shares." });
    await healthHub.forceSync();
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

  const indirectDevices: Array<{ name: string; detail: string; icon: WearableIcon }> = isIos
    ? [
        { name: "Apple Watch", detail: "Connect once through Apple Health", icon: AppleHealthIcon },
        { name: "Garmin", detail: "Use the data Garmin shares with Apple Health", icon: GarminIcon },
        { name: "Another wearable", detail: "Use its Apple Health connection", icon: OtherWearableIcon },
      ]
    : [
        { name: "Garmin", detail: "Use the data Garmin shares with Health Connect", icon: GarminIcon },
        { name: "Android watch", detail: "Use its Health Connect connection", icon: OtherWearableIcon },
        { name: "Another wearable", detail: "Use its Health Connect connection", icon: OtherWearableIcon },
      ];

  return (
    <AppShell>
      <div className="container px-5 py-8 sm:py-12">
        <div className="mx-auto max-w-lg space-y-8">
          <header>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/65">Data sources</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Connect your device</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Choose what you wear. LOOMA handles the correct connection path.
            </p>
          </header>

          {anyConnected && (
            <section className="rounded-[22px] bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Connected</p>
                  <p className="mt-2 text-base font-semibold">
                    {connectedDirect.length > 0
                      ? connectedDirect.map((item) => providerName(item.provider)).join(" + ")
                      : hubName}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {latestCloudUpdate ? `Last data · ${compactTime(latestCloudUpdate)}` : "Waiting for the first shared reading"}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">
                  <Check className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-[10px] text-muted-foreground">{observedCount} of 4 signal groups received today</span>
                <div className="flex gap-1.5">
                  <DataCode active={signals.sleep}>SLP</DataCode>
                  <DataCode active={signals.hrv}>HRV</DataCode>
                  <DataCode active={signals.rhr}>RHR</DataCode>
                  <DataCode active={signals.movement}>MOV</DataCode>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 px-1">
              <h2 className="text-sm font-semibold">Direct connection</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">Sign in with the account you already use for the device.</p>
            </div>
            <div className="space-y-2.5">
              {([
                { provider: "whoop" as const, name: "WHOOP", detail: "Recovery, HRV, resting HR and sleep", icon: WhoopIcon },
                { provider: "oura" as const, name: "Oura Ring", detail: "Sleep, HRV, resting HR and activity", icon: OuraIcon },
              ]).map((item) => {
                const connection = direct.connections.find((value) => value.provider === item.provider);
                const connected = connection?.status === "connected";
                const busy = direct.connectingProvider === item.provider || syncingProvider === item.provider;
                return (
                  <div key={item.provider} className="rounded-[18px] bg-white/[0.035] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
                        <item.icon size={21} className="text-white/75" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/90">{item.name}</p>
                          {connection?.is_primary && <span className="text-[8px] uppercase tracking-[0.14em] text-white/40">Primary</span>}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{connected ? `Last sync · ${compactTime(connection.last_sync_at) ?? "pending"}` : item.detail}</p>
                      </div>
                      {connected ? (
                        <button type="button" onClick={() => void syncDirect(item.provider)} disabled={busy} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.055] text-white/65 disabled:opacity-35" aria-label={`Sync ${item.name}`}>
                          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
                        </button>
                      ) : (
                        <button type="button" onClick={() => void direct.connect(item.provider)} disabled={busy} className="rounded-xl bg-white px-4 py-2 text-[11px] font-semibold text-black disabled:opacity-40">
                          {busy ? "Opening…" : "Connect"}
                        </button>
                      )}
                    </div>
                    {connection?.status === "error" && connection.last_error && (
                      <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] leading-relaxed text-amber-300/75">{connection.last_error}</p>
                    )}
                    {connected && (
                      <div className="mt-3 flex gap-4 border-t border-white/[0.06] pt-3 text-[10px]">
                        {!connection.is_primary && (
                          <button type="button" onClick={() => void direct.setPrimary(item.provider)} className="text-white/65">Use as primary</button>
                        )}
                        <button type="button" onClick={() => void direct.disconnect(item.provider)} className="text-white/35">Disconnect</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 px-1">
              <h2 className="text-sm font-semibold">Through your phone</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">Best for Apple Watch, Garmin and other supported wearables.</p>
            </div>
            <button type="button" onClick={() => void connectHub()} className="w-full rounded-[18px] bg-white/[0.035] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20">
                  <HubIcon size={21} className="text-white/75" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white/90">{hubName}</p>
                    {healthHub.isConnected && <Check className="h-3.5 w-3.5 text-white/60" />}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {healthHub.isConnected ? "Connected · reads permitted totals only" : native ? "One permission screen on your phone" : "Continue in the mobile app"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30" />
              </div>
            </button>
            <div className="mt-2.5 overflow-hidden rounded-[18px] bg-white/[0.025] px-4">
              {indirectDevices.map((item) => (
                <button key={item.name} type="button" onClick={() => void connectHub()} className="flex w-full items-center gap-3 border-b border-white/[0.055] py-3.5 text-left last:border-0">
                  <item.icon size={18} className="text-white/55" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white/80">{item.name}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                </button>
              ))}
            </div>
          </section>

          {(deviceUsage.supported || calendarContext.supported) && (
            <section className="rounded-[18px] bg-white/[0.025] p-4">
              <h2 className="text-sm font-semibold">Other passive context</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Aggregate totals only. No app or calendar content.</p>
              <div className="mt-3 divide-y divide-white/[0.055] border-t border-white/[0.055]">
                {calendarContext.supported && <PermissionRow label="Schedule" detail="Meeting load and open windows" granted={calendarContext.granted} loading={calendarContext.isLoading} onConnect={() => void calendarContext.request()} />}
                {deviceUsage.supported && <PermissionRow label="Attention" detail="Aggregate attention-app time" granted={deviceUsage.granted} loading={deviceUsage.isLoading} onConnect={() => void deviceUsage.request()} />}
              </div>
            </section>
          )}

          <p className="px-3 text-center text-[10px] leading-relaxed text-muted-foreground/45">
            Read only · encrypted connection tokens · revoke access anytime. LOOMA is not a medical device.
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
