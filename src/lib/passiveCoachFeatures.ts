import {
  calculateReadiness,
  calculateSharpness,
  clamp,
} from "@/lib/cognitiveEngine";
import {
  estimateAdaptiveDailyState,
  type AdaptiveContextPoint,
  type AdaptiveMetricEstimate,
} from "@/lib/adaptiveMetricEstimator";
import {
  FEATURE_MEASUREMENT_RELIABILITY,
  SCIENTIFIC_PRIOR_VERSION,
  type AdaptiveFeatureId,
} from "@/lib/scientificCognitivePriors";
import {
  buildFocusIntegrityObservation,
  type FocusIntegrityObservation,
} from "@/lib/focusIntegrity";

export const PASSIVE_FEATURE_SCHEMA_VERSION = "passive-features-v6-scientific-priors";

type NullableNumber = number | null | undefined;

export interface PassiveMetricPoint {
  date: string;
  sharpness?: NullableNumber;
  readiness?: NullableNumber;
  recovery?: NullableNumber;
  reasoningQuality?: NullableNumber;
  AE?: NullableNumber;
  RA?: NullableNumber;
  CT?: NullableNumber;
  IN?: NullableNumber;
  S1?: NullableNumber;
  S2?: NullableNumber;
}

export interface PassiveCurrentMetrics {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  AE: number;
  RA: number;
  CT: number;
  IN: number;
  S1: number;
  S2: number;
  physioComponent: number | null;
  dailyState?: number;
  signalCoverage?: number;
}

export interface PassiveGameSession {
  completedAt: string;
  durationSeconds: number;
  score: number;
  skillRouted?: "AE" | "RA" | "CT" | "IN" | null;
}

export interface PassiveReasonSession {
  startedAt: string;
  durationSeconds: number;
  backgroundInterrupts: number;
  isValidForRq: boolean;
}

export interface PassiveRecoverySession {
  completedAt: string;
  durationMinutes: number;
}

export interface PassiveProductEvent {
  occurredAt: string;
}

export interface PassivePhoneHealthPoint {
  date: string;
  sleepMin: NullableNumber;
  bedtimeDeviationMin: NullableNumber;
  steps: NullableNumber;
  activeMinutes: NullableNumber;
  pickups: NullableNumber;
  phi: NullableNumber;
  confidence: NullableNumber;
  source: string | null;
}

export interface PassiveWearablePoint {
  date: string;
  hrvMs: NullableNumber;
  restingHr: NullableNumber;
  sleepDurationMin: NullableNumber;
  sleepEfficiency: NullableNumber;
  activityScore: NullableNumber;
  source: string | null;
}

export interface PassiveDeviceUsagePoint {
  date: string;
  attentionUsageMin: NullableNumber;
  activeAppCount: NullableNumber;
  lastAttentionUseAt: string | null;
  permissionState: "granted" | "limited" | "denied" | "unavailable";
  confidence: NullableNumber;
  source: "android_usage_stats" | "ios_device_activity";
  coverage: "attention_apps" | "screen_time_categories";
}

export interface PassiveCalendarPoint {
  date: string;
  busyMinutes: NullableNumber;
  meetingCount: NullableNumber;
  longestOpenStartMinute: NullableNumber;
  longestOpenMinutes: NullableNumber;
  permissionState: "granted" | "limited" | "denied" | "unavailable";
  confidence: number;
  source: "ios_eventkit" | "android_calendar";
}

export interface PassiveFeatureInput {
  featureDate: string;
  currentMetrics: PassiveCurrentMetrics;
  metricHistory: PassiveMetricPoint[];
  games: PassiveGameSession[];
  reasonSessions: PassiveReasonSession[];
  recoverySessions: PassiveRecoverySession[];
  productEvents: PassiveProductEvent[];
  phoneHealth: PassivePhoneHealthPoint[];
  wearable: PassiveWearablePoint[];
  deviceUsage: PassiveDeviceUsagePoint[];
  calendarContext: PassiveCalendarPoint[];
  primaryOutcome: string | null;
}

export interface PassiveCoachContext {
  metricTrendPerDay: number;
  skillTrendPerDay: Record<"AE" | "RA" | "CT" | "IN", number>;
  healthScore: number | null;
  attentionUsageMinutes: number | null;
  attentionUsageBaselineMinutes: number | null;
  attentionLoadRatio: number | null;
  scheduleBusyMinutes: number | null;
  scheduleLoadRatio: number | null;
  activeDays7d: number;
  dataCoverage: number;
}

