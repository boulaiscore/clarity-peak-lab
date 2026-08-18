import { useCallback, useEffect } from "react";
import { Browser } from "@capacitor/browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "@/lib/platformUtils";

export type DirectWearableProvider = "whoop" | "oura";

export interface DirectWearableConnection {
  user_id: string;
  provider: DirectWearableProvider;
  status: "connected" | "error" | "revoked";
  scopes: string[];
  is_primary: boolean;
  connected_at: string;
  last_sync_at: string | null;
  last_error: string | null;
}

async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const candidate = error as { message?: string; context?: Response } | null;
  if (candidate?.context) {
    try {
      const payload = await candidate.context.clone().json();
      if (typeof payload?.error === "string") return payload.error;
    } catch {
      // The SDK response is not guaranteed to contain JSON.
    }
  }
  return candidate?.message || fallback;
}

export function useDirectWearableConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const connectionsQuery = useQuery({
    queryKey: ["wearable-provider-connections", user?.id],
    queryFn: async (): Promise<DirectWearableConnection[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("wearable_provider_connections")
        .select("user_id, provider, status, scopes, is_primary, connected_at, last_sync_at, last_error")
        .eq("user_id", user.id)
        .order("connected_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DirectWearableConnection[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const syncProvider = useCallback(async (provider: DirectWearableProvider, silent = false) => {
    const { data, error } = await supabase.functions.invoke("sync-wearable-provider", {
      body: { provider },
    });
    if (error) throw new Error(await functionErrorMessage(error, `Could not sync ${provider}`));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wearable-provider-connections", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["wearable-snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["today-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["metric-history"] }),
    ]);
    if (!silent) toast.success(`${provider === "whoop" ? "WHOOP" : "Oura"} synced`);
    return data;
  }, [queryClient, user?.id]);

  useEffect(() => {
    const status = searchParams.get("status");
    const providerValue = searchParams.get("provider");
    const provider = providerValue === "whoop" || providerValue === "oura" ? providerValue : null;
    if (!status || !provider) return;

    void Browser.close().catch(() => undefined);
    if (status === "connected") {
      toast.success(`${provider === "whoop" ? "WHOOP" : "Oura"} connected`, {
        description: "LOOMA is importing your latest signals.",
      });
      void syncProvider(provider, true).catch((error) => {
        toast.error("Connected, but the first sync needs another try", { description: error.message });
      });
    } else {
      toast.error("Device connection was not completed", {
        description: searchParams.get("detail") || undefined,
      });
    }
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    next.delete("provider");
    next.delete("detail");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, syncProvider]);

  const connectMutation = useMutation({
    mutationFn: async (provider: DirectWearableProvider) => {
      const { data, error } = await supabase.functions.invoke("wearable-oauth-start", {
        body: {
          provider,
          returnUrl: isNative() ? "looma://wearable-connected" : undefined,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error, "Could not start device connection"));
      if (!data?.authorizationUrl) throw new Error("The provider did not return a connection link");
      if (isNative()) {
        await Browser.open({ url: data.authorizationUrl, presentationStyle: "popover" });
      } else {
        window.location.assign(data.authorizationUrl);
      }
      return provider;
    },
    onError: (error) => toast.error("Connection unavailable", { description: error.message }),
  });

  const manageMutation = useMutation({
    mutationFn: async ({ provider, action }: { provider: DirectWearableProvider; action: "disconnect" | "set_primary" }) => {
      const { error } = await supabase.functions.invoke("wearable-provider-manage", {
        body: { provider, action },
      });
      if (error) throw new Error(await functionErrorMessage(error, "Could not update this device"));
      return { provider, action };
    },
    onSuccess: async ({ provider, action }) => {
      await queryClient.invalidateQueries({ queryKey: ["wearable-provider-connections", user?.id] });
      toast.success(action === "disconnect"
        ? `${provider === "whoop" ? "WHOOP" : "Oura"} disconnected`
        : "Primary device updated");
    },
    onError: (error) => toast.error("Device update failed", { description: error.message }),
  });

  return {
    connections: connectionsQuery.data ?? [],
    isLoading: connectionsQuery.isLoading,
    connectingProvider: connectMutation.isPending ? connectMutation.variables : null,
    isSyncing: false,
    connect: (provider: DirectWearableProvider) => connectMutation.mutateAsync(provider),
    sync: syncProvider,
    disconnect: (provider: DirectWearableProvider) => manageMutation.mutateAsync({ provider, action: "disconnect" }),
    setPrimary: (provider: DirectWearableProvider) => manageMutation.mutateAsync({ provider, action: "set_primary" }),
  };
}

