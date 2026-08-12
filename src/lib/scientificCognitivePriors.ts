/**
 * Versioned, literature-informed priors for the shadow cognitive-state model.
 *
 * Coefficients are conservative score-point changes per one standardized,
 * favourably-oriented feature unit. They are not direct clinical effect sizes:
 * published effects are attenuated before use because LOOMA observes everyday
 * within-person variation through consumer sensors rather than controlled
 * experimental contrasts.
 */

export const SCIENTIFIC_PRIOR_VERSION = "cognitive-priors-v2-2026-08";

export const ADAPTIVE_FEATURE_IDS = [
  "sleepDuration",
  "sleepConsistency",
  "sleepEfficiency",
  "hrv",
  "restingHr",
  "activity",
  "attentionLoad",
  "digitalFragmentation",
  "scheduleLoad",
] as const;

export type AdaptiveFeatureId = typeof ADAPTIVE_FEATURE_IDS[number];
export type AdaptiveDomain = "attention" | "executive";

export interface ScientificFeaturePrior {
  /** Score-point change for one standardized favourable feature unit. */
  coefficient: number;
  /** Ridge penalty toward the prior; weak/indirect evidence shrinks harder. */
  regularization: number;
  evidence: "strong" | "moderate" | "limited" | "proxy";
}

export interface ScientificDomainPrior {
  intercept: number;
  persistence: ScientificFeaturePrior;
  features: Record<AdaptiveFeatureId, ScientificFeaturePrior>;
}

const prior = (
  coefficient: number,
  regularization: number,
  evidence: ScientificFeaturePrior["evidence"],
): ScientificFeaturePrior => ({ coefficient, regularization, evidence });

/**
 * The sleep-attention contrast is deliberately the strongest prior. Executive
 * effects are smaller because controlled sleep-loss findings are less uniform
 * for working memory, inhibition and reasoning than for sustained attention.
 * HRV, activity and digital context start close to zero and must earn larger
 * personal effects from time-forward outcomes.
 */
export const SCIENTIFIC_DOMAIN_PRIORS: Record<AdaptiveDomain, ScientificDomainPrior> = {
  attention: {
    intercept: 50,
    persistence: prior(6.0, 10, "moderate"),
    features: {
      sleepDuration: prior(4.8, 14, "strong"),
      sleepConsistency: prior(0.8, 24, "limited"),
      sleepEfficiency: prior(1.2, 20, "moderate"),
      hrv: prior(0.6, 30, "limited"),
      restingHr: prior(0.3, 32, "limited"),
      activity: prior(0.9, 22, "moderate"),
      attentionLoad: prior(1.2, 24, "moderate"),
      digitalFragmentation: prior(1.0, 30, "limited"),
      scheduleLoad: prior(0.1, 40, "proxy"),
    },
  },
  executive: {
    intercept: 50,
    persistence: prior(6.0, 10, "moderate"),
    features: {
      sleepDuration: prior(1.2, 22, "moderate"),
      sleepConsistency: prior(0.5, 28, "limited"),
      sleepEfficiency: prior(0.8, 24, "limited"),
      hrv: prior(0.8, 30, "limited"),
      restingHr: prior(0.3, 34, "limited"),
      activity: prior(0.8, 24, "moderate"),
      attentionLoad: prior(0.7, 28, "limited"),
      digitalFragmentation: prior(0.4, 36, "proxy"),
      scheduleLoad: prior(0.0, 44, "proxy"),
    },
  },
};

/**
 * Conservative design reliabilities, used only to attenuate a standardized
 * feature and its coverage. These are not claims of diagnostic accuracy.
 */
export const FEATURE_MEASUREMENT_RELIABILITY: Record<AdaptiveFeatureId, number> = {
  sleepDuration: 0.75,
  sleepConsistency: 0.65,
  sleepEfficiency: 0.60,
  hrv: 0.55,
  restingHr: 0.80,
  activity: 0.75,
  attentionLoad: 0.70,
  digitalFragmentation: 0.65,
  scheduleLoad: 0.85,
};

export const SCIENTIFIC_EVIDENCE_REFERENCES = [
  {
    id: "sleep-total-deprivation-2010",
    pmid: "20438143",
    url: "https://pubmed.ncbi.nlm.nih.gov/20438143/",
    supports: ["sleepDuration", "attention"] as const,
  },
  {
    id: "sleep-restriction-2024",
    pmid: "38759474",
    url: "https://pubmed.ncbi.nlm.nih.gov/38759474/",
    supports: ["sleepDuration", "attention"] as const,
  },
  {
    id: "chronic-sleep-restriction-2003",
    pmid: "12683469",
    url: "https://pubmed.ncbi.nlm.nih.gov/12683469/",
    supports: ["sleepDuration", "persistence"] as const,
  },
  {
    id: "hrv-executive-2022",
    pmid: "36030561",
    url: "https://pubmed.ncbi.nlm.nih.gov/36030561/",
    supports: ["hrv", "executive"] as const,
  },
  {
    id: "acute-exercise-2012",
    pmid: "22480735",
    url: "https://pubmed.ncbi.nlm.nih.gov/22480735/",
    supports: ["activity", "attention", "executive"] as const,
  },
  {
    id: "phone-notification-2015",
    pmid: "26121498",
    url: "https://pubmed.ncbi.nlm.nih.gov/26121498/",
    supports: ["attentionLoad", "attention"] as const,
  },
  {
    id: "wearable-sleep-validation-2024",
    pmid: "39484805",
    url: "https://pubmed.ncbi.nlm.nih.gov/39484805/",
    supports: ["sleepDuration", "sleepEfficiency", "measurement"] as const,
  },
] as const;