export interface PassiveFeaturePayload {
  schemaVersion: typeof PASSIVE_FEATURE_SCHEMA_VERSION;
  metrics: Record<string, unknown>;
  behavior: Record<string, unknown>;
  health: Record<string, unknown>;
  deviceUsage: Record<string, unknown>;
  availability: Record<string, unknown>;
  coachContext: PassiveCoachContext;
  focusIntegrity: FocusIntegrityObservation;
  adaptiveEstimate: AdaptiveMetricEstimate & {
    projectedMetrics: {
      sharpness: number;
      readiness: number;
      recovery: number;
      reasoningQuality: number;
    };
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function finite(value: NullableNumber): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dateValue(value: string): number | null {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isWithinDays(value: string, endDate: string, days: number): boolean {
  const timestamp = dateValue(value);
  const end = dateValue(`${endDate}T23:59:59.999`);
  if (timestamp === null || end === null) return false;
  return timestamp >= end - days * DAY_MS && timestamp <= end;
}

function activeDays(values: string[], endDate: string, days: number): number {
  return new Set(
    values
      .filter((value) => isWithinDays(value, endDate, days))
      .map((value) => value.slice(0, 10)),
  ).size;
}

function mean(values: number[]): number | null {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function slopePerDay(
  points: PassiveMetricPoint[],
  key: keyof Omit<PassiveMetricPoint, "date">,
): number | null {
  const values = points.flatMap((point) => {
    const x = dateValue(point.date);
    const y = finite(point[key]);
    return x === null || y === null ? [] : [{ x: x / DAY_MS, y }];
  });
  if (values.length < 2) return null;

  const meanX = values.reduce((sum, point) => sum + point.x, 0) / values.length;
  const meanY = values.reduce((sum, point) => sum + point.y, 0) / values.length;
  const denominator = values.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (denominator === 0) return null;
  const numerator = values.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  return round(numerator / denominator, 3);
}

function latestByDate<T extends { date: string }>(values: T[]): T | null {
  return [...values].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function medianAbsoluteDeviation(values: number[], center: number): number {
  return median(values.map((value) => Math.abs(value - center))) ?? 0;
}

function personalSignalZ(
  value: number | null,
  history: Array<number | null>,
  direction: 1 | -1,
  minimumSpread: number,
): number | null {
  const current = finite(value);
  const prior = history.filter((item): item is number => item !== null && Number.isFinite(item));
  if (current === null || prior.length < 5) return null;
  const center = median(prior);
  if (center === null) return null;
  const robustSpread = Math.max(
    medianAbsoluteDeviation(prior, center) * 1.4826,
    minimumSpread,
  );
  const z = clamp((current - center) / robustSpread, -2, 2);
  return direction * z;
}

function blendPopulationAndPersonal(
  population: number | null,
  personal: number | null,
  populationWeight: number,
): number | null {
  if (population === null) return personal;
  if (personal === null) return clamp(population, -2, 2);
  return clamp(populationWeight * population + (1 - populationWeight) * personal, -2, 2);
}

function relativeLoadRatio(
  current: NullableNumber,
  prior: NullableNumber[],
  minimum: number,
): number | null {
  const value = finite(current);
  const baseline = median(prior.map(finite).filter((item): item is number => item !== null));
  if (value === null || baseline === null) return null;
  return clamp(value / Math.max(baseline, minimum), 0, 4);
}

function sleepEfficiencyFraction(value: NullableNumber): number | null {
  const parsed = finite(value);
  if (parsed === null) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

interface RawAdaptiveSignals {
  sleepDurationMin: number | null;
  sleepDurationFromWearable: boolean;
  bedtimeDeviationMin: number | null;
  sleepEfficiency: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  activityStandardized: number | null;
  activityFromWearable: boolean;
  attentionLoadRatio: number | null;
  scheduleLoadRatio: number | null;
  phoneConfidence: number;
  attentionConfidence: number;
  scheduleConfidence: number;
}

function rawSignalsForDate(input: PassiveFeatureInput, date: string): RawAdaptiveSignals {
  const phone = input.phoneHealth.find((point) => point.date === date);
  const wearable = input.wearable.find((point) => point.date === date);
  const device = input.deviceUsage.find((point) => point.date === date);
  const calendar = input.calendarContext.find((point) => point.date === date);
  const priorDevice = input.deviceUsage.filter((point) => point.date < date);
  const priorCalendar = input.calendarContext.filter((point) => point.date < date);
  const wearableSleep = finite(wearable?.sleepDurationMin);
  const phoneSleep = finite(phone?.sleepMin);
  const activeMinutes = finite(phone?.activeMinutes);
  const steps = finite(phone?.steps);
  const wearableActivity = finite(wearable?.activityScore);
  const activityStandardized = activeMinutes !== null
    ? clamp((Math.min(activeMinutes, 60) - 20) / 20, -2, 2)
    : steps !== null
      ? clamp((Math.min(steps, 10_000) - 4_000) / 3_000, -2, 2)
      : wearableActivity !== null
        ? clamp((wearableActivity - 50) / 25, -2, 2)
        : null;

  return {
    // One canonical duration observation: wearable first, phone fallback.
    sleepDurationMin: wearableSleep ?? phoneSleep,
    sleepDurationFromWearable: wearableSleep !== null,
    bedtimeDeviationMin: finite(phone?.bedtimeDeviationMin),
    sleepEfficiency: sleepEfficiencyFraction(wearable?.sleepEfficiency),
    hrvMs: finite(wearable?.hrvMs),
    restingHr: finite(wearable?.restingHr),
    activityStandardized,
    activityFromWearable: activeMinutes === null && steps === null && wearableActivity !== null,
    attentionLoadRatio: relativeLoadRatio(
      device?.attentionUsageMin,
      priorDevice.map((point) => point.attentionUsageMin),
      30,
    ),
    scheduleLoadRatio: relativeLoadRatio(
      calendar?.busyMinutes,
      priorCalendar.map((point) => point.busyMinutes),
      60,
    ),
    phoneConfidence: clamp(finite(phone?.confidence) ?? 0.6, 0, 1),
    attentionConfidence: clamp(finite(device?.confidence) ?? 0, 0, 1),
    scheduleConfidence: clamp(finite(calendar?.confidence) ?? 0, 0, 1),
  };
}

function standardizedFeatures(
  current: RawAdaptiveSignals,
  prior: RawAdaptiveSignals[],
): {
  features: AdaptiveContextPoint["features"];
  reliability: NonNullable<AdaptiveContextPoint["reliability"]>;
} {
  const sleepPopulation = current.sleepDurationMin === null
    ? null
    : clamp((Math.min(current.sleepDurationMin, 480) - 420) / 60, -2, 1);
  const sleepPersonal = personalSignalZ(
    current.sleepDurationMin,
    prior.map((row) => row.sleepDurationMin),
    1,
    45,
  );
  const consistencyPopulation = current.bedtimeDeviationMin === null
    ? null
    : clamp((45 - current.bedtimeDeviationMin) / 45, -2, 1);
  const consistencyPersonal = personalSignalZ(
    current.bedtimeDeviationMin,
    prior.map((row) => row.bedtimeDeviationMin),
    -1,
    15,
  );
  const efficiencyPopulation = current.sleepEfficiency === null
    ? null
    : clamp((current.sleepEfficiency - 0.85) / 0.07, -2, 1.5);
  const efficiencyPersonal = personalSignalZ(
    current.sleepEfficiency,
    prior.map((row) => row.sleepEfficiency),
    1,
    0.03,
  );
  const activityPersonal = personalSignalZ(
    current.activityStandardized,
    prior.map((row) => row.activityStandardized),
    1,
    0.4,
  );
  const features: AdaptiveContextPoint["features"] = {
    sleepDuration: blendPopulationAndPersonal(sleepPopulation, sleepPersonal, 0.75),
    sleepConsistency: blendPopulationAndPersonal(consistencyPopulation, consistencyPersonal, 0.6),
    sleepEfficiency: blendPopulationAndPersonal(efficiencyPopulation, efficiencyPersonal, 0.7),
    // No population-wide absolute HRV/RHR score: both wait for a personal baseline.
    hrv: personalSignalZ(current.hrvMs, prior.map((row) => row.hrvMs), 1, 5),
    restingHr: personalSignalZ(current.restingHr, prior.map((row) => row.restingHr), -1, 3),
    activity: blendPopulationAndPersonal(current.activityStandardized, activityPersonal, 0.6),
    // Lower-than-usual use/load is neutral; only overload becomes unfavourable.
    attentionLoad: current.attentionLoadRatio === null
      ? null
      : clamp(-Math.max(0, current.attentionLoadRatio - 1) / 0.5, -2, 0),
    scheduleLoad: current.scheduleLoadRatio === null
      ? null
      : clamp(-Math.max(0, current.scheduleLoadRatio - 1) / 0.75, -2, 0),
  };
  const reliability: Partial<Record<AdaptiveFeatureId, number>> = {
    sleepDuration: FEATURE_MEASUREMENT_RELIABILITY.sleepDuration *
      (current.sleepDurationFromWearable ? 1 : current.phoneConfidence),
    sleepConsistency: FEATURE_MEASUREMENT_RELIABILITY.sleepConsistency * current.phoneConfidence,
    sleepEfficiency: FEATURE_MEASUREMENT_RELIABILITY.sleepEfficiency,
    hrv: FEATURE_MEASUREMENT_RELIABILITY.hrv,
    restingHr: FEATURE_MEASUREMENT_RELIABILITY.restingHr,
    activity: FEATURE_MEASUREMENT_RELIABILITY.activity *
      (current.activityFromWearable ? 1 : current.phoneConfidence),
    attentionLoad: FEATURE_MEASUREMENT_RELIABILITY.attentionLoad * current.attentionConfidence,
    scheduleLoad: FEATURE_MEASUREMENT_RELIABILITY.scheduleLoad * current.scheduleConfidence,
  };
  (Object.keys(reliability) as AdaptiveFeatureId[]).forEach((id) => {
    if (features[id] === null || features[id] === undefined) delete reliability[id];
    else reliability[id] = round(clamp(reliability[id] ?? 0, 0, 1), 4);
  });
  return { features, reliability };
}

function buildAdaptiveContextPoints(input: PassiveFeatureInput): AdaptiveContextPoint[] {
  const dates = new Set<string>([
    input.featureDate,
    ...input.metricHistory.map((point) => point.date),
    ...input.phoneHealth.map((point) => point.date),
    ...input.wearable.map((point) => point.date),
    ...input.deviceUsage.map((point) => point.date),
    ...input.calendarContext.map((point) => point.date),
    ...input.games.map((session) => session.completedAt.slice(0, 10)),
    ...input.reasonSessions.map((session) => session.startedAt.slice(0, 10)),
  ]);

  const orderedDates = [...dates]
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= input.featureDate)
    .sort();
  const rawByDate = new Map(orderedDates.map((date) => [date, rawSignalsForDate(input, date)]));

  return orderedDates.map((date) => {
      const device = input.deviceUsage.find((point) => point.date === date);
      const dailyGames = input.games
        .filter((session) => session.completedAt.slice(0, 10) === date);
      const dailyReasons = input.reasonSessions
        .filter((session) => session.startedAt.slice(0, 10) === date && session.isValidForRq);
      const attentionGameScores = dailyGames
        .filter((session) => session.skillRouted === "AE" || session.skillRouted === "RA")
        .map((session) => clamp(session.score, 0, 100));
      const executiveGameScores = dailyGames
        .filter((session) => session.skillRouted === "CT" || session.skillRouted === "IN")
        .map((session) => clamp(session.score, 0, 100));
      const focusScores = dailyReasons
        .map((session) => clamp(
          50 + Math.min(18, session.durationSeconds / 120) - session.backgroundInterrupts * 8,
        , 0, 100));
      const earliestOutcomeAt = [
        ...dailyGames.map((session) => {
          const completedAt = dateValue(session.completedAt);
          return completedAt === null ? null : completedAt - session.durationSeconds * 1000;
        }),
        ...dailyReasons.map((session) => dateValue(session.startedAt)),
      ].filter((value): value is number => value !== null)
        .sort((a, b) => a - b)[0] ?? null;
      const lastAttentionUseAt = device?.lastAttentionUseAt
        ? dateValue(device.lastAttentionUseAt)
        : null;
      // A final daily usage aggregate can include activity after a drill and
      // would leak the outcome's future into model training. Historical
      // attention is eligible only when its last captured use predates the
      // first outcome. Today's unevaluated estimate can use current usage.
      const attentionObservedBeforeOutcome = date === input.featureDate || earliestOutcomeAt === null
        ? true
        : lastAttentionUseAt !== null && lastAttentionUseAt <= earliestOutcomeAt;
      const currentRaw = rawByDate.get(date) as RawAdaptiveSignals;
      if (!attentionObservedBeforeOutcome) {
        currentRaw.attentionLoadRatio = null;
        currentRaw.attentionConfidence = 0;
      }
      const priorRaw = orderedDates
        .filter((priorDate) => priorDate < date)
        .map((priorDate) => rawByDate.get(priorDate) as RawAdaptiveSignals);
      const normalized = standardizedFeatures(currentRaw, priorRaw);
      return {
        date,
        features: normalized.features,
        reliability: normalized.reliability,
        outcomes: {
          attention: mean([...attentionGameScores, ...focusScores]),
          executive: mean(executiveGameScores),
        },
      };
    });
}

/**
 * Creates one explainable, privacy-safe daily feature bundle. Raw app/package
 * identifiers, content and free text are intentionally absent from the input
 * contract, so they cannot accidentally reach the cloud snapshot.
 */
export function buildPassiveFeaturePayload(input: PassiveFeatureInput): PassiveFeaturePayload {
  const history14d = input.metricHistory.filter((point) =>
    isWithinDays(point.date, input.featureDate, 14),
  );
  const metricTrend = {
    sharpness: slopePerDay(history14d, "sharpness"),
    readiness: slopePerDay(history14d, "readiness"),
    recovery: slopePerDay(history14d, "recovery"),
    reasoningQuality: slopePerDay(history14d, "reasoningQuality"),
    AE: slopePerDay(history14d, "AE"),
    RA: slopePerDay(history14d, "RA"),
    CT: slopePerDay(history14d, "CT"),
    IN: slopePerDay(history14d, "IN"),
  };
  const combinedMetricTrend = mean(
    [metricTrend.sharpness, metricTrend.readiness, metricTrend.reasoningQuality]
      .filter((value): value is number => value !== null),
  ) ?? 0;

  const games7d = input.games.filter((session) =>
    isWithinDays(session.completedAt, input.featureDate, 7),
  );
  const reason7d = input.reasonSessions.filter((session) =>
    isWithinDays(session.startedAt, input.featureDate, 7),
  );
  const recovery7d = input.recoverySessions.filter((session) =>
    isWithinDays(session.completedAt, input.featureDate, 7),
  );
  const product7d = input.productEvents.filter((event) =>
    isWithinDays(event.occurredAt, input.featureDate, 7),
  );
  const behaviorDates = [
    ...games7d.map((session) => session.completedAt),
    ...reason7d.map((session) => session.startedAt),
    ...recovery7d.map((session) => session.completedAt),
  ];
  const activeDays7d = activeDays(behaviorDates, input.featureDate, 7);

  const latestPhone = latestByDate(input.phoneHealth);
  const latestWearable = latestByDate(input.wearable);
  const healthScore = finite(latestPhone?.phi) ?? finite(input.currentMetrics.physioComponent);

  const currentDevice = input.deviceUsage.find((point) => point.date === input.featureDate)
    ?? latestByDate(input.deviceUsage);
  const priorAttentionMinutes = input.deviceUsage.flatMap((point) => {
    const value = finite(point.attentionUsageMin);
    if (point.date === input.featureDate || value === null) return [];
    return isWithinDays(point.date, input.featureDate, 14) ? [value] : [];
  });
  const attentionUsageMinutes = finite(currentDevice?.attentionUsageMin);
  const attentionUsageBaselineMinutes = median(priorAttentionMinutes);
  const attentionLoadRatio = attentionUsageMinutes !== null && attentionUsageBaselineMinutes !== null
    ? attentionUsageBaselineMinutes > 0
      ? round(clamp(attentionUsageMinutes / attentionUsageBaselineMinutes, 0, 4), 3)
      : attentionUsageMinutes === 0 ? 1 : null
    : null;

  const currentCalendar = input.calendarContext.find((point) => point.date === input.featureDate)
    ?? latestByDate(input.calendarContext);
  const priorBusyMinutes = input.calendarContext.flatMap((point) => {
    const value = finite(point.busyMinutes);
    if (point.date === input.featureDate || value === null) return [];
    return isWithinDays(point.date, input.featureDate, 14) ? [value] : [];
  });
  const scheduleBusyMinutes = finite(currentCalendar?.busyMinutes);
  const scheduleBusyBaselineMinutes = median(priorBusyMinutes);
  const scheduleLoadRatio = scheduleBusyMinutes !== null && scheduleBusyBaselineMinutes !== null
    ? scheduleBusyBaselineMinutes > 0
      ? round(clamp(scheduleBusyMinutes / scheduleBusyBaselineMinutes, 0, 4), 3)
      : scheduleBusyMinutes === 0 ? 1 : null
    : null;

  const focusIntegrity = buildFocusIntegrityObservation({
    attentionLoadRatio,
    attentionBaselineDays: priorAttentionMinutes.length,
    attentionConfidence: finite(currentDevice?.confidence),
    sessions: reason7d
      .filter((session) => session.startedAt.slice(0, 10) === input.featureDate)
      .map((session) => ({
        durationSeconds: session.durationSeconds,
        backgroundInterrupts: session.backgroundInterrupts,
        isValid: session.isValidForRq,
      })),
  });

  const metricsCoverage = clamp(history14d.length / 7, 0, 1);
  const behaviorCoverage = clamp(activeDays7d / 4, 0, 1);
  const healthCoverage = healthScore === null ? 0 : 1;
  const deviceCoverage = attentionUsageMinutes === null ? 0 : 1;
  const calendarCoverage = scheduleBusyMinutes === null ? 0 : 1;
  const dataCoverage = round(
    0.3 * metricsCoverage +
      0.1 * behaviorCoverage +
      0.25 * healthCoverage +
      0.15 * deviceCoverage +
      0.2 * calendarCoverage,
    4,
  );
  const fixedDailyState = input.currentMetrics.dailyState ?? 50;
  const adaptiveBase = estimateAdaptiveDailyState({
    points: buildAdaptiveContextPoints(input),
    currentDate: input.featureDate,
    fixedDailyState,
  });
  const states = {
    AE: input.currentMetrics.AE,
    RA: input.currentMetrics.RA,
    CT: input.currentMetrics.CT,
    IN: input.currentMetrics.IN,
  };
  const fixedCoverage = clamp(input.currentMetrics.signalCoverage ?? dataCoverage, 0, 1);
  // Shadow projections earn influence only as both source coverage and
  // time-forward outcome evidence increase.
  const adaptiveCoverage = Math.min(fixedCoverage, adaptiveBase.confidence);
  const attentionCoverage = Math.min(
    fixedCoverage,
    adaptiveBase.domains.attention.confidence,
  );
  const readinessState =
    0.35 * adaptiveBase.domains.attention.predictedScore +
    0.65 * adaptiveBase.domains.executive.predictedScore;
  const fixedReadiness = calculateReadiness(states, input.currentMetrics.recovery, {
    score: fixedDailyState,
    coverage: fixedCoverage,
  });
  const adaptiveReadiness = calculateReadiness(states, input.currentMetrics.recovery, {
    score: readinessState,
    coverage: adaptiveCoverage,
  });
  const adaptiveEstimate: PassiveFeaturePayload["adaptiveEstimate"] = {
    ...adaptiveBase,
    projectedMetrics: {
      sharpness: calculateSharpness(states, input.currentMetrics.recovery, {
        score: adaptiveBase.domains.attention.predictedScore,
        coverage: attentionCoverage,
      }),
      readiness: round(clamp(
        input.currentMetrics.readiness + adaptiveReadiness - fixedReadiness,
      ), 1),
      recovery: round(input.currentMetrics.recovery, 1),
      reasoningQuality: round(input.currentMetrics.reasoningQuality, 1),
    },
  };

  return {
    schemaVersion: PASSIVE_FEATURE_SCHEMA_VERSION,
    metrics: {
      current: input.currentMetrics,
      trendPerDay14d: metricTrend,
      historyDays14d: new Set(history14d.map((point) => point.date)).size,
      scientificPriorVersion: SCIENTIFIC_PRIOR_VERSION,
      adaptiveStateEstimate: adaptiveEstimate,
    },
    behavior: {
      primaryOutcome: input.primaryOutcome,
      gameSessions7d: games7d.length,
      gameMinutes7d: round(games7d.reduce((sum, session) => sum + session.durationSeconds, 0) / 60, 1),
      averageGameScore7d: mean(games7d.map((session) => session.score).filter(Number.isFinite)),
      qualityTimeMinutes7d: round(reason7d.reduce((sum, session) => sum + session.durationSeconds, 0) / 60, 1),
      validQualitySessions7d: reason7d.filter((session) => session.isValidForRq).length,
      backgroundInterrupts7d: reason7d.reduce((sum, session) => sum + session.backgroundInterrupts, 0),
      recoveryMinutes7d: round(recovery7d.reduce((sum, session) => sum + session.durationMinutes, 0), 1),
      productEvents7d: product7d.length,
      productActiveDays7d: activeDays(product7d.map((event) => event.occurredAt), input.featureDate, 7),
      cognitiveActivityDays7d: activeDays7d,
    },
    health: {
      phone: latestPhone ? {
        date: latestPhone.date,
        sleepMin: finite(latestPhone.sleepMin),
        bedtimeDeviationMin: finite(latestPhone.bedtimeDeviationMin),
        steps: finite(latestPhone.steps),
        activeMinutes: finite(latestPhone.activeMinutes),
        pickups: finite(latestPhone.pickups),
        phi: finite(latestPhone.phi),
        confidence: finite(latestPhone.confidence),
        source: latestPhone.source,
      } : null,
      wearable: latestWearable ? {
        date: latestWearable.date,
        hrvMs: finite(latestWearable.hrvMs),
        restingHr: finite(latestWearable.restingHr),
        sleepDurationMin: finite(latestWearable.sleepDurationMin),
        sleepEfficiency: finite(latestWearable.sleepEfficiency),
        activityScore: finite(latestWearable.activityScore),
        source: latestWearable.source,
      } : null,
      normalizedHealthScore: healthScore,
    },
    deviceUsage: {
      attentionUsageMin: attentionUsageMinutes,
      personalMedian14d: attentionUsageBaselineMinutes === null
        ? null
        : round(attentionUsageBaselineMinutes, 1),
      relativeToPersonalBaseline: attentionLoadRatio,
      activeAppCount: finite(currentDevice?.activeAppCount),
      lastAttentionUseAt: currentDevice?.lastAttentionUseAt ?? null,
      permissionState: currentDevice?.permissionState ?? "unavailable",
      confidence: finite(currentDevice?.confidence),
      source: currentDevice?.source ?? null,
      coverage: currentDevice?.coverage ?? null,
      privacyLevel: "aggregate_only_no_app_names_or_content",
      calendar: currentCalendar ? {
        date: currentCalendar.date,
        busyMinutes: scheduleBusyMinutes,
        personalMedian14d: scheduleBusyBaselineMinutes,
        relativeToPersonalBaseline: scheduleLoadRatio,
        meetingCount: finite(currentCalendar.meetingCount),
        longestOpenStartMinute: finite(currentCalendar.longestOpenStartMinute),
        longestOpenMinutes: finite(currentCalendar.longestOpenMinutes),
        permissionState: currentCalendar.permissionState,
        confidence: finite(currentCalendar.confidence),
        source: currentCalendar.source,
        privacyLevel: "aggregate_only_no_event_content",
      } : null,
    },
    availability: {
      metricsHistory: history14d.length >= 2,
      firstPartyBehavior: behaviorDates.length > 0 || product7d.length > 0,
      phoneHealth: latestPhone !== null,
      wearable: latestWearable !== null,
      deviceUsage: attentionUsageMinutes !== null,
      calendar: currentCalendar !== null,
      focusIntegrity: focusIntegrity.isEvaluable,
      coverage: dataCoverage,
    },
    coachContext: {
      metricTrendPerDay: round(combinedMetricTrend, 3),
      skillTrendPerDay: {
        AE: metricTrend.AE ?? 0,
        RA: metricTrend.RA ?? 0,
        CT: metricTrend.CT ?? 0,
        IN: metricTrend.IN ?? 0,
      },
      healthScore: healthScore === null ? null : round(healthScore, 2),
      attentionUsageMinutes,
      attentionUsageBaselineMinutes: attentionUsageBaselineMinutes === null
        ? null
        : round(attentionUsageBaselineMinutes, 1),
      attentionLoadRatio,
      scheduleBusyMinutes,
      scheduleLoadRatio,
      activeDays7d,
      dataCoverage,
    },
    focusIntegrity,
    adaptiveEstimate,
  };
}
