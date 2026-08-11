export type PlanId = "free" | "core" | "pro" | "founding_pro" | "team_waitlist";
export type PaidPlanId = Exclude<PlanId, "free" | "team_waitlist">;
export type BillingInterval = "monthly" | "annual" | "none";
export const DEFAULT_BILLING_INTERVAL: Exclude<BillingInterval, "none"> = "annual";

export type FeatureName =
  | "automaticDailyState"
  | "dataConnections"
  | "limitedDailyProtocol"
  | "unlimitedProtocols"
  | "fullProtocolLibrary"
  | "allCognitiveModes"
  | "personalizedDailyRecommendation"
  | "streakTracking"
  | "weeklyConsistencyReport"
  | "basicAnalytics"
  | "advancedAnalytics"
  | "adaptiveCoachInsights"
  | "advancedPatternDetection"
  | "protocolBuilder"
  | "roleTracks"
  | "formattedReportExport"
  | "earlyAccess"
  | "foundingBadge"
  | "teamDashboard";

export type AnalyticsType = "basic" | "advanced" | "coach";

export interface PlanLimits {
  maxProtocolsPerDay: number | null;
  analyticsHistoryDays: number;
  roleTrackCount: number;
  canExportPersonalData: true;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  shortName: string;
  promise: string;
  description: string;
  features: Record<FeatureName, boolean>;
  limits: PlanLimits;
  visible: boolean;
  highlighted: boolean;
  waitlistOnly: boolean;
  limitedQuantity: boolean;
  maxQuantity: number | null;
}

export interface PricingOption {
  id: PricingOptionId;
  planId: PlanId;
  billingInterval: BillingInterval;
  amountEur: number;
  ctaLabel: string;
  webPriceId: string | null;
  nativeProductId: string | null;
}

const allFeatures = (overrides: Partial<Record<FeatureName, boolean>> = {}): Record<FeatureName, boolean> => ({
  automaticDailyState: true,
  dataConnections: true,
  limitedDailyProtocol: true,
  unlimitedProtocols: false,
  fullProtocolLibrary: false,
  allCognitiveModes: false,
  personalizedDailyRecommendation: false,
  streakTracking: true,
  weeklyConsistencyReport: false,
  basicAnalytics: true,
  advancedAnalytics: false,
  adaptiveCoachInsights: false,
  advancedPatternDetection: false,
  protocolBuilder: false,
  roleTracks: false,
  formattedReportExport: false,
  earlyAccess: false,
  foundingBadge: false,
  teamDashboard: false,
  ...overrides,
});

const coreFeatures = allFeatures({
  unlimitedProtocols: true,
  fullProtocolLibrary: true,
  allCognitiveModes: true,
  personalizedDailyRecommendation: true,
  weeklyConsistencyReport: true,
});

