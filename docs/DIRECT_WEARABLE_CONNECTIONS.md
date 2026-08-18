# Direct wearable connections

LOOMA uses two connection paths behind one device-first screen:

- WHOOP and Oura: direct, read-only OAuth connection to the provider cloud.
- Apple Watch, Garmin and other supported wearables: Apple Health on iOS or Health Connect on Android.

The app never asks the user to understand the distinction. The user selects the device they wear and LOOMA opens the correct authorization screen.

## Data integrity

Provider rows are stored in `wearable_snapshots` with source `whoop_direct` or `oura_direct`. `wearable_daily_canonical` merges overlapping rows one field at a time:

1. the user's primary direct provider;
2. another connected direct provider;
3. Apple Health or Health Connect;
4. any remaining fallback source.

This prevents duplicate counting and prevents a source with a missing field from erasing a valid field supplied by another source. Formula-critical hooks read the canonical view, while native and provider connectors continue to write auditable source rows.

Connected direct providers sync after authorization and automatically when the app becomes active, with a six-hour throttle. Home and Monitor therefore refresh without a manual action; the sync button remains available for an explicit refresh.

## Supabase activation

Apply migration:

`20260818120000_direct_wearable_connections.sql`

Deploy functions:

- `wearable-oauth-start`
- `wearable-oauth-callback` (JWT verification disabled in `supabase/config.toml` because the provider calls it)
- `sync-wearable-provider`
- `wearable-provider-manage`

Configure these Supabase Edge Function secrets:

- `WHOOP_CLIENT_ID`
- `WHOOP_CLIENT_SECRET`
- `OURA_CLIENT_ID`
- `OURA_CLIENT_SECRET`
- `WEARABLE_TOKEN_ENCRYPTION_KEY` (a random value of at least 32 characters)

Register this exact redirect URI in both provider developer dashboards:

`https://rqdmhhhkzpwceeznpftn.supabase.co/functions/v1/wearable-oauth-callback`

No provider secret or OAuth token belongs in Vite environment variables, the browser bundle, Capacitor configuration or the mobile package. Provider tokens are AES-GCM encrypted by Edge Functions and stored in a table with RLS enabled and no client access policy.

## Android and iOS

Android declares the callback `looma://wearable-connected` in `AndroidManifest.xml`. After changing web code or the manifest, run `npx cap sync android` before creating the bundle.

When the native iOS project is generated, register the `looma` URL scheme in the Xcode target. Apple Watch continues to use HealthKit; no direct Apple Watch OAuth connector is required.

## Provider notes

- WHOOP scopes: recovery, sleep, cycles, workout, profile and offline refresh.
- Oura scopes: daily, heart rate and workout.
- Direct connections are read only.
- Disconnecting deletes the provider token and connection. Existing historical snapshots remain for continuity and auditability.
