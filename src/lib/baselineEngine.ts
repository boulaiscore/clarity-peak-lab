/**
 * Baseline Engine v1.3
 * 
 * Computes demographic and effective baselines for cognitive skill initialization.
 * 
 * RULES:
 * - If calibration COMPLETED: effective = λ × calibration + (1-λ) × demographic
 * - If calibration SKIPPED/NOT_STARTED: effective = demographic only
 * 
 * λ (LAMBDA) = 0.70 - Calibration weight
 * 
 * DEMOGRAPHIC CENTER FORMULA:
 * raw_center = 50 + age_adj + edu_adj + work_adj
 * baseline_demo_center = clamp(raw_center, 44, 56)
 */

import { clamp } from "@/lib/cognitiveEngine";

// Lambda: weight of calibration vs demographic baseline
export const CALIBRATION_LAMBDA = 0.70;

// Demographic baseline range
export const DEMO_CENTER_MIN = 44;
export const DEMO_CENTER_MAX = 56;

// ============================================
// TYPES
// ============================================

export type CalibrationStatus = "not_started" | "skipped" | "completed";

export interface DemographicInput {
  birthDate: string | null; // ISO date string or null
  age?: number | null; // Can also provide age directly
  educationLevel: string | null;
  workType: string | null;
}

export interface DemographicBaseline {
  center: number;
  AE: number;
  RA: number;
  CT: number;
  IN: number;
}

export interface CalibrationBaseline {
  AE: number;
  RA: number;
  CT: number;
  IN: number;
}

export interface EffectiveBaseline {
  AE: number;
  RA: number;
  CT: number;
  IN: number;
  isEstimated: boolean;
}

export interface BaselineComputeResult {
  demographic: DemographicBaseline;
  calibration: CalibrationBaseline | null;
  effective: EffectiveBaseline;
  calibrationStatus: CalibrationStatus;
}

// ============================================
// AGE ADJUSTMENT
// ============================================

/**
 * Compute age from birth date
 */
export function computeAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Age adjustment for demographic baseline
 * - age <= 30: +2
 * - 31-40: +1
 * - 41-55: 0
 * - 56+: -2
 */
export function getAgeAdjustment(age: number): number {
  if (age <= 30) return 2;
  if (age <= 40) return 1;
  if (age <= 55) return 0;
  return -2;
}

// ============================================
// EDUCATION ADJUSTMENT
// ============================================

/**
 * Education level adjustment
 * - High School: -1
 * - Bachelor's: 0
 * - Master's: +1
 * - PhD: +2
 * - Other/Prefer not to say: 0
 */
export function getEducationAdjustment(educationLevel: string | null): number {
  if (!educationLevel) return 0;
  
  const level = educationLevel.toLowerCase();
  
  if (level === "high_school" || level.includes("high school")) return -1;
  if (level === "bachelor" || level.includes("bachelor")) return 0;
  if (level === "master" || level.includes("master")) return 1;
  if (level === "phd" || level.includes("phd") || level.includes("doctorate")) return 2;
  
  return 0; // Other or unknown
}

// ============================================
// WORK TYPE ADJUSTMENT
// ============================================

/**
 * Work type adjustment
 * - Technical: +1
 * - Academic (student): +1
 * - Consulting/Analyst (knowledge): +1
 * - Leadership (management): 0
 * - Creative: 0
 * - Other: 0
 */
export function getWorkAdjustment(workType: string | null): number {
  if (!workType) return 0;
  
  const type = workType.toLowerCase();
  
  if (type === "technical" || type.includes("technical")) return 1;
  if (type === "student" || type.includes("academic") || type.includes("phd")) return 1;
  if (type === "knowledge" || type.includes("consulting") || type.includes("analyst")) return 1;
  if (type === "management" || type.includes("leadership")) return 0;
  if (type === "creative") return 0;
  
  return 0; // Other
}

// ============================================
// DEMOGRAPHIC BASELINE COMPUTATION
// ============================================

/**
 * Compute demographic baseline from user profile data
 */
export function computeDemographicBaseline(input: DemographicInput): DemographicBaseline {
  // Get age
  let age = input.age ?? null;
  if (!age && input.birthDate) {
    age = computeAge(input.birthDate);
  }
  age = age ?? 35; // Default age if not available
  
  // Compute adjustments
  const ageAdj = getAgeAdjustment(age);
  const eduAdj = getEducationAdjustment(input.educationLevel);
  const workAdj = getWorkAdjustment(input.workType);
  
  // Compute center
  const rawCenter = 50 + ageAdj + eduAdj + workAdj;
  const center = clamp(rawCenter, DEMO_CENTER_MIN, DEMO_CENTER_MAX);
  
  // For v1, all skills start at the same center
  return {
    center,
    AE: center,
    RA: center,
    CT: center,
    IN: center,
  };
}

// ============================================
// EFFECTIVE BASELINE COMPUTATION
// ============================================

