# LOOMA

LOOMA is a mobile cognitive-performance system for professionals doing high-impact work. It combines task performance, personal history, permitted phone-health and wearable signals, and privacy-safe usage aggregates to help users decide when to focus, analyze, train, or recover.

LOOMA is not a medical device, diagnostic assessment, intelligence test, or predictor of decision outcomes. Scores are intended for within-person comparison and become more useful as a user's personal history grows.

## Product loop

1. Build an initial cognitive baseline.
2. Keep daily context current through permitted passive signals and LOOMA activity.
3. Compare state metrics with the user's own history.
4. Train or recover in Lab when the current signals justify it.
5. Learn which contexts and interventions are associated with the user's strongest sessions.

## Local development

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

The Vite development server runs on `http://localhost:8080`.

## Environment

Copy the project's existing environment configuration and provide the required Supabase and payment variables. Product funnel events can optionally be sent to a first-party collector:

```sh
VITE_PRODUCT_ANALYTICS_ENDPOINT=https://example.com/events
```

Analytics events intentionally exclude names, email addresses, cognitive scores, and health values. Without an endpoint they remain in a capped local queue for development inspection.

## Verification

```sh
npm run lint
npm run test:metrics
npm run test:coach
npm run test:drills
npm run test:subscriptions
npm run test:outlook
npm run build
```

## Stack

- React, TypeScript and Vite
- Tailwind CSS and Radix/shadcn UI primitives
- Supabase authentication and persistence
- Paddle web checkout
- Capacitor and PWA support

## Key routes

- `/#/` — authentication/onboarding-aware entry redirect
- `/#/auth` — sign in and registration
- `/#/onboarding` — two-step context onboarding
- `/#/app/calibration` — first performance check
- `/#/app` — Home and daily cognitive state
- `/#/neuro-lab` — Lab
- `/#/app/dashboard` — Monitor
- `/#/app/wearable` — Health and wearable connections

## Product principles

- Compare users with themselves, not with demographic assumptions.
- Label early readings as provisional.
- Separate measured task performance from self-reported context.
- Use probabilistic, non-clinical language.
- Require repeated observations before presenting personalized patterns.
