export type DirectWearableProvider = "whoop" | "oura";

export interface ProviderTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface NormalizedWearableDay {
  date: string;
  source: `${DirectWearableProvider}_direct`;
  hrvMs: number | null;
  restingHr: number | null;
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
  activityScore: number | null;
  rawJson: Record<string, unknown>;
}

const PROVIDERS = {
  whoop: {
    authorizeUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    scopes: ["read:recovery", "read:sleep", "read:cycles", "read:workout", "read:profile", "offline"],
  },
  oura: {
    authorizeUrl: "https://cloud.ouraring.com/oauth/authorize",
    tokenUrl: "https://api.ouraring.com/oauth/token",
    scopes: ["daily", "heartrate", "workout"],
  },
} as const;

export function isDirectProvider(value: unknown): value is DirectWearableProvider {
  return value === "whoop" || value === "oura";
}

function envPrefix(provider: DirectWearableProvider): string {
  return provider.toUpperCase();
}

export function getProviderCredentials(provider: DirectWearableProvider) {
  const prefix = envPrefix(provider);
  const clientId = Deno.env.get(`${prefix}_CLIENT_ID`);
  const clientSecret = Deno.env.get(`${prefix}_CLIENT_SECRET`);
  if (!clientId || !clientSecret) {
    throw new Error(`${provider.toUpperCase()} connection is not configured yet`);
  }
  return { clientId, clientSecret };
}

export function providerAuthorizeUrl(
  provider: DirectWearableProvider,
  redirectUri: string,
  state: string,
): string {
  const { clientId } = getProviderCredentials(provider);
  const config = PROVIDERS[provider];
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

async function requestToken(
  provider: DirectWearableProvider,
  params: Record<string, string>,
): Promise<ProviderTokenResponse> {
  const { clientId, clientSecret } = getProviderCredentials(provider);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...params,
  });
  const response = await fetch(PROVIDERS[provider].tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload?.access_token !== "string") {
    const detail = payload?.error_description || payload?.error || `HTTP ${response.status}`;
    throw new Error(`${provider.toUpperCase()} authorization failed: ${detail}`);
  }
  return payload as ProviderTokenResponse;
}

