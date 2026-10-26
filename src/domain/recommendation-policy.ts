/**
 * ALL recommendation weights, thresholds and temperature bands live here (prompt §3.5, §3.9, §8).
 * These are starting values for user testing — not claims of aesthetic truth. Tune here only.
 */
import type { GarmentCategory, OuterWeight, Season } from './categories';
import type { ManualWeather } from './models';

export const SCORE_WEIGHTS = {
  tasteStyleMatch: 1.2,
  tasteColorMatch: 0.6,
  avoidedColorPenalty: 2.0,
  occasionMatch: 0.8,
  seasonMatch: 0.6,
  colorHarmony: 1.0,
  weatherFit: 1.5,
  underusedItemBonus: 0.4,
  recentRepeatPenalty: 1.0,
  similarOutfitPenalty: 0.8,
} as const;

/** Days an item counts as "recently worn" for the repeat penalty. */
export const RECENT_WEAR_DAYS = 7;
/** Items not worn in this many days get the underused bonus. */
export const UNDERUSED_DAYS = 30;

/** Max candidates per category before combining (keeps combinations bounded, prompt §8.2). */
export const MAX_CANDIDATES_PER_CATEGORY = 6;
export const MAX_RESULTS = 5;

// ---------------------------------------------------------------------------
// Temperature bands (°C). User-adjustable later via settings; these are defaults.
// ---------------------------------------------------------------------------

export type TemperatureBand = 'freezing' | 'cold' | 'chilly' | 'mild' | 'warm' | 'hot';

export const TEMPERATURE_BANDS: readonly { band: TemperatureBand; maxC: number; labelKo: string }[] = [
  { band: 'freezing', maxC: 5, labelKo: '매우 추움' },
  { band: 'cold', maxC: 12, labelKo: '추움' },
  { band: 'chilly', maxC: 18, labelKo: '쌀쌀함' },
  { band: 'mild', maxC: 23, labelKo: '선선·쾌적' },
  { band: 'warm', maxC: 27, labelKo: '따뜻함' },
  { band: 'hot', maxC: Number.POSITIVE_INFINITY, labelKo: '더움' },
];

export function temperatureBand(tempC: number): TemperatureBand {
  // Bands use whole degrees: 5.4 → 5 (freezing), 5.6 → 6 (cold).
  const t = Math.round(tempC);
  return TEMPERATURE_BANDS.find((b) => t <= b.maxC)!.band;
}

export function bandLabel(band: TemperatureBand): string {
  return TEMPERATURE_BANDS.find((b) => b.band === band)!.labelKo;
}

/** Manual weather choices map onto the same bands so one policy serves both. */
export const MANUAL_WEATHER_OPTIONS: readonly { id: ManualWeather; labelKo: string; band: TemperatureBand | null; rain: boolean }[] = [
  { id: 'hot', labelKo: '더움', band: 'hot', rain: false },
  { id: 'warm', labelKo: '따뜻함', band: 'warm', rain: false },
  { id: 'mild', labelKo: '선선함', band: 'mild', rain: false },
  { id: 'chilly', labelKo: '쌀쌀함', band: 'chilly', rain: false },
  { id: 'cold', labelKo: '추움', band: 'cold', rain: false },
  { id: 'freezing', labelKo: '매우 추움', band: 'freezing', rain: false },
  { id: 'rain', labelKo: '비', band: null, rain: true },
  { id: 'indoor', labelKo: '오늘은 실내', band: null, rain: false },
];

/** Precipitation probability (%) at/above which rain-related advice is shown. */
export const RAIN_PROBABILITY_THRESHOLD_PCT = 60;
/** Wind speed (m/s) at/above which an outer layer is nudged up one level. */
export const WINDY_THRESHOLD_MPS = 7;

export interface BandRule {
  /** Whether an outer layer is required / allowed / discouraged. */
  outer: 'required' | 'optional' | 'avoid';
  /** Acceptable user-entered outer weights (only checked when the item has one). */
  outerWeights: OuterWeight[];
  seasons: Season[];
}

export const BAND_RULES: Record<TemperatureBand, BandRule> = {
  freezing: { outer: 'required', outerWeights: ['heavy'], seasons: ['winter'] },
  cold: { outer: 'required', outerWeights: ['medium', 'heavy'], seasons: ['winter', 'fall'] },
  chilly: { outer: 'required', outerWeights: ['light', 'medium'], seasons: ['fall', 'spring'] },
  mild: { outer: 'optional', outerWeights: ['light'], seasons: ['spring', 'fall'] },
  warm: { outer: 'avoid', outerWeights: [], seasons: ['spring', 'summer'] },
  hot: { outer: 'avoid', outerWeights: [], seasons: ['summer'] },
};

/** Outfit composition: required slots and the categories that may fill them (prompt §8.2). */
export const OUTFIT_SLOTS: { slot: string; categories: GarmentCategory[]; required: boolean }[] = [
  { slot: 'top', categories: ['top'], required: true },
  { slot: 'bottom', categories: ['bottom'], required: true },
  { slot: 'shoes', categories: ['shoes'], required: true },
  { slot: 'outer', categories: ['outer'], required: false },
  { slot: 'hat', categories: ['hat'], required: false },
  { slot: 'bag', categories: ['bag'], required: false },
];
/** A one-piece replaces the top + bottom slots. */
export const ONEPIECE_REPLACES = ['top', 'bottom'] as const;

/** Minimum owned items before "내 옷만" recommendations are attempted. */
export const MIN_OWNED_FOR_RECOMMENDATION = { top: 1, bottom: 1, shoes: 1 } as const;
