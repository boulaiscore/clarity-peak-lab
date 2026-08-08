type ProductEventName =
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
  | "checkout_started";

type EventProperties = Record<string, string | number | boolean | null>;

interface ProductEvent {
  event: ProductEventName;
  occurredAt: string;
  sessionId: string;
  path: string;
  properties: EventProperties;
}

const QUEUE_KEY = "looma_product_events_v1";
const SESSION_KEY = "looma_analytics_session_v1";
const MAX_QUEUED_EVENTS = 50;

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

function queueEvent(event: ProductEvent) {
  try {
    const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as ProductEvent[];
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...current, event].slice(-MAX_QUEUED_EVENTS)));
  } catch {
    // Analytics must never interrupt the product experience.
  }
}

/**
 * Minimal, privacy-safe product analytics.
 *
 * Events never include email, name, cognitive scores, or health values. They are
 * queued locally and can optionally be delivered to a first-party endpoint by
 * configuring VITE_PRODUCT_ANALYTICS_ENDPOINT.
 */
export function trackProductEvent(
  event: ProductEventName,
  properties: EventProperties = {},
) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;

  const payload: ProductEvent = {
    event,
    occurredAt: new Date().toISOString(),
    sessionId: getSessionId(),
    path: `${window.location.pathname}${window.location.hash}`,
    properties,
  };

  queueEvent(payload);

  const endpoint = import.meta.env.VITE_PRODUCT_ANALYTICS_ENDPOINT as string | undefined;
  if (!endpoint) return;

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