export function exchangeAuthorizationCode(
  provider: DirectWearableProvider,
  code: string,
  redirectUri: string,
): Promise<ProviderTokenResponse> {
  return requestToken(provider, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export function refreshProviderToken(
  provider: DirectWearableProvider,
  refreshToken: string,
): Promise<ProviderTokenResponse> {
  return requestToken(provider, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("WEARABLE_TOKEN_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) {
    throw new Error("Wearable token encryption is not configured");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptProviderToken(token: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    new TextEncoder().encode(token),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptProviderToken(value: string): Promise<string> {
  const [version, ivValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) throw new Error("Invalid encrypted wearable token");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivValue) },
    await encryptionKey(),
    base64ToBytes(encryptedValue),
  );
  return new TextDecoder().decode(decrypted);
}

export function tokenScopes(provider: DirectWearableProvider, response: ProviderTokenResponse): string[] {
  const raw = response.scope?.trim();
  return raw ? raw.split(/[ ,]+/).filter(Boolean) : [...PROVIDERS[provider].scopes];
}

export function oauthCallbackUrl(): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing");
  return `${supabaseUrl}/functions/v1/wearable-oauth-callback`;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampScore(value: unknown): number | null {
  const number = safeNumber(value);
  return number == null ? null : Math.max(0, Math.min(100, number));
}

interface WhoopRecoveryRecord {
  score_state?: string;
  created_at?: string;
  score?: { hrv_rmssd_milli?: unknown; resting_heart_rate?: unknown };
}

interface WhoopSleepRecord {
  score_state?: string;
  nap?: boolean;
  end?: string;
  score?: {
    sleep_efficiency_percentage?: unknown;
    stage_summary?: {
      total_light_sleep_time_milli?: unknown;
      total_slow_wave_sleep_time_milli?: unknown;
      total_rem_sleep_time_milli?: unknown;
    };
  };
}

interface OuraSleepRecord {
  day?: string;
  total_sleep_duration?: unknown;
  efficiency?: unknown;
  average_hrv?: unknown;
  lowest_heart_rate?: unknown;
}

interface OuraDailyRecord {
  day?: string;
  score?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function providerGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = isObject(payload)
      ? payload.detail ?? payload.error ?? `HTTP ${response.status}`
      : `HTTP ${response.status}`;
    const error = new Error(String(detail)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

async function fetchWhoop(accessToken: string, startDate: string, endDate: string): Promise<NormalizedWearableDay[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const endBoundary = new Date(`${endDate}T00:00:00.000Z`);
  endBoundary.setUTCDate(endBoundary.getUTCDate() + 1);
  const end = endBoundary.toISOString();
  const query = new URLSearchParams({ start, end, limit: "25" });
  const [recoveries, sleeps] = await Promise.all([
    providerGet<{ records?: WhoopRecoveryRecord[] }>(`https://api.prod.whoop.com/developer/v2/recovery?${query}`, accessToken),
    providerGet<{ records?: WhoopSleepRecord[] }>(`https://api.prod.whoop.com/developer/v2/activity/sleep?${query}`, accessToken),
  ]);

  const byDate = new Map<string, NormalizedWearableDay>();
  const ensure = (date: string) => {
    const current = byDate.get(date);
    if (current) return current;
    const created: NormalizedWearableDay = {
      date,
      source: "whoop_direct",
      hrvMs: null,
      restingHr: null,
      sleepDurationMin: null,
      sleepEfficiency: null,
      activityScore: null,
      rawJson: { provider: "whoop" },
    };
    byDate.set(date, created);
    return created;
  };

  for (const recovery of recoveries?.records ?? []) {
    if (recovery?.score_state !== "SCORED" || !recovery?.created_at) continue;
    const date = String(recovery.created_at).slice(0, 10);
    const day = ensure(date);
    day.hrvMs = safeNumber(recovery?.score?.hrv_rmssd_milli);
    day.restingHr = safeNumber(recovery?.score?.resting_heart_rate);
    day.rawJson = { ...day.rawJson, recovery };
  }

  for (const sleep of sleeps?.records ?? []) {
    if (sleep?.score_state !== "SCORED" || sleep?.nap || !sleep?.end) continue;
    const date = String(sleep.end).slice(0, 10);
    const day = ensure(date);
    const stages = sleep?.score?.stage_summary ?? {};
    const sleepMs = [
      stages.total_light_sleep_time_milli,
      stages.total_slow_wave_sleep_time_milli,
      stages.total_rem_sleep_time_milli,
    ].reduce((sum: number, value: unknown) => sum + (safeNumber(value) ?? 0), 0);
    day.sleepDurationMin = sleepMs > 0 ? Math.round(sleepMs / 60_000) : null;
    day.sleepEfficiency = clampScore(sleep?.score?.sleep_efficiency_percentage);
    day.rawJson = { ...day.rawJson, sleep };
  }
  return [...byDate.values()].filter((row) => row.date >= startDate && row.date <= endDate);
}

async function fetchOura(accessToken: string, startDate: string, endDate: string): Promise<NormalizedWearableDay[]> {
  const query = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const [sleeps, readiness, activity] = await Promise.all([
    providerGet<{ data?: OuraSleepRecord[] }>(`https://api.ouraring.com/v2/usercollection/sleep?${query}`, accessToken),
    providerGet<{ data?: OuraDailyRecord[] }>(`https://api.ouraring.com/v2/usercollection/daily_readiness?${query}`, accessToken),
    providerGet<{ data?: OuraDailyRecord[] }>(`https://api.ouraring.com/v2/usercollection/daily_activity?${query}`, accessToken),
  ]);

  const byDate = new Map<string, NormalizedWearableDay>();
  const ensure = (date: string) => {
    const current = byDate.get(date);
    if (current) return current;
    const created: NormalizedWearableDay = {
      date,
      source: "oura_direct",
      hrvMs: null,
      restingHr: null,
      sleepDurationMin: null,
      sleepEfficiency: null,
      activityScore: null,
      rawJson: { provider: "oura" },
    };
    byDate.set(date, created);
    return created;
  };

  // Oura may return multiple sleep periods. Use the longest primary period.
  for (const sleep of sleeps?.data ?? []) {
    if (!sleep?.day) continue;
    const day = ensure(String(sleep.day));
    const duration = safeNumber(sleep.total_sleep_duration);
    const minutes = duration == null ? null : Math.round(duration / 60);
    if (minutes != null && (day.sleepDurationMin == null || minutes > day.sleepDurationMin)) {
      day.sleepDurationMin = minutes;
      day.sleepEfficiency = clampScore(sleep.efficiency);
      day.hrvMs = safeNumber(sleep.average_hrv);
      // Oura exposes its lowest overnight resting heart rate, a provider-defined
      // resting signal. We retain the original value in raw_json for auditability.
      day.restingHr = safeNumber(sleep.lowest_heart_rate);
      day.rawJson = { ...day.rawJson, sleep };
    }
  }
  for (const item of readiness?.data ?? []) {
    if (!item?.day) continue;
    const day = ensure(String(item.day));
    day.rawJson = { ...day.rawJson, readiness: item };
  }
  for (const item of activity?.data ?? []) {
    if (!item?.day) continue;
    const day = ensure(String(item.day));
    day.activityScore = clampScore(item.score);
    day.rawJson = { ...day.rawJson, activity: item };
  }
  return [...byDate.values()];
}

export function fetchProviderDays(
  provider: DirectWearableProvider,
  accessToken: string,
  lookbackDays = 7,
): Promise<NormalizedWearableDay[]> {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - Math.max(1, lookbackDays - 1));
  return provider === "whoop"
    ? fetchWhoop(accessToken, isoDay(start), isoDay(end))
    : fetchOura(accessToken, isoDay(start), isoDay(end));
}

export async function revokeProviderAccess(
  provider: DirectWearableProvider,
  accessToken: string,
): Promise<void> {
  const response = provider === "whoop"
    ? await fetch("https://api.prod.whoop.com/developer/v2/user/access", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    : await fetch(`https://api.ouraring.com/oauth/revoke?access_token=${encodeURIComponent(accessToken)}`, {
        method: "POST",
      });
  if (!response.ok && response.status !== 401) {
    throw new Error(`${provider.toUpperCase()} access could not be revoked`);
  }
}
