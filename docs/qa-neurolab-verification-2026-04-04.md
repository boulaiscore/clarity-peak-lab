# Neuro Lab / Train / System 1 / System 2 verification

Date: 2026-04-04 (UTC)

## Scope
- Routing and entry points for Neuro Lab and Train flows
- System 1 / System 2 game navigation wiring
- Basic internal gating logic consistency
- Buildability check (production build)

## What was verified

1. **Routes exist for all game runner pages used by selectors**
   - Verified that routes configured in S1/S2 game selectors are all present in `src/App.tsx`.
   - Selector routes checked:
     - `/neuro-lab/triage-sprint`
     - `/neuro-lab/orbit-lock`
     - `/neuro-lab/focus-switch`
     - `/neuro-lab/flash-connect`
     - `/neuro-lab/constellation-snap`
     - `/neuro-lab/semantic-drift`
     - `/neuro-lab/causal-ledger`
     - `/neuro-lab/counterfactual-audit`
     - `/neuro-lab/socratic-cross-exam`
     - `/neuro-lab/signal-vs-noise`
     - `/neuro-lab/hidden-rule-lab`
     - `/neuro-lab/counterexample-forge`

2. **Neuro Lab navigation flow**
   - `NeuroLab` supports tabbed area (`games`, `tasks`, `detox`) and redirects into area pages.
   - `NeuroLabArea` requires selecting mode (`fast` = System 1, `slow` = System 2), applies games gating, and starts session via URL params.

3. **System game map alignment**
   - `GamesLibrary` maps:
     - System 1 → `S1-AE`, `S1-RA`
     - System 2 → `S2-CT`, `S2-IN`
   - UI opens dedicated selectors for each category.

4. **Core gating logic sanity**
   - `gamesGating` includes explicit thresholding and caps for S1/S2.
   - S2 hard block when Recovery < 45 is present.

5. **Build check**
   - `npm run build` succeeds.

## Issues / limitations found during verification

- `npm run lint` currently fails due to pre-existing, repo-wide lint errors not specific to these pages.
- No browser automation tool was available in this environment, so this verification is static + build-level; no pixel-level visual checks or interactive playthrough were executed.

## Conclusion
- **Internal wiring for LAB/Train/System1/System2 appears consistent and functional at route + logic integration level.**
- **Production build succeeds.**
- For full UI confidence, add an interactive smoke suite (Playwright/Cypress) covering:
  - Open Neuro Lab
  - Expand System 1 and System 2 blocks
  - Open each selector and launch one runner per category
  - Verify return-to-games flows after completion
