# AGENTS.md

Guidance for AI coding agents and contributors working in this repository.

## Project Overview

- This is a Vite + React + TypeScript application generated through Lovable.
- UI is built with Tailwind CSS, shadcn/ui-style Radix primitives, lucide-react icons, and custom theme tokens.
- Routing uses `HashRouter` in `src/App.tsx`.
- The app includes PWA support through `vite-plugin-pwa` and Capacitor support for iOS/Android workflows.
- Use the `@/` import alias for source imports from `src`.

## Build And Run

Install dependencies:

```sh
npm install
```

Start the local dev server on port 8080:

```sh
npm run dev
```

Create a production build:

```sh
npm run build
```

Create a development-mode build:

```sh
npm run build:dev
```

The unpacked Manifest V3 desktop sensor lives in `browser-extension/`. It has
no separate build step. Validate its JavaScript and manifest with:

```sh
node --check browser-extension/detector.js
node --check browser-extension/service-worker.js
node --check browser-extension/bridge.js
node --check browser-extension/popup.js
node -e "JSON.parse(require('fs').readFileSync('browser-extension/manifest.json','utf8'))"
```

Preview a built app locally:

```sh
npm run preview
```

Capacitor sync commands are available when native/mobile artifacts are involved:

```sh
npm run cap:sync
npm run cap:ios
npm run cap:android
```

Only run iOS/Android commands when the local machine has the required native toolchains.

## Test And Verification

- There is currently no `test` script in `package.json`.
- Before handing off changes, run:

```sh
npm run lint
npm run test:metrics
npm run test:coach
npm run build
```

- If you add a test framework, add the corresponding npm script and document the command here.
- For UI changes, verify the affected route in the browser at desktop and mobile widths.
- For PWA or Capacitor changes, verify that service worker caching and native sync behavior still match the intended platform flow.
- For desktop sensor changes, run `npm run test:coach`, validate the extension files above, and preserve the aggregate-only privacy contract in `browser-extension/README.md`.

## Code Style

- Prefer TypeScript and React function components.
- Keep component, hook, context, and page organization aligned with existing `src` conventions.
- Use existing shadcn/ui primitives from `src/components/ui` before adding custom low-level UI.
- Use Tailwind utility classes and theme tokens from `tailwind.config.ts` and CSS variables rather than hard-coded one-off colors.
- Prefer `lucide-react` icons for interface controls when an icon already exists.
- Keep imports using the `@/` alias for internal source paths.
- Avoid adding dependencies unless the feature meaningfully needs them.
- Do not edit generated build output such as `dist`.

## Linting Notes

- ESLint is configured in `eslint.config.js` for TypeScript and React hooks.
- `react-refresh/only-export-components` is a warning with constant exports allowed.
- `@typescript-eslint/no-unused-vars` is currently disabled, but avoid leaving dead code behind unless it is intentionally staged for follow-up work.

## Change Guidance

- Keep changes focused on the requested behavior and preserve existing Lovable-compatible patterns.
- When changing auth, subscription, Supabase, notifications, PWA, or Capacitor code, check the surrounding flow before editing because those paths can affect production behavior beyond the visible UI.
- Update this file whenever build, test, lint, or project-structure conventions change.
