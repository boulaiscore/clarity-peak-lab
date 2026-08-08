# LOOMA

LOOMA is a cognitive-performance self-monitoring product for professionals doing high-impact work. A brief check combines task performance with user-reported recovery context to help users decide when to focus, analyze, or reset.

LOOMA is not a medical device, diagnostic assessment, intelligence test, or predictor of decision outcomes. Scores are intended for within-person comparison and become more useful as a user's personal history grows.

## Product loop

1. Complete a brief performance check.
2. Compare the result with your personal baseline.
3. Choose a focused-work or recovery action.
4. Log the work outcome.
5. Learn which contexts and interventions are associated with your strongest sessions.

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
npm run build
npm run lint
```

The repository currently contains pre-existing lint debt outside the conversion flow. Files changed for the focused baseline release should also be checked directly with ESLint before merge.

## Stack

- React, TypeScript and Vite
- Tailwind CSS and Radix/shadcn UI primitives
- Supabase authentication and persistence
- Paddle web checkout
- Capacitor and PWA support

## Key routes

- `/#/` — public product landing page
- `/#/auth?mode=signup&intent=baseline` — baseline signup
- `/#/onboarding` — two-step context onboarding
- `/#/app/calibration` — first performance check
- `/#/app` — daily signal

## Product principles

- Compare users with themselves, not with demographic assumptions.
- Label early readings as provisional.
- Separate measured task performance from self-reported context.
- Use probabilistic, non-clinical language.
- Require repeated observations before presenting personalized patterns.
