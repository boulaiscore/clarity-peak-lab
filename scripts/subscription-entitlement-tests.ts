import assert from "node:assert/strict";
import {
  DEFAULT_BILLING_INTERVAL,
  PLAN_CATALOG,
  annualSavingsPercent,
  pricingConfig,
} from "../src/config/pricing";
import {
  canAccessAnalytics,
  canAccessProtocol,
  canCreateCustomProtocol,
  canStartProtocol,
  canUseAdaptiveCoachInsights,
  hasFeature,
  normalizeLegacyProfileTier,
  requiredPlanForFeature,
  shouldShowPaywall,
} from "../src/lib/entitlements";

assert.equal(DEFAULT_BILLING_INTERVAL, "annual");
assert.equal(PLAN_CATALOG.pro.highlighted, true);
assert.equal(PLAN_CATALOG.core.name, "LOOMA Pro");
assert.equal(PLAN_CATALOG.pro.name, "LOOMA Elite");
assert.equal(PLAN_CATALOG.founding_pro.name, "Founding Elite");
assert.equal(PLAN_CATALOG.founding_pro.limitedQuantity, true);
assert.equal(PLAN_CATALOG.founding_pro.maxQuantity, 100);
assert.equal(PLAN_CATALOG.team_waitlist.waitlistOnly, true);

assert.equal(canStartProtocol("free", 0), true);
assert.equal(canStartProtocol("free", 1), false);
assert.equal(canStartProtocol("core", 25), true);
assert.equal(canAccessProtocol("free", { isPremium: true }), false);
assert.equal(canAccessProtocol("core", { isPremium: true }), true);
assert.equal(canAccessProtocol("core", { requiredPlan: "pro" }), false);
assert.equal(canAccessProtocol("pro", { requiredPlan: "pro" }), true);

assert.equal(hasFeature("free", "dataConnections"), true);
assert.equal(hasFeature("core", "fullProtocolLibrary"), true);
assert.equal(canAccessAnalytics("core", "advanced"), false);
assert.equal(canUseAdaptiveCoachInsights("core"), false);
assert.equal(canUseAdaptiveCoachInsights("pro"), true);
assert.equal(canCreateCustomProtocol("pro"), true);
assert.equal(canCreateCustomProtocol("founding_pro"), true);
assert.deepEqual(PLAN_CATALOG.founding_pro.features, {
  ...PLAN_CATALOG.pro.features,
  foundingBadge: true,
});

assert.equal(requiredPlanForFeature("unlimitedProtocols"), "Pro");
assert.equal(requiredPlanForFeature("advancedAnalytics"), "Elite");
assert.equal(shouldShowPaywall("free", "first_protocol_completed"), true);
assert.equal(shouldShowPaywall("core", "advanced_analytics"), true);
assert.equal(shouldShowPaywall("pro", "advanced_analytics"), false);

assert.equal(normalizeLegacyProfileTier("premium"), "core");
assert.equal(normalizeLegacyProfileTier("pro"), "core");
assert.equal(normalizeLegacyProfileTier("elite"), "pro");

assert.equal(pricingConfig.core_annual.amountEur, 199);
assert.equal(pricingConfig.pro_annual.amountEur, 299);
assert.equal(pricingConfig.founding_pro_annual.amountEur, 199);
assert.ok(annualSavingsPercent("core") > 30);
assert.ok(annualSavingsPercent("pro") > 30);

console.log("Subscription entitlement tests passed");