/**
 * Compute effective baseline from demographic and calibration baselines
 * 
 * If calibration completed: effective = λ × cal + (1-λ) × demo
 * If calibration skipped/not_started: effective = demo
 */
export function computeEffectiveBaseline(
  demographic: DemographicBaseline,
  calibration: CalibrationBaseline | null,
  calibrationStatus: CalibrationStatus
): EffectiveBaseline {
  // If no calibration, use demographic only
  if (calibrationStatus !== "completed" || !calibration) {
    return {
      AE: demographic.AE,
      RA: demographic.RA,
      CT: demographic.CT,
      IN: demographic.IN,
      isEstimated: true,
    };
  }
  
  // Apply lambda mix: effective = λ × cal + (1-λ) × demo
  const lambda = CALIBRATION_LAMBDA;
  const oneMinusLambda = 1 - lambda;
  
  return {
    AE: Math.round(lambda * calibration.AE + oneMinusLambda * demographic.AE),
    RA: Math.round(lambda * calibration.RA + oneMinusLambda * demographic.RA),
    CT: Math.round(lambda * calibration.CT + oneMinusLambda * demographic.CT),
    IN: Math.round(lambda * calibration.IN + oneMinusLambda * demographic.IN),
    isEstimated: false,
  };
}

// ============================================
// FULL BASELINE COMPUTATION
// ============================================

/**
 * Compute full baseline result from all inputs
 */
export function computeBaselines(
  demographic: DemographicInput,
  calibration: CalibrationBaseline | null,
  calibrationStatus: CalibrationStatus
): BaselineComputeResult {
  const demo = computeDemographicBaseline(demographic);
  const effective = computeEffectiveBaseline(demo, calibration, calibrationStatus);
  
  return {
    demographic: demo,
    calibration,
    effective,
    calibrationStatus,
  };
}

// ============================================
// DATABASE MAPPING HELPERS
// ============================================

/**
 * Map profile data to demographic input
 */
export function mapProfileToDemographicInput(profile: {
  birth_date?: string | null;
  age?: number | null;
  education_level?: string | null;
  work_type?: string | null;
}): DemographicInput {
  return {
    birthDate: profile.birth_date ?? null,
    age: profile.age ?? null,
    educationLevel: profile.education_level ?? null,
    workType: profile.work_type ?? null,
  };
}

/**
 * Map drill scores to calibration baseline
 */
export function mapDrillScoresToCalibration(scores: {
  AE: number;
  RA: number;
  CT: number;
  IN: number;
}): CalibrationBaseline {
  return {
    AE: clamp(scores.AE, 0, 100),
    RA: clamp(scores.RA, 0, 100),
    CT: clamp(scores.CT, 0, 100),
    IN: clamp(scores.IN, 0, 100),
  };
}

/**
 * Prepare database upsert payload for baselines
 */
export function prepareBaselineDbPayload(result: BaselineComputeResult): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    // Demographic baselines
    baseline_demo_focus: result.demographic.AE,
    baseline_demo_fast_thinking: result.demographic.RA,
    baseline_demo_reasoning: result.demographic.CT,
    baseline_demo_slow_thinking: result.demographic.IN,
    
    // Effective baselines
    baseline_eff_focus: result.effective.AE,
    baseline_eff_fast_thinking: result.effective.RA,
    baseline_eff_reasoning: result.effective.CT,
    baseline_eff_slow_thinking: result.effective.IN,
    
    // Status
    calibration_status: result.calibrationStatus,
    baseline_is_estimated: result.effective.isEstimated,
    baseline_captured_at: new Date().toISOString(),
  };
  
  // Add calibration baselines only if completed
  if (result.calibration && result.calibrationStatus === "completed") {
    payload.baseline_cal_focus = result.calibration.AE;
    payload.baseline_cal_fast_thinking = result.calibration.RA;
    payload.baseline_cal_reasoning = result.calibration.CT;
    payload.baseline_cal_slow_thinking = result.calibration.IN;
    
    // Also set the legacy baseline columns for backward compatibility
    payload.baseline_focus = result.calibration.AE;
    payload.baseline_fast_thinking = result.calibration.RA;
    payload.baseline_reasoning = result.calibration.CT;
    payload.baseline_slow_thinking = result.calibration.IN;
  } else {
    // For skipped/not_started, use effective (demographic) values for legacy columns
    payload.baseline_focus = result.effective.AE;
    payload.baseline_fast_thinking = result.effective.RA;
    payload.baseline_reasoning = result.effective.CT;
    payload.baseline_slow_thinking = result.effective.IN;
  }
  
  return payload;
}

/**
 * Prepare initial skill values for first-time users
 * Skills are initialized to effective baseline
 */
export function prepareInitialSkillsPayload(effective: EffectiveBaseline): Record<string, number> {
  return {
    focus_stability: effective.AE,
    fast_thinking: effective.RA,
    reasoning_accuracy: effective.CT,
    slow_thinking: effective.IN,
  };
}
