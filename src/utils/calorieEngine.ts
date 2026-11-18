/**
 * Kinetix Universal Calorie & Energy Expenditure Engine
 *
 * Implements clinical formulas based on the 2024 Compendium of Physical Activities
 * (Ainsworth et al.) and mechanical work efficiency models.
 *
 * Standard MET Formula:
 *   Energy Expenditure (kcal/min) = (MET * 3.5 * BodyMass_kg) / 200
 *
 * Covers:
 *  - Resistance training (compound, isolation, bodyweight)
 *  - Mechanical external load adjustments (dumbbells, barbells, kettlebells)
 *  - Clinical rehabilitation, postural motor control & isometric holds
 *  - Inter-set and transition rest intervals (EPOC elevation)
 *  - Manual collective sports (soccer, volleyball, basketball, tennis, etc.)
 *  - Timestamp interval energy expenditure for smartwatch data matching
 */

import { Exercise, WorksessionExercise } from '../types/database';

export const DEFAULT_USER_WEIGHT_KG = 75; // 165 lbs standard clinical baseline
export const REST_EPOC_MET = 1.6; // Elevated post-exercise recovery metabolic rate

export interface CalorieUserBiometrics {
  currentWeight?: number | string | null;
  weightUnit?: 'kg' | 'lbs' | string | null;
}

/**
 * Normalizes user body weight from profile into kilograms.
 * Defaults to 75 kg if unspecified or invalid.
 */
