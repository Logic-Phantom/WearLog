/**
 * Domain models (UI- and platform-independent). Field-level rules: docs/DATA_MODEL.md.
 * Money is stored as integer minor units (KRW = 원) — never floats.
 */
import type { Fit, GarmentCategory, Occasion, OuterWeight, Pattern, Season, StyleTag } from './categories';
import type { ColorId } from './palette';

export type ISODate = string; // YYYY-MM-DD (local calendar day)
export type ISODateTime = string;

// ---------------------------------------------------------------------------
// Wardrobe
// ---------------------------------------------------------------------------

export type GarmentSourceType = 'singleItemPhoto' | 'outfitExtraction' | 'manual' | 'fromSample';
export type GarmentStatus = 'active' | 'archived';

export interface GarmentItem {
  id: string;
  name: string;
  category: GarmentCategory;
  subcategory: string | null;
  sourceType: GarmentSourceType;
  /** App-private derived files only. The picked original is never written or deleted. */
  originalUri: string | null;
  thumbnailUri: string | null;
  cutoutUri: string | null;
  colorIds: ColorId[];
  pattern: Pattern;
  fit: Fit | null;
  seasonTags: Season[];
  styleTags: StyleTag[];
  occasionTags: Occasion[];
  /** User-entered only (prompt §3.9: never infer warmth/waterproofing from a photo). */
  outerWeight: OuterWeight | null;
  waterResistant: boolean | null;
  brand: string | null;
  sizeLabel: string | null;
  purchasePriceMinor: number | null;
  currency: 'KRW';
  purchasedAt: ISODate | null;
  note: string | null;
  status: GarmentStatus;
  /** Fields the user confirmed (vs. suggested by an analyzer). */
  userVerifiedFields: string[];
  /** When created from a sample template, which one (for "내 옷으로 등록" provenance). */
  fromTemplateId: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Samples (read-only bundled catalog — never mixed into owned stats)
// ---------------------------------------------------------------------------

export interface SampleGarmentTemplate {
  id: string;
  nameKo: string;
  category: GarmentCategory;
  subcategory: string;
  /** Vector shape key (src/features/sample-wardrobe/garment-shapes). */
  shapeId: string;
  defaultColorId: ColorId;
  supportedColorIds: ColorId[];
  /** Only fits the vector can actually draw differently. */
  supportedFits: Fit[];
  supportedPatterns: Pattern[];
  styleTags: StyleTag[];
  seasonTags: Season[];
  outerWeight?: OuterWeight;
  assetVersion: number;
}

export interface SampleCustomization {
  colorId: ColorId;
  fit?: Fit;
  pattern?: Pattern;
}

export interface SampleOutfitPreset {
  id: string;
  title: string;
  description: string;
  styleTags: StyleTag[];
  occasion: Occasion;
  seasons: Season[];
  items: { templateId: string; customization: SampleCustomization }[];
  catalogVersion: number;
}

// ---------------------------------------------------------------------------
// Outfits & canvas
// ---------------------------------------------------------------------------

/** Discriminated reference: provenance survives serialization (prompt §6 Outfit). */
export type ItemRef =
  | { kind: 'ownedGarment'; garmentItemId: string }
  | { kind: 'sampleTemplate'; templateId: string; customization: SampleCustomization };

export type OutfitSource = 'recommended' | 'manual' | 'samplePreset' | 'imported';

export interface Outfit {
  id: string;
  title: string;
  itemRefs: ItemRef[];
  styleTags: StyleTag[];
  occasion: Occasion | null;
  source: OutfitSource;
  thumbnailUri: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Normalized (0..1) logical coordinates so layouts survive any screen ratio. */
export interface CanvasElement {
  id: string;
  itemRef: ItemRef;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  flipX: boolean;
}

export interface CanvasLayout {
  id: string;
  outfitId: string;
  /** Logical aspect (width / height). */
  aspect: number;
  background: 'neutral' | 'white';
  elements: CanvasElement[];
  canvasVersion: 1;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Wear log
// ---------------------------------------------------------------------------

export interface WearEvent {
  id: string;
  date: ISODate;
  outfitId: string | null;
  /** Owned garments only — sample templates never count as worn. */
  garmentItemIds: string[];
  note: string | null;
  /** `${date}:${outfitId ?? sorted item ids}` — repeated taps cannot double-count. */
  idempotencyKey: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Taste
// ---------------------------------------------------------------------------

export interface TasteProfile {
  selectedStyleCardIds: string[];
  preferredStyles: StyleTag[];
  preferredFits: Fit[];
  preferredColorIds: ColorId[];
  avoidedColorIds: ColorId[];
  occasionPreferences: Occasion[];
  personalizationEnabled: boolean;
  onboardingState: 'notStarted' | 'inProgress' | 'completed' | 'skipped';
  updatedAt: ISODateTime | null;
  schemaVersion: 1;
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export type ForecastPeriod = 'now' | 'morning' | 'afternoon' | 'evening';
export type PrecipitationType = 'none' | 'rain' | 'rainSnow' | 'snow' | 'shower';
/** Provider value vs. an app-side estimate — never mixed (prompt §3.9). */
export type ValueSource = 'provider' | 'estimated' | 'unknown';

export interface WeatherSnapshot {
  providerId: string;
  /** City/구 level only. Never coordinates. */
  locationLabel: string;
  fetchedAt: ISODateTime;
  validUntil: ISODateTime;
  timezone: string;
  observationTime: ISODateTime | null;
  forecastFor: ForecastPeriod;
  isForecast: boolean;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  apparentTemperatureSource: ValueSource;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  conditionLabelKo: string | null;
  precipitationProbabilityPct: number | null;
  precipitationMm: number | null;
  precipitationType: PrecipitationType | null;
  windSpeedMps: number | null;
  humidityPct: number | null;
  /** Attribution required by the data license (e.g. "기상청"). */
  attribution: string;
}

/** User-chosen weather when location/API is unavailable or declined. */
export type ManualWeather = 'hot' | 'warm' | 'mild' | 'chilly' | 'cold' | 'freezing' | 'rain' | 'indoor';

export interface WeatherPreferences {
  locationMode: 'current' | 'manual' | 'off';
  manualAreaId: string | null;
  weatherRecommendationEnabled: boolean;
  preferredOutingPeriod: ForecastPeriod;
  rememberManualArea: boolean;
  updatedAt: ISODateTime | null;
}

/** What the recommender actually receives: real data, a manual pick, or nothing. */
export type WeatherContext =
  | { kind: 'snapshot'; snapshot: WeatherSnapshot }
  | { kind: 'manual'; manual: ManualWeather }
  | { kind: 'none'; reason: 'disabled' | 'unavailable' | 'stale' };