const proFeatures = {
  ...coreFeatures,
  advancedAnalytics: true,
  adaptiveCoachInsights: true,
  advancedPatternDetection: true,
  protocolBuilder: true,
  roleTracks: true,
  formattedReportExport: true,
  earlyAccess: true,
};

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    shortName: "Free",
    promise: "Know today's state",
    description: "Your baseline, automatic daily state and one brief protocol each day.",
    features: allFeatures(),
    limits: {
      maxProtocolsPerDay: 1,
      analyticsHistoryDays: 7,
      roleTrackCount: 0,
      canExportPersonalData: true,
    },
    visible: true,
    highlighted: false,
    waitlistOnly: false,
    limitedQuantity: false,
    maxQuantity: null,
  },
  core: {
    id: "core",
    name: "LOOMA Core",
    shortName: "Core",
    promise: "Build a reliable routine",
    description: "The complete daily loop: state, training, recovery and progress.",
    features: coreFeatures,
    limits: {
      maxProtocolsPerDay: null,
      analyticsHistoryDays: 90,
      roleTrackCount: 0,
      canExportPersonalData: true,
    },
    visible: true,
    highlighted: false,
    waitlistOnly: false,
    limitedQuantity: false,
    maxQuantity: null,
  },
  pro: {
    id: "pro",
    name: "LOOMA Pro",
    shortName: "Pro",
    promise: "Turn your data into an adaptive system",
    description: "Deeper patterns, explainable coach insights and professional workflows.",
    features: proFeatures,
    limits: {
      maxProtocolsPerDay: null,
      analyticsHistoryDays: 365,
      roleTrackCount: 5,
      canExportPersonalData: true,
    },
    visible: true,
    highlighted: true,
    waitlistOnly: false,
    limitedQuantity: false,
    maxQuantity: null,
  },
  founding_pro: {
    id: "founding_pro",
    name: "Founding Pro",
    shortName: "Founding",
    promise: "Pro access at launch pricing",
    description: "First-year Pro access for the first 100 members.",
    features: { ...proFeatures, foundingBadge: true },
    limits: {
      maxProtocolsPerDay: null,
      analyticsHistoryDays: 365,
      roleTrackCount: 5,
      canExportPersonalData: true,
    },
    visible: true,
    highlighted: true,
    waitlistOnly: false,
    limitedQuantity: true,
    maxQuantity: 100,
  },
  team_waitlist: {
    id: "team_waitlist",
    name: "Team / Cohort",
    shortName: "Team",
    promise: "Train a group, not just an individual",
    description: "Private cohorts and aggregate consistency, currently in waitlist.",
    features: { ...proFeatures, teamDashboard: true },
    limits: {
      maxProtocolsPerDay: null,
      analyticsHistoryDays: 365,
      roleTrackCount: 5,
      canExportPersonalData: true,
    },
    visible: true,
    highlighted: false,
    waitlistOnly: true,
    limitedQuantity: false,
    maxQuantity: null,
  },
};

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const configured = (key: string, fallback: string): string => {
  const value = (env as Record<string, string | undefined>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export type PricingOptionId =
  | "free"
  | "core_monthly"
  | "core_annual"
  | "pro_monthly"
  | "pro_annual"
  | "founding_pro_annual"
  | "team_waitlist";

/**
 * Commercial settings live here. Legacy Paddle external IDs remain the
 * defaults so existing products and subscribers continue working. New store
 * product IDs can be supplied through environment variables without a code
 * release.
 */
export const pricingConfig: Record<PricingOptionId, PricingOption> = {
  free: {
    id: "free",
    planId: "free",
    billingInterval: "none",
    amountEur: 0,
    ctaLabel: "Continue Free",
    webPriceId: null,
    nativeProductId: null,
  },
  core_monthly: {
    id: "core_monthly",
    planId: "core",
    billingInterval: "monthly",
    amountEur: 24.99,
    ctaLabel: "Start Core Monthly",
    webPriceId: configured("VITE_PADDLE_CORE_MONTHLY_PRICE_ID", "looma_pro_monthly"),
    nativeProductId: configured("VITE_REVENUECAT_CORE_MONTHLY_PRODUCT_ID", "looma_core_monthly"),
  },
  core_annual: {
    id: "core_annual",
    planId: "core",
    billingInterval: "annual",
    amountEur: 199,
    ctaLabel: "Start Core Annual",
    webPriceId: configured("VITE_PADDLE_CORE_ANNUAL_PRICE_ID", "looma_pro_yearly"),
    nativeProductId: configured("VITE_REVENUECAT_CORE_ANNUAL_PRODUCT_ID", "looma_core_annual"),
  },
  pro_monthly: {
    id: "pro_monthly",
    planId: "pro",
    billingInterval: "monthly",
    amountEur: 39.99,
    ctaLabel: "Start Pro Monthly",
    webPriceId: configured("VITE_PADDLE_PRO_MONTHLY_PRICE_ID", "looma_elite_monthly"),
    nativeProductId: configured("VITE_REVENUECAT_PRO_MONTHLY_PRODUCT_ID", "looma_pro_monthly"),
  },
  pro_annual: {
    id: "pro_annual",
    planId: "pro",
    billingInterval: "annual",
    amountEur: 299,
    ctaLabel: "Start Pro Annual",
    webPriceId: configured("VITE_PADDLE_PRO_ANNUAL_PRICE_ID", "looma_elite_yearly"),
    nativeProductId: configured("VITE_REVENUECAT_PRO_ANNUAL_PRODUCT_ID", "looma_pro_annual"),
  },
  founding_pro_annual: {
    id: "founding_pro_annual",
    planId: "founding_pro",
    billingInterval: "annual",
    amountEur: 199,
    ctaLabel: "Claim Founding Access",
    webPriceId: configured("VITE_PADDLE_FOUNDING_PRO_ANNUAL_PRICE_ID", "looma_pro_yearly"),
    nativeProductId: configured("VITE_REVENUECAT_FOUNDING_PRO_ANNUAL_PRODUCT_ID", "looma_founding_pro_annual"),
  },
  team_waitlist: {
    id: "team_waitlist",
    planId: "team_waitlist",
    billingInterval: "none",
    amountEur: 0,
    ctaLabel: "Join Team Waitlist",
    webPriceId: null,
    nativeProductId: null,
  },
};

export const FEATURE_LABELS: Record<FeatureName, string> = {
  automaticDailyState: "Automatic daily state",
  dataConnections: "Health, wearable and context connections",
  limitedDailyProtocol: "One daily protocol",
  unlimitedProtocols: "Unlimited protocols",
  fullProtocolLibrary: "Full protocol library",
  allCognitiveModes: "All cognitive modes",
  personalizedDailyRecommendation: "Personalized daily recommendation",
  streakTracking: "Streak tracking",
  weeklyConsistencyReport: "Weekly consistency review",
  basicAnalytics: "Core analytics",
  advancedAnalytics: "Advanced pattern analytics",
  adaptiveCoachInsights: "Adaptive Coach insights",
  advancedPatternDetection: "Bottleneck and pattern detection",
  protocolBuilder: "Pre-performance protocol builder",
  roleTracks: "Professional tracks",
  formattedReportExport: "Formatted weekly reports",
  earlyAccess: "Early access",
  foundingBadge: "Founding Member badge",
  teamDashboard: "Team dashboard",
};

export const COMPARISON_FEATURES: FeatureName[] = [
  "automaticDailyState",
  "dataConnections",
  "limitedDailyProtocol",
  "unlimitedProtocols",
  "fullProtocolLibrary",
  "allCognitiveModes",
  "personalizedDailyRecommendation",
  "weeklyConsistencyReport",
  "basicAnalytics",
  "advancedAnalytics",
  "adaptiveCoachInsights",
  "formattedReportExport",
  "earlyAccess",
];

export const paidOptionFor = (
  planId: "core" | "pro",
  interval: Exclude<BillingInterval, "none">,
): PricingOption => pricingConfig[`${planId}_${interval}` as "core_monthly" | "core_annual" | "pro_monthly" | "pro_annual"];

export const annualSavingsPercent = (planId: "core" | "pro"): number => {
  const monthly = paidOptionFor(planId, "monthly").amountEur * 12;
  const annual = paidOptionFor(planId, "annual").amountEur;
  return Math.round((1 - annual / monthly) * 100);
};
