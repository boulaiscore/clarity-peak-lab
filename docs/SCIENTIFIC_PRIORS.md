# Scientific prior registry

## Purpose and boundary

LOOMA uses this registry to initialize a shadow prediction model before enough
within-person outcomes exist. The registry is not a medical model, a diagnostic
claim or a direct transcription of group-level research into a proprietary
0–100 score.

Published standardized effects are attenuated because LOOMA observes ordinary
day-to-day variation through consumer sensors, while many experiments compare
controlled sleep restriction or exercise conditions. The model then estimates
personal deviations prospectively. Missing data increase uncertainty; they do
not imply impaired performance.

Runtime version: `cognitive-priors-v2-2026-08`.

## Evidence map

| Signal | Empirical anchor | LOOMA interpretation |
| --- | --- | --- |
| Sleep duration | Lim & Dinges (2010), meta-analysis, PMID [20438143](https://pubmed.ncbi.nlm.nih.gov/20438143/); Lowe et al. (2024), meta-analysis, PMID [38759474](https://pubmed.ncbi.nlm.nih.gov/38759474/); Van Dongen et al. (2003), randomized dose-response study, PMID [12683469](https://pubmed.ncbi.nlm.nih.gov/12683469/) | Strongest prior for sustained attention. A smaller prior is used for executive outcomes because effects on reasoning, inhibition and working memory are less uniform. |
| HRV | Magnon et al. (2022), meta-analysis, PMID [36030561](https://pubmed.ncbi.nlm.nih.gov/36030561/); Holzman & Bridgett (2017), meta-analysis, PMID [28057463](https://pubmed.ncbi.nlm.nih.gov/28057463/) | Small, non-causal contextual prior. HRV is unavailable to the model until a personal baseline exists. |
| Acute activity | Chang et al. (2012), meta-analysis, PMID [22480735](https://pubmed.ncbi.nlm.nih.gov/22480735/) | Small positive prior. Timing, intensity and task type remain important unobserved moderators, so personal data may shrink or reverse it. |
| Attention interruptions | Stothart et al. (2015), experiment, PMID [26121498](https://pubmed.ncbi.nlm.nih.gov/26121498/) | Small attention-domain prior. Aggregate duration and fragmentation are observational proxies, not causal measures of cognition. |
| Consumer sleep sensing | Lee et al. (2024), meta-analysis against polysomnography, PMID [39484805](https://pubmed.ncbi.nlm.nih.gov/39484805/) | Sensor inputs are attenuated by measurement reliability and used longitudinally, not as clinical truth. |
| Calendar load | No transportable causal coefficient identified | Zero-centred proxy prior with strong shrinkage. It can become useful only through repeated personal outcomes. |

## Runtime coefficients

Coefficients are score-point changes per one standardized favourable feature
unit. A value of `+1` is approximately one within-person standard deviation
after baseline calibration. Population transforms are used only where the
literature supports a meaningful adequacy direction, chiefly sleep duration.

| Feature | Attention | Executive | Evidence treatment |
| --- | ---: | ---: | --- |
| Sleep duration | +4.8 | +1.2 | Stronger attention prior |
| Sleep consistency | +0.8 | +0.5 | Limited evidence; strong shrinkage |
| Sleep efficiency | +1.2 | +0.8 | Moderate/limited; sensor attenuation |
| HRV | +0.6 | +0.8 | Personal baseline only |
| Resting HR | +0.3 | +0.3 | Personal baseline only |
| Activity | +0.9 | +0.8 | Small acute average effect |
| Attention load | +1.2 | +0.7 | Higher feature means less overload |
| Digital fragmentation | +1.0 | +0.4 | Session/switch proxy; strong shrinkage |
| Schedule load | +0.1 | 0.0 | Proxy, effectively zero-centred |
| Previous same-domain outcome | +6.0 | +6.0 | Time-series persistence, not a causal health effect |

These coefficients live in `src/lib/scientificCognitivePriors.ts`. Any runtime
change must update this document, the version identifier and time-forward tests.

## Feature construction

- Sleep duration is selected once: wearable value first, Phone Health fallback.
- Sleep efficiency and bedtime consistency remain distinct signals.
- HRV and resting HR are never scored against population-wide absolute ranges;
  at least five prior readings are required for a robust personal baseline.
- Activity uses one available path in order: active minutes, steps, then the
  wearable activity score.
- Attention duration, fragmentation and schedule loads are measured against
  prior personal medians. Fragmentation averages session frequency, transitions
  back after another app and brief sessions; identities and sequences are discarded on-device.
  Below-baseline partial days are neutral rather than automatically beneficial.
- App names, event content, messages, domains and free text never enter the
  feature set.

## Learning and validation

Two ridge models are fit independently:

- **Attention:** AE/RA game outcomes plus valid focus-session continuity.
- **Executive:** CT/IN game outcomes.

Only earlier dates enter a forecast. Reliability attenuates noisy features.
Coefficients remain strongly shrunk toward the versioned priors until repeated
personal outcomes exist. Status is `learning` below 14 same-domain outcomes,
`emerging` from 14 to 44, and `personalized` from 45. A combined estimate is not
personalized until both domains reach that threshold.

Activation still requires prospective performance against no-change and fixed
formula baselines. Synthetic data may test invariants and missingness only; it
cannot count as validation evidence.
