# Train Drills — integrity audit and fixes

Audit date: 2026-08-08
Scope: the eight canonical Train drills only. Internal `game*` identifiers, routes and database columns remain unchanged.

## Shared scoring and persistence contract

- Every scored drill now uses one performance-sensitive XP curve: `max(9, difficultyBase × (0.30 + 0.70 × score/100))`, followed by the verified perfect bonus and the category quality bonus. The persistence boundary clamps the final award to 9–45 XP. A zero-score completion therefore earns 9 XP rather than the old full difficulty base ([trainingPlans.ts:157](../src/lib/trainingPlans.ts#L157), [useGamesGating.ts:458](../src/hooks/useGamesGating.ts#L458)).
- Score is persisted on a 0–100 scale. The shared save boundary enforces plan, daily S1/S2 and rolling S2/IN caps before updating any cognitive skill ([useGamesGating.ts:460](../src/hooks/useGamesGating.ts#L460)).
- Routing is singular and canonical: AE → `focus_stability`, RA → `fast_thinking`, CT → `reasoning_accuracy`, IN → `slow_thinking`. For a cap-eligible session, the routed skill is refined from the objective score with `new = max(baseline, old + 0.12 × (score − old))`; XP remains a separate reward and load currency ([useGamesGating.ts](../src/hooks/useGamesGating.ts), [trainingPlans.ts](../src/lib/trainingPlans.ts)).
- Content-based drills use the shared anti-repetition generator. Procedural continuous drills (Orbit Lock and Focus Switch) generate stochastic streams instead of reusable content packs.
- All results use `UnifiedGameResults`: Session Summary, up to three KPIs, skill impact, saved XP and review. Discrete-choice drills reconstruct missed choices; the two continuous-control drills review observed performance gaps against explicit reference bands.
- Delayed UI callbacks are cancelled on unmount through [useSafeTimeout.ts:4](../src/hooks/useSafeTimeout.ts#L4), and submission locks prevent double recording from rapid taps.

## 1. Orbit Lock — S1 / AE

1. **Status:** OK after fixes.
2. **Logic:** Three progressively harder acts of 25/30/35 seconds; band width narrows by difficulty while drift and distraction intensity rise. Physics, act transitions and delayed effects are unmount-safe. Act completion is guarded outside React state updaters, so Strict Mode or adjacent animation frames cannot schedule duplicate transitions ([OrbitLockDrill.tsx](../src/components/games/orbit-lock/OrbitLockDrill.tsx)).
3. **Scoring:** `60% time-in-band + 25% smooth control + 15% distraction resistance`, bounded by normalized inputs. XP is now performance-sensitive before the AE quality bonus ([OrbitLockDrill.tsx:344](../src/components/games/orbit-lock/OrbitLockDrill.tsx#L344)).
4. **Metrics:** Persists as S1-AE / focus / fast, including time-in-band and degradation ([OrbitLockRunner.tsx:47](../src/pages/app/OrbitLockRunner.tsx#L47)). Caps and the 9–45 clamp are applied centrally.
5. **UI/UX:** Standard results and performance-gap review by act; no fabricated multiple-choice errors ([OrbitLockResults.tsx:75](../src/components/games/orbit-lock/OrbitLockResults.tsx#L75)).
6. **Diversity:** Measures continuous attentional stabilization and smooth correction, not switching speed.
7. **Action items:** Completed — actual saved XP is shown, result persistence no longer waits for exit, and outstanding timeouts are cancelled on unmount.

## 2. Focus Switch — S1 / AE

1. **Status:** OK after fixes.
2. **Logic:** Three distinct blocks (lock, inhibit, invert), 20/25/25 seconds. Difficulty adds lanes, faster switches and hard-mode lure timing. A target can be consumed only once; omissions, false alarms and post-switch actions have correct denominators. Block completion is idempotent and no longer runs as a side effect of a React state updater.
3. **Scoring:** `60% hit rate + 40% precision`, explicitly clamped to 0–100. This replaces the prior unbounded point total; perfect status additionally requires low perseveration, fast switching and no major decline ([FocusSwitchDrill.tsx:400](../src/components/games/focus-switch/FocusSwitchDrill.tsx#L400)).
4. **Metrics:** Persists as S1-AE / focus / fast with switch latency, perseveration, post-switch error, hit rate, false-alarm rate and RT variability ([FocusSwitchRunner.tsx:47](../src/pages/app/FocusSwitchRunner.tsx#L47)).
5. **UI/UX:** Standard results plus review of target capture, false alarms, latency and rule carry-over against transparent reference bands ([FocusSwitchResults.tsx:86](../src/components/games/focus-switch/FocusSwitchResults.tsx#L86)).
6. **Diversity:** Measures re-orienting, inhibition and rule reversal; it is functionally distinct from Orbit Lock’s sustained control.
7. **Action items:** Completed — normalized score, corrected post-switch denominator, saved-XP recap and aggregate review.

## 3. Constellation Snap — S1 / RA

1. **Status:** OK after fixes.
2. **Logic:** 15 rounds across three acts, with 2.5/1.8/1.3-second windows. Round locks prevent timeout/click double submission. Options are shuffled once per round and their exact order is stored for review ([ConstellationSnapDrill.tsx:83](../src/components/games/constellation-snap/ConstellationSnapDrill.tsx#L83)).
3. **Scoring:** `70% accuracy + 30% normalized speed`; remote-link accuracy and RT variability feed the RA quality bonus. XP is performance-sensitive ([ConstellationSnapDrill.tsx:380](../src/components/games/constellation-snap/ConstellationSnapDrill.tsx#L380)).
4. **Metrics:** Persists as S1-RA / creativity / fast and records anti-repetition metadata ([ConstellationSnapRunner.tsx:51](../src/pages/app/ConstellationSnapRunner.tsx#L51)).
5. **UI/UX:** Standard results, maximum three KPIs and exact missed-option reconstruction ([ConstellationSnapDrill.tsx:638](../src/components/games/constellation-snap/ConstellationSnapDrill.tsx#L638)).
6. **Diversity:** Tests fast visual set completion and remote association, unlike Semantic Drift’s verbal directional chain.
7. **Action items:** Completed — corrected stale “30 rounds” metadata, stable timer lock, exact review data and persisted XP.

## 4. Semantic Drift — S1 / RA

1. **Status:** OK after fixes.
2. **Logic:** 12/15/18 rounds at 3.0/2.5/2.0 seconds. Phase, selection and proceed refs make timeout and choice paths idempotent; Fisher–Yates replaces biased random sorting.
3. **Scoring:** Accuracy drives the 0–100 session score; speed, remote-association rate and RT consistency affect the RA quality bonus. This keeps wrong guesses penalized without letting raw tapping speed overpower correctness ([SemanticDriftRunner.tsx:77](../src/pages/app/SemanticDriftRunner.tsx#L77)).
4. **Metrics:** Persists as S1-RA / creativity / fast with the generated combination hash ([SemanticDriftRunner.tsx:113](../src/pages/app/SemanticDriftRunner.tsx#L113)).
5. **UI/UX:** Standard results with missed-chain review; displayed bonus copy is suppressed when the persistence cap awards zero XP ([SemanticDriftResults.tsx:129](../src/components/games/semantic-drift/SemanticDriftResults.tsx#L129)).
6. **Diversity:** Tests directional semantic movement under time pressure rather than visual pattern closure.
7. **Action items:** Completed — anti-repetition, unbiased shuffling, double-submit lock, unmount-safe callbacks and saved-XP recap.

## 5. Causal Ledger — S2 / CT

1. **Status:** OK after fixes.
2. **Logic:** Six deliberate rounds across three causal-evidence acts. There is intentionally no countdown; the 800 ms reading phase prevents reflex tapping. A decision ref now blocks rapid duplicate submissions ([CausalLedgerDrill.tsx:120](../src/components/games/causal-ledger/CausalLedgerDrill.tsx#L120)).
3. **Scoring:** Accuracy produces the 0–100 score and performance-sensitive medium XP. S2-CT intentionally has no quality inflation because the work is already deliberate and time-costly ([gameQualityBonus.ts:211](../src/lib/gameQualityBonus.ts#L211)).
4. **Metrics:** Persists as S2-CT / reasoning / slow and only updates CT ([CausalLedgerRunner.tsx:87](../src/pages/app/CausalLedgerRunner.tsx#L87)).
5. **UI/UX:** The intro now reads the actual six-round config rather than the stale hard-coded 12. Results are unified with scenario/claim mistake review ([CausalLedgerResults.tsx:132](../src/components/games/causal-ledger/CausalLedgerResults.tsx#L132)).
6. **Diversity:** Classifies causal claims as supported, underspecified or flawed; it does not ask which missing fact flips a decision.
7. **Action items:** Completed — metadata mismatch, duplicate input, anti-repetition and unmount-safe completion.

## 6. Counterfactual Audit — S2 / CT

1. **Status:** OK after fixes.
2. **Logic:** 8/10/12 rounds, each with a 45-second choice-and-confidence cycle. Timeout, choice and confidence submission share refs that prevent queued double completion ([CounterfactualAuditDrill.tsx:122](../src/components/games/counterfactual-audit/CounterfactualAuditDrill.tsx#L122)).
3. **Scoring:** `50% accuracy + 30% evidence discipline + 20% Brier calibration`; wrong option classes carry different penalties. RT stability is reported separately and does not reward rushed reasoning ([CounterfactualAuditDrill.tsx:337](../src/components/games/counterfactual-audit/CounterfactualAuditDrill.tsx#L337)).
4. **Metrics:** Persists as S2-CT / reasoning / slow with performance-sensitive XP ([CounterfactualAuditRunner.tsx:97](../src/pages/app/CounterfactualAuditRunner.tsx#L97)).
5. **UI/UX:** Unified recap and reconstruction of high-confidence mistakes; route exits consistently to the Train tab ([CounterfactualAuditResults.tsx:54](../src/components/games/counterfactual-audit/CounterfactualAuditResults.tsx#L54)).
6. **Diversity:** Tests counterfactual evidence selection and confidence calibration, distinct from Causal Ledger’s claim classification.
7. **Action items:** Completed — timeout race, rapid choice lock, unbiased content ordering, anti-repetition and save-failure XP reset.

## 7. Signal vs Noise — S2 / IN

1. **Status:** OK after fixes.
2. **Logic:** 6/8/10 cases with 75/60/50-second ceilings. A round lock prevents submit/timeout races. The final case is now included through the synchronous result ref instead of a stale React state closure ([SignalVsNoiseDrill.tsx:234](../src/components/games/signal-vs-noise/SignalVsNoiseDrill.tsx#L234)).
3. **Scoring:** `45% signal detection + 35% explanation quality + 20% robustness`; consistency and calibration remain diagnostic KPIs. Performance-sensitive XP is followed by the rare S2-IN quality bonus ([SignalVsNoiseDrill.tsx:454](../src/components/games/signal-vs-noise/SignalVsNoiseDrill.tsx#L454)).
4. **Metrics:** Corrected to S2-IN / creativity / slow; it no longer enters the CT reasoning bucket ([SignalVsNoiseRunner.tsx:87](../src/pages/app/SignalVsNoiseRunner.tsx#L87)).
5. **UI/UX:** Unified recap with driver-choice reconstruction and neutral feedback; high-level entry transitions no longer replay on mount ([SignalVsNoiseResults.tsx:57](../src/components/games/signal-vs-noise/SignalVsNoiseResults.tsx#L57)).
6. **Diversity:** Isolates a causal driver from messy observations and requires explanation, unlike Hidden Rule Lab’s active experimental testing.
7. **Action items:** Completed — stale final result, route mismatch, round locking, anti-repetition, quality bonus and failure-state XP.

## 8. Hidden Rule Lab — S2 / IN

1. **Status:** OK after fixes.
2. **Logic:** 12 rounds: discover, choose informative tests, lock a hypothesis, then generalize. A shared action lock covers every multi-step control and is released only at a valid transition ([HiddenRuleLabDrill.tsx:130](../src/components/games/hidden-rule-lab/HiddenRuleLabDrill.tsx#L130)).
3. **Scoring:** `45% rule identification + 35% test quality + 20% generalization`; redundant tests and hypothesis switching remain diagnostic. XP follows the shared performance curve plus the rare IN quality bonus ([HiddenRuleLabDrill.tsx:384](../src/components/games/hidden-rule-lab/HiddenRuleLabDrill.tsx#L384)).
4. **Metrics:** Persists as S2-IN / creativity / slow, including anti-repetition and quality metadata ([HiddenRuleLabRunner.tsx:107](../src/pages/app/HiddenRuleLabRunner.tsx#L107)).
5. **UI/UX:** Fixed an intro runtime reference to an unavailable `XP_BASE`; the estimate now comes from the shared XP engine. Results are unified and review weak tests plus transfer errors ([HiddenRuleLabResults.tsx:74](../src/components/games/hidden-rule-lab/HiddenRuleLabResults.tsx#L74)).
6. **Diversity:** Trains active hypothesis formation, information-gain test selection and transfer rather than passive signal identification.
7. **Action items:** Completed — runtime XP label, rapid multi-step submission, anti-repetition, safe delayed transitions and save-failure reset.

## Cross-drill coherence

### Fixed in this pass

1. Exactly eight drills remain exposed: two per AE, RA, CT and IN. Removed or legacy drills were not re-added.
2. All eight use one 0–100 score contract, one performance-sensitive 9–45 XP contract, one persistence boundary and one end-screen structure.
3. Quality bonuses are category-consistent: AE and RA reward stable high-quality execution, CT has no inflation by design, and IN has a rare micro-bonus.
4. Content anti-repetition is active in all six content-pack drills; exact combination hashes and fallback metadata are saved. Orbit Lock and Focus Switch remain procedurally stochastic.
5. User-facing training copy now says “drill(s)” rather than game/play terminology in Train-related recommendations, plans and summaries. Internal identifiers are intentionally unchanged.
6. Post-commit analytics failures can no longer cause the session retry loop to insert the same completed session twice ([useGamesGating.ts:712](../src/hooks/useGamesGating.ts#L712)).
7. S1 difficulty remains adaptive before the session: the shared engine recommends and locks difficulty from the user's current signals, while the selected level drives real changes in timing, density and/or control demands. Difficulty is intentionally stable during a running drill so the session score remains interpretable.
8. Every exit returns to the Train route with `system=fast|slow`; `GamesLibrary` reads that value and reopens the corresponding System 1/System 2 accordion ([GamesLibrary.tsx:91](../src/components/app/GamesLibrary.tsx#L91)).

### Formula decision retained

The audit brief mentions `0.65 + 0.35 × REC/100`. The application’s already-approved canonical formula is `0.75 + 0.25 × REC/100`, documented in `METRIC_INTEGRITY.md` and implemented once in `calculateSharpnessRecoveryModifier` ([cognitiveEngine.ts:145](../src/lib/cognitiveEngine.ts#L145)). This pass does not introduce a second conflicting recovery formula. Recovery affects availability/protection through gating and modulates Sharpness downstream; it does not secretly alter a drill’s raw task score.

### Remaining constraints / future hardening

1. **Cap concurrency:** cap checks and session insertion are client-side separate operations. Two truly simultaneous clients could pass the same pre-insert count. Closing this completely requires an atomic database function or constraint, which was intentionally out of scope because schema changes were prohibited.
2. **Near-duplicate semantics:** the current database stores hashes, not raw generation parameters. Exact recent combinations are rejected; the existing similarity function cannot compare historical raw parameters without a future schema/API change.
3. **Authenticated visual QA:** build and DOM guard rendering pass, but the isolated browser session reached the login screen. A final signed-in 393 px interaction sweep should be run in the Lovable preview before release; no credentials or auth behavior were changed for this audit.
4. **Repository lint baseline:** changed drill files have zero lint errors. The repository-wide lint command still reports pre-existing errors in unrelated legacy drills, payments, reports and UI utilities; they were not expanded into this focused pass.

## Verification

- `npm run test:drills` — pass
- `npm run test:metrics` — pass
- `npm run test:coach` — pass
- Targeted ESLint on every changed TypeScript file — zero errors
- `npm run build` — pass
