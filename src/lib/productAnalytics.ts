import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ProductEventName =
  | "landing_viewed"
  | "baseline_cta_clicked"
  | "auth_viewed"
  | "auth_submitted"
  | "auth_succeeded"
  | "onboarding_viewed"
  | "onboarding_step_completed"
  | "calibration_started"
  | "calibration_completed"
  | "calibration_skipped"
  | "pricing_page_viewed"
  | "billing_toggle_changed"
  | "plan_card_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_failed"
  | "paywall_viewed"
  | "paywall_cta_clicked"
  | "locked_feature_clicked"
  | "trial_protocol_completed"
  | "onboarding_completed"
  | "subscription_restored"
  | "team_waitlist_joined"
  | "app_route_viewed"
  | "game_completed"
  | "recovery_action_completed"
  | "reasoning_session_completed"
  | "content_completed"
  | "coach_shadow_predictions_generated"
  | "coach_focus_shadow_forecast_generated"
  | "work_recommendation_shown"
  | "work_recommendation_dismissed"
  | "work_block_started"
  | "work_block_abandoned"
  | "work_outcome_logged"
  | "daily_outlook_shown"
  | "daily_outlook_opened"
  | "daily_outlook_action_started"
  | "health_permission_prompt_viewed"
  | "health_permission_prompt_connected"
  | "health_permission_prompt_deferred";

type EventProperties = Record<string, string | number | boolean | null>;

interface ProductEvent {
  clientEventId: string;
  event: ProductEventName;
  occurredAt: string;
  anonymousId: string;
  sessionId: string;
  path: string;
  properties: EventProperties;
}

const QUEUE_KEY = "looma_product_events_v2";
const SESSION_KEY = "looma_analytics_session_v1";
const ANONYMOUS_KEY = "looma_analytics_anonymous_v1";
const MAX_QUEUED_EVENTS = 100;
export const FIRST_PROTOCOL_PAYWALL_PENDING_KEY = "looma_first_protocol_paywall_pending_v1";
const FIRST_PROTOCOL_RECORDED_KEY = "looma_first_protocol_recorded_v1";
const PROTOCOL_COMPLETION_EVENTS = new Set<ProductEventName>([
  "game_completed",
  "recovery_action_completed",
  "reasoning_session_completed",
  "content_completed",
]);
let flushPromise: Promise<void> | null = null;
let onlineListenerAttached = false;

function getOrCreateId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

function readQueue(): ProductEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as ProductEvent[];
  } catch {
    return [];
  }
}

function writeQueue(events: ProductEvent[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUED_EVENTS)));
  } catch {
    // Analytics must never interrupt the product experience.
  }
}

function queueEvent(event: ProductEvent) {
  writeQueue([...readQueue(), event]);
}

async function flushQueueToSupabase(): Promise<void> {
  const queued = readQueue();
  if (queued.length === 0) return;

  const { data: authData } = await supabase.auth.getSession();
  const userId = authData.session?.user.id ?? null;
  const delivered = new Set<string>();

  for (const event of queued) {
    const looseSupabase = supabase as unknown as {
      from(table: string): {
        insert(values: Record<string, unknown>): PromiseLike<{ error: { code?: string; message?: string } | null }>;
      };
    };
    const { error } = await looseSupabase.from("product_usage_events").insert({
      client_event_id: event.clientEventId,
      user_id: userId,
      anonymous_id: event.anonymousId,
      session_id: event.sessionId,
      event_name: event.event,
      occurred_at: event.occurredAt,
      path: event.path,
      properties: event.properties as Json,
    });

    // A duplicate means a previous request reached the cloud but the local
    // acknowledgement was interrupted; it is safe to remove from the queue.
    if (!error || error.code === "23505") {
      delivered.add(event.clientEventId);
      continue;
    }

    // Keep the remaining events for the next online/app-open retry.
    break;
  }

  if (delivered.size > 0) {
    writeQueue(readQueue().filter((event) => !delivered.has(event.clientEventId)));
  }
}

export function flushProductEvents(): Promise<void> {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") {
    return Promise.resolve();
  }
  if (flushPromise) return flushPromise;

  flushPromise = flushQueueToSupabase().finally(() => {
    flushPromise = null;
  });
  return flushPromise;
}

/**
 * Privacy-safe first-party product analytics.
 *
 * Events are queued for offline resilience and persisted to the project's
 * Supabase cloud. They never include email, name, cognitive scores, or health
 * values, and browser Do Not Track is respected.
 */
export function trackProductEvent(
  event: ProductEventName,
  properties: EventProperties = {},
) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;

  const payload: ProductEvent = {
    clientEventId: crypto.randomUUID(),
    event,
    occurredAt: new Date().toISOString(),
    anonymousId: getOrCreateId(localStorage, ANONYMOUS_KEY),
    sessionId: getOrCreateId(sessionStorage, SESSION_KEY),
    path: `${window.location.pathname}${window.location.hash}`,
    properties,
  };

  queueEvent(payload);
  void flushProductEvents();

  if (PROTOCOL_COMPLETION_EVENTS.has(event) && !localStorage.getItem(FIRST_PROTOCOL_RECORDED_KEY)) {
    localStorage.setItem(FIRST_PROTOCOL_RECORDED_KEY, payload.occurredAt);
    localStorage.setItem(FIRST_PROTOCOL_PAYWALL_PENDING_KEY, "true");
    trackProductEvent("trial_protocol_completed", { sourceEvent: event });
  }

  if (!onlineListenerAttached) {
    window.addEventListener("online", () => void flushProductEvents());
    onlineListenerAttached = true;
  }
}
