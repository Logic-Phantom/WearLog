/**
 * Rule-based, explainable outfit recommender (prompt §8). Pure: no DB, no UI, no network.
 * Every reason in the output corresponds to a rule that actually changed the score.
 * Weights and thresholds: src/domain/recommendation-policy.ts.
 */
import { STYLE_TAGS, labelOf, type GarmentCategory, type Occasion, type OuterWeight, type Season, type StyleTag } from '@/domain/categories';
import type { ItemRef, TasteProfile } from '@/domain/models';
import { harmonyRule } from '@/domain/palette';
import {
  BAND_RULES,
  MAX_CANDIDATES_PER_CATEGORY,
  MAX_RESULTS,
  OUTFIT_SLOTS,
  RECENT_WEAR_DAYS,
  SCORE_WEIGHTS,
  UNDERUSED_DAYS,
  bandLabel,
  type TemperatureBand,
} from '@/domain/recommendation-policy';
import type { WeatherSignal } from '@/features/weather/weather-signal';

/** Normalized view of an owned garment or a sample template, for scoring. */
export interface RecItem {
  key: string;
  ref: ItemRef;
  name: string;
  category: GarmentCategory;
  colorIds: string[];
  styleTags: StyleTag[];
  seasonTags: Season[];
  occasionTags: Occasion[];
  outerWeight: OuterWeight | null;
  waterResistant: boolean | null;
  /** Days since last wear; null = never worn (or sample). */
  daysSinceWorn: number | null;
}

export interface RecommendInput {
  items: RecItem[];
  taste: TasteProfile;
  occasion: Occasion | null;
  weather: WeatherSignal;
  weatherEnabled: boolean;
  excludedKeys: string[];
  /** Keys the user pinned: every result must contain them. */
  pinnedKeys: string[];
  /** Sorted key-sets of recently saved/worn outfits (similarity penalty). */
  recentOutfitSignatures: string[];
}

export interface Reason {
  code: string;
  text: string;
}

export interface Recommendation {
  items: RecItem[];
  score: number;
  reasons: Reason[];
  /** Neutral hints, e.g. a missing outer in cold weather (prompt §3.8 — no shopping push). */
  gaps: string[];
  signature: string;
}

export type RecommendResult =
  | { kind: 'ok'; results: Recommendation[] }
  | { kind: 'notEnoughItems'; missing: GarmentCategory[] };

function itemScore(item: RecItem, input: RecommendInput): { score: number; reasons: Reason[] } {
  const reasons: Reason[] = [];
  let score = 0;
  const { taste } = input;
  if (taste.personalizationEnabled) {
    const styleHits = item.styleTags.filter((t) => taste.preferredStyles.includes(t));
    if (styleHits.length) score += SCORE_WEIGHTS.tasteStyleMatch * Math.min(styleHits.length, 2) * 0.5;
    if (item.colorIds.some((c) => (taste.preferredColorIds as string[]).includes(c))) score += SCORE_WEIGHTS.tasteColorMatch;
  }
  if (item.colorIds.some((c) => (taste.avoidedColorIds as string[]).includes(c))) score -= SCORE_WEIGHTS.avoidedColorPenalty;
  if (input.occasion && item.occasionTags.includes(input.occasion)) score += SCORE_WEIGHTS.occasionMatch * 0.5;
  if (item.daysSinceWorn != null) {
    if (item.daysSinceWorn < RECENT_WEAR_DAYS) {
      score -= SCORE_WEIGHTS.recentRepeatPenalty;
    } else if (item.daysSinceWorn >= UNDERUSED_DAYS) {
      score += SCORE_WEIGHTS.underusedItemBonus;
      reasons.push({ code: 'underused', text: `최근 ${UNDERUSED_DAYS}일간 입지 않은 ${item.name} 포함` });
    }
  }
  return { score, reasons };
}

function weatherItemScore(item: RecItem, input: RecommendInput): number {
  const band = input.weather.band;
  if (!input.weatherEnabled || !band || input.weather.indoor) return 0;
  const rule = BAND_RULES[band];
  let s = 0;
  if (isOffSeason(item, rule.offSeasons)) s -= SCORE_WEIGHTS.offSeasonPenalty;
  else if (item.seasonTags.some((t) => rule.seasons.includes(t))) s += SCORE_WEIGHTS.seasonMatch;
  if (item.category === 'outer' && item.outerWeight) {
    s += rule.outerWeights.includes(item.outerWeight) ? SCORE_WEIGHTS.weatherFit * 0.5 : -SCORE_WEIGHTS.weatherFit * 0.5;
  }
  return s;
}

function isOffSeason(item: RecItem, offSeasons: Season[]): boolean {
  return item.seasonTags.length > 0 && item.seasonTags.every((t) => offSeasons.includes(t));
}

