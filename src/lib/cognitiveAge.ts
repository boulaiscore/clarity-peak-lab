import { differenceInCalendarDays, differenceInDays, parseISO } from "date-fns";

const DAYS_PER_YEAR = 365.25;
const POINTS_PER_YEAR = 10;
const INACTIVITY_GRACE_DAYS = 14;
const INACTIVITY_YEARS_PER_DAY = 0.05;
const INACTIVITY_MAX_YEARS = 6;
const LONG_INACTIVITY_FLOOR_DAYS = 45;

export function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateChronologicalAgeAtDate(params: {
  birthDate?: string | null;
  targetDate: Date | string;
  fallbackAge?: number | null;
  fallbackAnchorDate?: string | null;
  precision?: number;
}): number {
  const target = typeof params.targetDate === "string" ? parseISO(params.targetDate) : params.targetDate;

  if (params.birthDate) {
    const ageInDays = differenceInDays(target, parseISO(params.birthDate));
    return roundTo(ageInDays / DAYS_PER_YEAR, params.precision ?? 2);
  }

  const fallbackAge = params.fallbackAge ?? 30;
  if (params.fallbackAnchorDate) {
    const elapsedDays = Math.max(0, differenceInDays(target, parseISO(params.fallbackAnchorDate)));
    return roundTo(fallbackAge + elapsedDays / DAYS_PER_YEAR, params.precision ?? 2);
  }

  return roundTo(fallbackAge, params.precision ?? 2);
}

export function getInactiveDays(params: {
  lastMeaningfulActivityAt?: string | null;
  fallbackStartDate?: string | null;
  targetDate: Date | string;
}): number | null {
  const anchor = params.lastMeaningfulActivityAt ?? params.fallbackStartDate;
  if (!anchor) return null;

  const target = typeof params.targetDate === "string" ? parseISO(params.targetDate) : params.targetDate;
  return Math.max(0, differenceInCalendarDays(target, parseISO(anchor)));
}

export function calculateInactivityAgePenalty(inactiveDays: number | null | undefined): number {
  if (inactiveDays == null || inactiveDays <= INACTIVITY_GRACE_DAYS) return 0;
  return Math.min(INACTIVITY_MAX_YEARS, (inactiveDays - INACTIVITY_GRACE_DAYS) * INACTIVITY_YEARS_PER_DAY);
}

export function applyLongInactivityFloor(age: number, chronologicalAge: number, inactiveDays: number | null | undefined): number {
  if (inactiveDays == null || inactiveDays < LONG_INACTIVITY_FLOOR_DAYS) return age;
  const floorAboveChrono = Math.min(2, (inactiveDays - LONG_INACTIVITY_FLOOR_DAYS) / 90);
  return Math.max(age, chronologicalAge + floorAboveChrono);
}

export function calculateCognitiveAgeFromPerformance(params: {
  performance: number | null | undefined;
  baselinePerformance: number | null | undefined;
  chronologicalAge: number;
  rq?: number | null;
  regressionPenaltyYears?: number | null;
  inactiveDays?: number | null;
  capYears?: number;
  precision?: number;
}): number | null {
  if (params.performance == null || params.baselinePerformance == null) return null;

  const rq = params.rq ?? 50;
  const rqMultiplier = Math.max(0.85, Math.min(1, 0.85 + 0.15 * (rq / 100)));
  const improvement = params.performance - params.baselinePerformance;
  const performanceAgeDelta = -(improvement / POINTS_PER_YEAR) * rqMultiplier;
  const inactivityPenalty = calculateInactivityAgePenalty(params.inactiveDays);
  const regressionPenalty = params.regressionPenaltyYears ?? 0;

  const capYears = params.capYears ?? 15;
  const rawAge = params.chronologicalAge + performanceAgeDelta + regressionPenalty + inactivityPenalty;
  const flooredAge = applyLongInactivityFloor(rawAge, params.chronologicalAge, params.inactiveDays);
  const cappedAge = Math.max(params.chronologicalAge - capYears, Math.min(params.chronologicalAge + capYears, flooredAge));

  return roundTo(cappedAge, params.precision ?? 1);
}

export function maxIsoDate(dates: Array<string | null | undefined>): string | null {
  const validDates = dates.filter((date): date is string => Boolean(date));
  if (validDates.length === 0) return null;
  return validDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}