# LOOMA subscription architecture

The commercial model is defined once in `src/config/pricing.ts` and consumed by
web checkout, native purchases, paywalls and entitlement checks.

## Plans

| Plan | Price | Product promise |
| --- | --- | --- |
| Free | €0 | Automatic daily state, connections, one protocol/day, 7-day history |
| Pro (`core`) | €24.99/month or €199/year | Unlimited structured daily loop and 90-day trends |
| Elite (`pro`) | €39.99/month or €299/year | Adaptive Coach insights, advanced patterns and formatted reports |
| Founding Elite (`founding_pro`) | €199 first year | Elite entitlements for the first 100 members |
| Team / Cohort | Waitlist | Future private group product |

Health, wearable, calendar and aggregate device-usage connections are not paid
features. They improve estimate coverage for every user; plans monetize the
training depth and the interpretation of accumulated data.

## Required release setup

1. Apply `20260811160000_subscription_entitlements_v2.sql` in Supabase.
2. Deploy `payments-webhook` and `verify-apple-receipt`.
3. Configure Paddle prices and the matching `VITE_PADDLE_*_PRICE_ID` variables.
4. Configure RevenueCat products, offerings and entitlements for the Pro, Elite
   and Founding Elite display tiers, then set the existing `VITE_REVENUECAT_*`
   product and API key variables. Technical IDs remain `core`, `pro` and
   `founding_pro` for backward compatibility.
5. Configure `REVENUECAT_WEBHOOK_SECRET` and point RevenueCat to the existing
   `verify-apple-receipt` function.
6. Disable Founding checkout after 100 successful Founding subscriptions. The
   app stores the limit in config, while the hard inventory limit must also be
   enforced by the billing catalog before release.
7. Configure Founding as a separate product or a one-cycle discount that renews
   at the standard Elite price; do not reuse a permanently discounted recurring
   product in live mode.

The default Paddle IDs deliberately preserve the former products during the
migration: former Pro maps to internal `core` (displayed as Pro), and former
Elite maps to internal `pro` (displayed as Elite). The current
legacy monthly Paddle products still return their catalog prices. To charge the
new €24.99/€39.99 monthly anchors, create or update those Paddle prices and set
the environment IDs; the app always displays the amount Paddle will actually
charge.

## Entitlements

Use helpers from `src/lib/entitlements.ts`; do not compare raw subscription
strings in feature components.

- `canStartProtocol`
- `canAccessProtocol`
- `canAccessAnalytics`
- `canUseAdaptiveCoachInsights`
- `canExportReports`
- `canCreateCustomProtocol`
- `shouldShowPaywall`

Provider records are authoritative. Profile `subscription_status` is a staged
fallback for legacy/manual access. The migration converts legacy `premium` and
`pro` users to internal `core` (displayed as Pro), and legacy `elite` users to
internal `pro` (displayed as Elite).

## Verification

```sh
npm run test:subscriptions
npm run test:metrics
npm run test:coach
npm run build
```