function topByCategory(items: RecItem[], input: RecommendInput): Map<GarmentCategory, RecItem[]> {
  const out = new Map<GarmentCategory, RecItem[]>();
  for (const it of items) {
    if (input.excludedKeys.includes(it.key)) continue;
    const list = out.get(it.category) ?? [];
    list.push(it);
    out.set(it.category, list);
  }
  for (const [cat, list] of out) {
    const pinned = list.filter((i) => input.pinnedKeys.includes(i.key));
    const rest = list
      .filter((i) => !input.pinnedKeys.includes(i.key))
      .map((i) => ({ i, s: itemScore(i, input).score + weatherItemScore(i, input) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.i);
    // A pinned item is the only candidate for its category.
    out.set(cat, pinned.length ? pinned.slice(0, 1) : rest.slice(0, MAX_CANDIDATES_PER_CATEGORY));
  }
  return out;
}

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>((acc, list) => acc.flatMap((combo) => list.map((x) => [...combo, x])), [[]]);
}

export function signatureOf(items: RecItem[]): string {
  return items
    .map((i) => i.key)
    .sort()
    .join('|');
}

export function recommend(input: RecommendInput): RecommendResult {
  const byCat = topByCategory(input.items, input);
  const missing = OUTFIT_SLOTS.filter((s) => s.required && !s.categories.some((c) => byCat.get(c)?.length)).map((s) => s.categories[0]);
  if (missing.length) return { kind: 'notEnoughItems', missing };

  const band = input.weatherEnabled && !input.weather.indoor ? input.weather.band : null;
  const rule = band ? BAND_RULES[band] : null;

  const required = OUTFIT_SLOTS.filter((s) => s.required).map((s) => byCat.get(s.categories[0])!);
  const outers = byCat.get('outer') ?? [];
  // Outer is a real option: [none, ...outers]. "avoid" bands drop outers; "required" bands drop none.
  const outerOptions: (RecItem | null)[] = rule?.outer === 'avoid' ? [null] : rule?.outer === 'required' && outers.length ? outers : [null, ...outers];
  const hats = byCat.get('hat') ?? [];
  const bags = byCat.get('bag') ?? [];

  const results: Recommendation[] = [];
  for (const base of cartesian(required)) {
    for (const outer of outerOptions) {
      const items = [...base, ...(outer ? [outer] : [])];
      // Accessories: add the single best one per category if it helps, never forced.
      for (const extra of [hats[0], bags[0]]) if (extra && itemScore(extra, input).score > 0) items.push(extra);
      results.push(scoreOutfit(items, input, band, rule?.outer ?? null, outers.length > 0));
    }
  }

  const seen = new Set<string>();
  const ranked = results
    .sort((a, b) => b.score - a.score)
    .filter((r) => (seen.has(r.signature) ? false : (seen.add(r.signature), true)))
    .slice(0, MAX_RESULTS);
  return { kind: 'ok', results: ranked };
}

function scoreOutfit(items: RecItem[], input: RecommendInput, band: TemperatureBand | null, outerRule: 'required' | 'optional' | 'avoid' | null, hasAnyOuter: boolean): Recommendation {
  const reasons: Reason[] = [];
  const gaps: string[] = [];
  let score = 0;

  for (const it of items) {
    const s = itemScore(it, input);
    score += s.score + weatherItemScore(it, input);
    reasons.push(...s.reasons);
  }

  const { taste } = input;
  if (taste.personalizationEnabled) {
    const matched = new Set(items.flatMap((i) => i.styleTags).filter((t) => taste.preferredStyles.includes(t)));
    if (matched.size) reasons.push({ code: 'taste', text: `선택한 취향(${[...matched].slice(0, 2).map(styleKo).join('·')})과 일치` });
  }

  const harmony = harmonyRule(items.flatMap((i) => i.colorIds.slice(0, 1)));
  score += SCORE_WEIGHTS.colorHarmony * harmony.score;
  if (harmony.rule === 'tonal') reasons.push({ code: 'colorTonal', text: '같은 계열 색으로 맞춘 톤온톤 조합' });
  if (harmony.rule === 'oneAccent') reasons.push({ code: 'colorAccent', text: '무채색 바탕에 포인트 색 하나' });

  if (input.weatherEnabled && input.weather.summary && input.weather.source !== 'none') {
    const hasOuter = items.some((i) => i.category === 'outer');
    if (band && outerRule === 'required') {
      if (hasOuter) {
        score += SCORE_WEIGHTS.weatherFit;
        reasons.push({ code: 'weatherOuter', text: `${bandLabel(band)} 날씨라 등록된 아우터를 포함했어요` });
      } else if (!hasAnyOuter) {
        gaps.push('이 날씨에는 아우터가 있으면 좋아요');
      }
    }
    if (input.weather.rainLikely) {
      const wr = items.some((i) => i.waterResistant === true);
      reasons.push({ code: 'rain', text: wr ? '비 예보가 있어 방수로 기록된 아이템을 포함했어요' : '비 예보가 있어 우산을 챙기는 편이 좋아요' });
      if (wr) score += SCORE_WEIGHTS.weatherFit * 0.5;
    }
    reasons.unshift({ code: 'weather', text: input.weather.summary });
  }

  const signature = signatureOf(items);
  if (input.recentOutfitSignatures.includes(signature)) score -= SCORE_WEIGHTS.similarOutfitPenalty;

  return { items, score, reasons: dedupe(reasons), gaps, signature };
}

function dedupe(reasons: Reason[]): Reason[] {
  const seen = new Set<string>();
  return reasons.filter((r) => (seen.has(r.text) ? false : (seen.add(r.text), true)));
}

function styleKo(t: string): string {
  return labelOf(STYLE_TAGS, t);
}
