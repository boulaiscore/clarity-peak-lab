import {
  PLAN_CATALOG,
  type AnalyticsType,
  type FeatureName,
  type PlanId,
  type PlanLimits,
} from "@/config/pricing";

export type EntitlementSubject =
  | PlanId
  | string
  | null
  | undefined
  | { planId?: string | null; tier?: string | null; subscriptionStatus?: string | null };

export type PaywallAction =
  | "onboarding_completed"
  | "first_protocol_completed"
  | "daily_protocol_limit"
  | "premium_protocol"
  | "advanced_analytics"
  | "adaptive_coach"
  | "weekly_review"
  | "three_day_streak"
  | "pro_module";

export interface ProtocolAccessInput {
  isPremium?: boolean;
  requiredPlan?: "core" | "pro";
}

export function normalizePlanId(value: string | null | undefined): PlanId {
  switch (value) {
    case "founding":
    case "founding_pro":
      return "founding_pro";
    case "pro":
      return "pro";
    case "elite":
      return "pro";
    case "core":
    case "premium":
    case "trialing":
      return "core";
    case "team_waitlist":
      return "team_waitlist";
    default:
      return "free";
  }
}

/** Legacy profile values pre-date the Pro/Elite display names and require a different mapping. */
export function normalizeLegacyProfileTier(value: string | null | undefined): PlanId {
  if (value === "elite") return "pro";
  if (value === "pro" || value === "premium" || value === "trialing") return "core";
  return normalizePlanId(value);
}

export function resolveSubjectPlan(subject: EntitlementSubject): PlanId {
  if (subject == null) return normalizePlanId(null);
  if (typeof subject === "string") return normalizePlanId(subject);
  return normalizePlanId(subject.planId ?? subject.tier ?? subject.subscriptionStatus);
}

export function hasFeature(subject: EntitlementSubject, featureName: FeatureName): boolean {
  return PLAN_CATALOG[resolveSubjectPlan(subject)].features[featureName];
}

export function getPlanLimits(subject: EntitlementSubject): PlanLimits {
  return PLAN_CATALOG[resolveSubjectPlan(subject)].limits;
}

export function canStartProtocol(subject: EntitlementSubject, protocolsUsedToday: number): boolean {
  const max = getPlanLimits(subject).maxProtocolsPerDay;
  return max === null || protocolsUsedToday < max;
}

export function canAccessProtocol(subject: EntitlementSubject, protocol: ProtocolAccessInput): boolean {
  const planId = resolveSubjectPlan(subject);
  if (protocol.requiredPlan === "pro") return planId === "pro" || planId === "founding_pro";
  if (protocol.requiredPlan === "core" || protocol.isPremium) return planId !== "free" && planId !== "team_waitlist";
  return true;
}

export function canAccessAnalytics(subject: EntitlementSubject, analyticsType: AnalyticsType): boolean {
  if (analyticsType === "basic") return hasFeature(subject, "basicAnalytics");
  if (analyticsType === "coach") return hasFeature(subject, "adaptiveCoachInsights");
  return hasFeature(subject, "advancedAnalytics");
}

export const canUseAdaptiveCoachInsights = (subject: EntitlementSubject): boolean =>
  hasFeature(subject, "adaptiveCoachInsights");

export const canExportReports = (subject: EntitlementSubject): boolean =>
  hasFeature(subject, "formattedReportExport");

export const canCreateCustomProtocol = (subject: EntitlementSubject): boolean =>
  hasFeature(subject, "protocolBuilder");

export function requiredPlanForFeature(featureName: FeatureName): "Pro" | "Elite" | null {
  if (PLAN_CATALOG.free.features[featureName]) return null;
  if (PLAN_CATALOG.core.features[featureName]) return "Pro";
  return "Elite";
}

export function shouldShowPaywall(subject: EntitlementSubject, attemptedAction: PaywallAction): boolean {
  const planId = resolveSubjectPlan(subject);
  if (planId === "pro" || planId === "founding_pro") return false;

  if (attemptedAction === "three_day_streak") return planId === "free";
  if (attemptedAction === "onboarding_completed" || attemptedAction === "first_protocol_completed") {
    return planId === "free";
  }
  if (attemptedAction === "pro_module" || attemptedAction === "adaptive_coach" || attemptedAction === "advanced_analytics") {
    return true;
  }
  return planId === "free";
}

export function resolvePlanFromProductId(productId: string | null | undefined): PlanId {
  if (!productId) return "free";
  const normalized = productId.toLowerCase();
  if (normalized.includes("founding")) return "founding_pro";
  if (normalized.includes("elite")) return "pro";
  if (normalized.includes("core") || normalized.includes("premium")) return "core";
  // Legacy Paddle Pro was the €199 tier and maps to internal `core` (displayed as Pro).
  if (normalized === "looma_pro_monthly" || normalized === "looma_pro_yearly") return "core";
  // Native RevenueCat Pro is internal `pro` (displayed as Elite).
  if (normalized === "looma_pro_annual") return "pro";
  return "free";
}
