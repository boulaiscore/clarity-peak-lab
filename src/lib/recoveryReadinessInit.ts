/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY READINESS INIT (RRI)
 * ============================================
 * 
 * RRI is a TEMPORARY estimate used ONLY at the beginning,
 * before real recovery data (detox / walk) exists.
 * 
 * Base value: RRI_base = 35
 * 
 * Additive rules:
 * - Sleep (Q1): ≥7h → +8, 6-7h → +4, <6h → +0
 * - Detox (Q2): ≥1h → +6, 30-60min → +3, <30min → +0
 * - Mental State (Q3): Clear/Very clear → +4, OK → +2, Tired → +0
 * 
 * Final clamp: RRI = clamp(35, 55)
 * 
 * RRI validity:
 * - Until first detox or walk
 * - OR max 72 hours after onboarding
 */

// Sleep hours options
export type RRISleepHours = '<5h' | '5-6h' | '6-7h' | '7-8h' | '>8h';

// Detox hours options (longest continuous offline period in last 2 days)
export type RRIDetoxHours = 'almost_none' | '<30min' | '30-60min' | '1-2h' | '>2h';

// Mental state options
export type RRIMentalState = 'very_tired' | 'bit_tired' | 'ok' | 'clear' | 'very_clear';

export interface RRIInputs {
  sleepHours: RRISleepHours;
  detoxHours: RRIDetoxHours;
  mentalState: RRIMentalState;
}

export interface RRIResult {
  value: number;
  breakdown: {
    base: number;
    sleepBonus: number;
    detoxBonus: number;
    mentalStateBonus: number;
  };
}

const RRI_BASE = 35;
const RRI_MIN = 35;
const RRI_MAX = 55;

// RRI validity duration in milliseconds (72 hours)
export const RRI_VALIDITY_MS = 72 * 60 * 60 * 1000;

/**
 * Get sleep bonus based on reported sleep hours
 * ≥7 hours → +8
 * 6-7 hours → +4
 * <6 hours → +0
 */
function getSleepBonus(sleepHours: RRISleepHours): number {
  switch (sleepHours) {
    case '>8h':
    case '7-8h':
      return 8;
    case '6-7h':
      return 4;
    case '5-6h':
    case '<5h':
    default:
      return 0;
  }
}

/**
 * Get detox bonus based on longest continuous offline period
 * ≥1 hour → +6
 * 30-60 min → +3
 * <30 min → +0
 */
function getDetoxBonus(detoxHours: RRIDetoxHours): number {
  switch (detoxHours) {
    case '>2h':
    case '1-2h':
      return 6;
    case '30-60min':
      return 3;
    case '<30min':
    case 'almost_none':
    default:
      return 0;
  }
}

/**
 * Get mental state bonus
 * Clear OR Very clear → +4
 * OK → +2
 * Tired → +0
 */
function getMentalStateBonus(mentalState: RRIMentalState): number {
  switch (mentalState) {
    case 'very_clear':
    case 'clear':
      return 4;
    case 'ok':
      return 2;
    case 'bit_tired':
    case 'very_tired':
    default:
      return 0;
  }
}

/**
 * Compute RRI (Recovery Readiness Init) from onboarding answers
 * Returns clamped value between 35-55
 */
export function computeRRI(inputs: RRIInputs): RRIResult {
  const sleepBonus = getSleepBonus(inputs.sleepHours);
  const detoxBonus = getDetoxBonus(inputs.detoxHours);
  const mentalStateBonus = getMentalStateBonus(inputs.mentalState);
  
  const rawValue = RRI_BASE + sleepBonus + detoxBonus + mentalStateBonus;
  const value = Math.max(RRI_MIN, Math.min(RRI_MAX, rawValue));
  
  return {
    value,
    breakdown: {
      base: RRI_BASE,
      sleepBonus,
      detoxBonus,
      mentalStateBonus,
    },
  };
}

/**
 * Check if RRI is still valid (not expired)
 * RRI expires 72 hours after being set OR after first real recovery data
 */
export function isRRIValid(rriSetAt: Date | string | null): boolean {
  if (!rriSetAt) return false;
  
  const setTime = typeof rriSetAt === 'string' ? new Date(rriSetAt) : rriSetAt;
  const now = new Date();
  const elapsed = now.getTime() - setTime.getTime();
  
  return elapsed < RRI_VALIDITY_MS;
}

/**
 * Display labels for UI
 */
export const RRI_SLEEP_OPTIONS: { value: RRISleepHours; label: string }[] = [
  { value: '<5h', label: '< 5 hours' },
  { value: '5-6h', label: '5–6 hours' },
  { value: '6-7h', label: '6–7 hours' },
  { value: '7-8h', label: '7–8 hours' },
  { value: '>8h', label: '> 8 hours' },
];

export const RRI_DETOX_OPTIONS: { value: RRIDetoxHours; label: string; description: string }[] = [
  { value: 'almost_none', label: 'Almost none', description: 'Very little intentional offline time' },
  { value: '<30min', label: '< 30 minutes', description: 'Brief periods only' },
  { value: '30-60min', label: '30–60 minutes', description: 'Short but intentional' },
  { value: '1-2h', label: '1–2 hours', description: 'Moderate offline period' },
  { value: '>2h', label: '> 2 hours', description: 'Extended digital detox' },
];

export const RRI_MENTAL_STATE_OPTIONS: { value: RRIMentalState; label: string }[] = [
  { value: 'very_tired', label: 'Very tired' },
  { value: 'bit_tired', label: 'A bit tired' },
  { value: 'ok', label: 'OK' },
  { value: 'clear', label: 'Clear' },
  { value: 'very_clear', label: 'Very clear' },
];