export function getUserWeightKg(profile?: CalorieUserBiometrics | null): number {
  if (!profile || profile.currentWeight == null) return DEFAULT_USER_WEIGHT_KG;
  const num = typeof profile.currentWeight === 'number' ? profile.currentWeight : parseFloat(String(profile.currentWeight));
  if (isNaN(num) || num <= 0) return DEFAULT_USER_WEIGHT_KG;
  const unit = (profile.weightUnit || 'kg').toLowerCase();
  if (unit === 'lbs' || unit === 'lb') {
    return Math.round(num * 0.45359237 * 10) / 10;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Compendium MET Lookup Table for manual sports and collective activities.
 */
export const SPORTS_MET_TABLE: Record<string, number> = {
  // Collective & Ball Sports
  'soccer': 8.5,
  'football': 8.5,
  'futsal': 8.0,
  'volleyball': 4.5,
  'beach volleyball': 8.0,
  'volleyball (beach)': 8.0,
  'basketball': 7.5,
  'tennis': 7.3,
  'padel': 6.5,
  'pickleball': 5.8,
  'badminton': 5.5,
  'handball': 8.0,
  'rugby': 8.5,
  'hockey': 8.0,
  'water polo': 10.0,
  'baseball': 5.0,
  'softball': 5.0,
  'cricket': 5.0,
  'squash': 10.0,
  'table tennis': 4.0,

  // Endurance & Conditioning
  'running': 9.8,
  'jogging': 7.5,
  'cycling': 7.0,
  'swimming': 7.5,
  'rowing': 7.0,
  'jump rope': 11.0,
  'hiking': 5.5,
  'walking': 3.8,

  // Fitness & Combat
  'boxing': 9.0,
  'kickboxing': 9.5,
  'martial arts': 9.0,
  'bjj': 9.5,
  'judo': 9.5,
  'wrestling': 9.5,
  'hiit': 8.5,
  'crossfit': 8.5,
  'strength training': 5.0,
  'weightlifting': 5.5,
  'calisthenics': 4.8,
  'pilates': 3.2,
  'yoga': 2.8,
  'mobility': 2.5,
  'stretching': 2.2,
  'core rehab': 3.5,
  'rehabilitation': 3.2,
};

/**
 * Resolves the appropriate MET for any exercise based on explicit met_value,
 * exercise mechanics, category, and exercise name semantics.
 */
export function resolveExerciseMET(
  ex?: (Exercise | WorksessionExercise | any) | null
): number {
  if (!ex) return 4.5;

  // 1. Explicit database MET override
  if (typeof ex.met_value === 'number' && ex.met_value > 0) {
    return ex.met_value;
  }

  const name = String(ex.name || ex.title || '').toLowerCase();
  const category = String(ex.category || '').toLowerCase();
  const mechanics = String(ex.mechanics || '').toLowerCase();

  // 2. High-Demand Loaded Multi-Joint Compound Movements (Squat, Deadlift, Clean, Snatch, RDL)
  if (
    name.includes('deadlift') ||
    name.includes('rdl') ||
    name.includes('squat') ||
    name.includes('clean') ||
    name.includes('snatch') ||
    name.includes('thruster') ||
    name.includes('lunge') ||
    name.includes('split squat') ||
    name.includes('leg press')
  ) {
    return 6.5;
  }

  // 3. Heavy Upper Body Compound Movements (Bench Press, Overhead Press, Pullups, Rows)
  if (
    name.includes('pull-up') ||
    name.includes('chin-up') ||
    name.includes('push-up') ||
    name.includes('bench press') ||
    name.includes('overhead press') ||
    name.includes('barbell row') ||
    name.includes('cable row') ||
    name.includes('dip')
  ) {
    return 5.5;
  }

  // 4. Locomotion & Loaded Carries (Suitcase Carry, Farmer's Walk, Sled Push)
  if (name.includes('carry') || name.includes('farmer') || name.includes('sled') || name.includes('march')) {
    return 6.0;
  }

  // 5. Core Stabilization, Postural Anti-Rotation & Isometric Holds (McGill, Bird-Dog, Planks, Pallof)
  if (
    name.includes('bird-dog') ||
    name.includes('bird dog') ||
    name.includes('mcgill') ||
    name.includes('curl-up') ||
    name.includes('plank') ||
    name.includes('pallof') ||
    name.includes('deadbug') ||
    name.includes('hollow') ||
    name.includes('wall sit') ||
    mechanics.includes('isometric') ||
    mechanics.includes('core stability')
  ) {
    return 4.0;
  }

  // 6. Gentle Mobility, Segmental Spinal Articulation & Restorative Breathing
  if (
    name.includes('cat-cow') ||
    name.includes('breathing') ||
    name.includes('foam roll') ||
    name.includes('stretch') ||
    name.includes('mobility') ||
    name.includes('active straight leg') ||
    category.includes('recovery')
  ) {
    return 2.5;
  }

  // 7. General Isolation / Hypertrophy
  if (
    name.includes('curl') ||
    name.includes('extension') ||
    name.includes('raise') ||
    name.includes('fly') ||
    mechanics.includes('isolation')
  ) {
    return 4.2;
  }

  // 8. Category fallbacks
  if (category.includes('power') || category.includes('olympic')) return 6.5;
  if (category.includes('strength')) return 5.0;
  if (category.includes('rehab') || category.includes('clinical')) return 3.5;
  if (category.includes('cardio') || category.includes('conditioning')) return 7.5;

  return 4.5;
}

/**
 * Calculates the effective mass (in kg) accounting for external weight load.
 * For external loads (dumbbells, barbells, kettlebells), mechanical work
 * increases overall muscular efficiency demands.
 */
export function calculateEffectiveMassKg(
  userWeightKg: number,
  loadKgOrLbs?: number | string | null,
  isLbs: boolean = false
): number {
  if (loadKgOrLbs == null) return userWeightKg;
  let rawLoad = typeof loadKgOrLbs === 'number' ? loadKgOrLbs : parseFloat(String(loadKgOrLbs).replace(/[^0-9.]/g, ''));
  if (isNaN(rawLoad) || rawLoad <= 0) return userWeightKg;
  if (isLbs) rawLoad *= 0.45359237;

  // Bilateral load adjustment coefficient: 80% of external load contributes to metabolic body work
  return userWeightKg + Math.round(rawLoad * 0.8 * 10) / 10;
}

/**
 * Calculates energy expenditure in kilocalories for a given duration in seconds.
 *
 * Formula:
 *   kcal = (MET * 3.5 * EffectiveMass_kg / 200) * (durationSeconds / 60)
 */
export function calculateDurationCalories(
  met: number,
  effectiveMassKg: number,
  durationSeconds: number
): number {
  if (durationSeconds <= 0) return 0;
  const rateKcalPerMin = (met * 3.5 * effectiveMassKg) / 200;
  const totalKcal = rateKcalPerMin * (durationSeconds / 60);
  return totalKcal;
}

/**
 * Calculates calories burned during a single repetition of an exercise.
 */
export function calculateRepCalories(
  ex: Exercise | WorksessionExercise | any,
  userWeightKg: number,
  repDurationSeconds: number = 4.0,
  loadKg: number = 0
): number {
  const met = resolveExerciseMET(ex);
  const effectiveMass = calculateEffectiveMassKg(userWeightKg, loadKg);
  const rawKcal = calculateDurationCalories(met, effectiveMass, repDurationSeconds);
  return Math.round(rawKcal * 100) / 100;
}

/**
 * Calculates calories burned during an active exercise set (reps or hold duration).
 */
export function calculateSetWorkCalories(
  ex: Exercise | WorksessionExercise | any,
  userWeightKg: number,
  options: {
    reps?: number;
    durationSeconds?: number;
    loadKg?: number;
    secondsPerRep?: number;
  }
): number {
  const met = resolveExerciseMET(ex);
  const effectiveMass = calculateEffectiveMassKg(userWeightKg, options.loadKg);

  let activeDurationSec = 0;
  if (typeof options.durationSeconds === 'number' && options.durationSeconds > 0) {
    activeDurationSec = options.durationSeconds;
  } else if (typeof options.reps === 'number' && options.reps > 0) {
    const tempo = options.secondsPerRep || 4.0;
    activeDurationSec = options.reps * tempo;
  }

  const rawKcal = calculateDurationCalories(met, effectiveMass, activeDurationSec);
  return Math.round(rawKcal * 10) / 10;
}

/**
 * Calculates calories burned during an inter-set or transition rest interval.
 * Uses elevated recovery EPOC MET (1.6).
 */
export function calculateRestIntervalCalories(
  userWeightKg: number,
  restSeconds: number
): number {
  if (restSeconds <= 0) return 0;
  const rawKcal = calculateDurationCalories(REST_EPOC_MET, userWeightKg, restSeconds);
  return Math.round(rawKcal * 10) / 10;
}

/**
 * Resolves the intensity/RPE multiplier for sport/manual activity calculations.
 */
export function resolveIntensityMultiplier(
  intensityOrRpe?: string | number | null
): number {
  if (intensityOrRpe == null) return 1.0;

  if (typeof intensityOrRpe === 'number') {
    if (intensityOrRpe <= 5) return 0.85; // Light
    if (intensityOrRpe <= 7) return 1.0;  // Moderate
    if (intensityOrRpe <= 8) return 1.15; // High
    return 1.30;                          // Max / Match
  }

  const str = String(intensityOrRpe).toLowerCase().trim();
  if (str.includes('light') || str.includes('easy') || str.includes('drill')) return 0.85;
  if (str.includes('mod')) return 1.0;
  if (str.includes('high') || str.includes('hard') || str.includes('vigorous')) return 1.15;
  if (str.includes('max') || str.includes('match') || str.includes('game') || str.includes('comp')) return 1.30;

  return 1.0;
}

/**
 * Resolves the base MET for a sport title from the sports lookup table.
 */
export function resolveSportMET(sportTitle: string): number {
  const clean = sportTitle.toLowerCase().trim();

  // Exact match
  if (SPORTS_MET_TABLE[clean]) return SPORTS_MET_TABLE[clean];

  // Substring match
  for (const [key, met] of Object.entries(SPORTS_MET_TABLE)) {
    if (clean.includes(key)) return met;
  }

  return 6.5; // Generic recreational sport fallback
}

export interface SportCalorieEstimation {
  estimatedCalories: number;
  baseMET: number;
  effectiveMET: number;
  durationMinutes: number;
  hoursPlayed: number;
  intensityMultiplier: number;
  userWeightKg: number;
}

/**
 * Accurately estimates calories burned for a manual sport or activity session
 * (e.g., soccer, volleyball for 1 or 2 hours).
 */
export function estimateSportCalories(
  sportTitle: string,
  hoursOrMinutes: { hours?: number; minutes?: number },
  intensityOrRpe?: string | number | null,
  userWeightKg: number = DEFAULT_USER_WEIGHT_KG
): SportCalorieEstimation {
  let minutes = 60;
  if (typeof hoursOrMinutes.minutes === 'number' && hoursOrMinutes.minutes > 0) {
    minutes = hoursOrMinutes.minutes;
  } else if (typeof hoursOrMinutes.hours === 'number' && hoursOrMinutes.hours > 0) {
    minutes = Math.round(hoursOrMinutes.hours * 60);
  }

  const hours = minutes / 60;
  const baseMET = resolveSportMET(sportTitle);
  const intensityMultiplier = resolveIntensityMultiplier(intensityOrRpe);
  const effectiveMET = Math.round(baseMET * intensityMultiplier * 10) / 10;

  // Formula: kcal = effectiveMET * 3.5 * weightKg / 200 * minutes
  const totalKcal = Math.round(((effectiveMET * 3.5 * userWeightKg) / 200) * minutes);

  return {
    estimatedCalories: Math.max(1, totalKcal),
    baseMET,
    effectiveMET,
    durationMinutes: minutes,
    hoursPlayed: Math.round(hours * 10) / 10,
    intensityMultiplier,
    userWeightKg,
  };
}

/**
 * Estimates energy expenditure for a specific timestamp interval [startTime, endTime].
 * Allows matching against smartwatch recorded windows.
 */
export function estimateTimestampIntervalCalories(
  startTimeIsoOrMs: string | number,
  endTimeIsoOrMs: string | number,
  activityTitle: string,
  intensityOrRpe?: string | number | null,
  userWeightKg: number = DEFAULT_USER_WEIGHT_KG
): {
  durationSeconds: number;
  durationMinutes: number;
  caloriesBurned: number;
} {
  const startMs = typeof startTimeIsoOrMs === 'number' ? startTimeIsoOrMs : new Date(startTimeIsoOrMs).getTime();
  const endMs = typeof endTimeIsoOrMs === 'number' ? endTimeIsoOrMs : new Date(endTimeIsoOrMs).getTime();
  const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const estimation = estimateSportCalories(
    activityTitle,
    { minutes: durationMinutes },
    intensityOrRpe,
    userWeightKg
  );

  return {
    durationSeconds,
    durationMinutes,
    caloriesBurned: estimation.estimatedCalories,
  };
}
