import { supabase } from "@/integrations/supabase/client";
import type { HealthPermissionStatus } from "@/lib/capacitor/health";

export const CANONICAL_METRIC_FORMULA_VERSION = "metric-integrity-2026-08";
export const HEALTH_PERMISSION_POLICY_VERSION = "health-permission-v1";

type HealthSource = "healthkit" | "health_connect";

interface RecordHealthPermissionEventInput {
  userId: string;
  source: HealthSource;
  permissions: HealthPermissionStatus;
}

/**
 * Appends the explicit system-health permission result to the user's cloud
 * audit trail. Failure is returned to the caller but must never block the
 * native permission flow or Health sync.
 */
export async function recordHealthPermissionEvent({
  userId,
  source,
  permissions,
}: RecordHealthPermissionEventInput): Promise<void> {
  const entries = Object.entries(permissions) as Array<
    [keyof HealthPermissionStatus, HealthPermissionStatus[keyof HealthPermissionStatus]]
  >;
  const grantedScopes = entries
    .filter(([, status]) => status === "granted")
    .map(([scope]) => scope);
  const decidedScopes = entries.filter(([, status]) => status !== "not_determined");

  if (decidedScopes.length === 0) return;

  const action = grantedScopes.length === 0
    ? "denied"
    : grantedScopes.length === entries.length
      ? "granted"
      : "limited";

  const { error } = await supabase.from("data_consent_events").insert({
    user_id: userId,
    source,
    purpose: "personalized_cognitive_metrics",
    action,
    scopes: grantedScopes,
    policy_version: HEALTH_PERMISSION_POLICY_VERSION,
    actor: "user",
    metadata: {
      permission_states: permissions,
    },
  });

  if (error) throw error;
}
