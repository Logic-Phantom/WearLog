/**
 * Rule-based, explainable outfit recommender (prompt §8). Pure: no DB, no UI, no network.
 * Every reason in the output corresponds to a rule that actually changed the score.
 * Weights and thresholds: src/domain/recommendation-policy.ts.
 */
import { SEASONS, STYLE_TAGS, labelOf, type GarmentCategory, type Occasion, type OuterWeight, type Season, type StyleTag } from '@/domain/categories';
import type { ItemRef, TasteProfile } from '@/domain/models';
import { getColor, harmonyRule } from '@/domain/palette';
import {
  BAND_RULES,
  MAX_CANDIDATES_PER_CATEGORY,
  MAX_RESULTS,
  OUTFIT_SLOTS,
  RECENT_WEAR_DAYS,
  SCORE_WEIGHTS,
  UNDERUSED_DAYS,
  bandLabel,
  temperatureBand,
  type BandRule,
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
  /**
   * Short "why this piece" tag per item key (e.g. "일교차 대비 겉옷"), for the visual breakdown.
   * Only from rules that actually applied to this outfit; items with nothing to say have no entry.
   */
  itemNotes: Record<string, string>;
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

type OuterRule = BandRule['outer'];
/** 일교차·바람 move the outer requirement up one level (policy: WINDY_THRESHOLD_MPS, DAILY_RANGE_LAYER_THRESHOLD_C). */
const NUDGE_UP: Record<OuterRule, OuterRule> = { avoid: 'optional', optional: 'required', required: 'required' };

interface ActiveRule extends BandRule {
  band: TemperatureBand;
  /** Why `outer` was raised above the band's own rule, if it was. */
  nudge: 'layering' | 'wind' | null;
}

/** The weather rule actually applied: band rule, raised for a big 일교차 or strong wind. */
function activeRule(input: RecommendInput): ActiveRule | null {
  const w = input.weather;
  if (!input.weatherEnabled || w.indoor || !w.band) return null;
  const base = BAND_RULES[w.band];
  const nudge = w.layering ? 'layering' : w.windy ? 'wind' : null;
  const raised = nudge ? NUDGE_UP[base.outer] : base.outer;
  // A big swing makes the colder end's outer weights acceptable too (light jacket → medium).
  const cold = w.layering ? BAND_RULES[temperatureBand(w.layering.minC)] : null;
  return {
    ...base,
    band: w.band,
    outer: raised,
    outerWeights: cold ? [...new Set([...base.outerWeights, ...cold.outerWeights])] : base.outerWeights,
    nudge: raised !== base.outer ? nudge : null,
  };
}

const isLight = (i: RecItem) => getColor(i.colorIds[0] ?? '')?.luminanceGroup === 2;
const RAIN_SENSITIVE: GarmentCategory[] = ['bottom', 'shoes'];

function weatherItemScore(item: RecItem, input: RecommendInput): number {
  const rule = activeRule(input);
  if (!rule) return 0;
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

  const rule = activeRule(input);
  // Rain: only claim "darker colors were chosen" when light bottoms/shoes were actually available.
  const rainAvoidedLight = input.weatherEnabled && input.weather.rainLikely && RAIN_SENSITIVE.some((c) => byCat.get(c)?.some(isLight));

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
      results.push(scoreOutfit(items, input, rule, outers.length > 0, rainAvoidedLight));
    }
  }

  const seen = new Set<string>();
  const ranked = results
    .sort((a, b) => b.score - a.score)
    .filter((r) => (seen.has(r.signature) ? false : (seen.add(r.signature), true)))
    .slice(0, MAX_RESULTS);
  return { kind: 'ok', results: ranked };
}

function scoreOutfit(items: RecItem[], input: RecommendInput, rule: ActiveRule | null, hasAnyOuter: boolean, rainAvoidedLight: boolean): Recommendation {
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
    const w = input.weather;
    if (rule && rule.outer === 'required') {
      if (hasOuter) {
        score += SCORE_WEIGHTS.weatherFit;
        const text =
          rule.nudge === 'layering' && w.layering
            ? `일교차가 커서(최저 ${Math.round(w.layering.minC)}° / 최고 ${Math.round(w.layering.maxC)}°) 벗고 입기 쉬운 아우터를 포함했어요`
            : rule.nudge === 'wind'
              ? `바람이 강해${w.windSpeedMps != null ? `(초속 ${Math.round(w.windSpeedMps)}m)` : ''} 아우터를 포함했어요`
              : `${bandLabel(rule.band)} 날씨라 등록된 아우터를 포함했어요`;
        reasons.push({ code: 'weatherOuter', text });
      } else if (!hasAnyOuter) {
        gaps.push(rule.nudge === 'layering' ? '일교차가 커서 걸칠 아우터가 있으면 좋아요' : rule.nudge === 'wind' ? '바람이 강해 아우터가 있으면 좋아요' : '이 날씨에는 아우터가 있으면 좋아요');
      }
    }
    if (w.rainLikely) {
      const wr = items.some((i) => i.waterResistant === true);
      reasons.push({ code: 'rain', text: wr ? '비 예보가 있어 방수로 기록된 아이템을 포함했어요' : '비 예보가 있어 우산을 챙기는 편이 좋아요' });
      if (wr) score += SCORE_WEIGHTS.weatherFit * 0.5;
      const light = items.filter((i) => RAIN_SENSITIVE.includes(i.category) && isLight(i));
      score -= SCORE_WEIGHTS.rainLightColorPenalty * light.length;
      if (rainAvoidedLight && light.length === 0) reasons.push({ code: 'rainColor', text: '비 예보가 있어 밝은 색 하의·신발 대신 어두운 색을 골랐어요' });
    }
    reasons.unshift({ code: 'weather', text: input.weather.summary });
  }

  const signature = signatureOf(items);
  if (input.recentOutfitSignatures.includes(signature)) score -= SCORE_WEIGHTS.similarOutfitPenalty;

  return { items, score, reasons: dedupe(reasons), gaps, signature, itemNotes: itemNotesFor(items, input, rule, rainAvoidedLight) };
}

/** First applicable rule wins per item: weather role > rain > pinned > underused > season > taste. */
function itemNotesFor(items: RecItem[], input: RecommendInput, rule: ActiveRule | null, rainAvoidedLight: boolean): Record<string, string> {
  const notes: Record<string, string> = {};
  const set = (it: RecItem, text: string) => {
    if (!notes[it.key]) notes[it.key] = text;
  };
  const w = input.weather;
  for (const it of items) {
    if (it.category === 'outer' && rule?.outer === 'required') set(it, rule.nudge === 'layering' ? '일교차 대비 겉옷' : rule.nudge === 'wind' ? '바람 대비 겉옷' : `${bandLabel(rule.band)} 날씨 겉옷`);
    if (input.weatherEnabled && w.rainLikely) {
      if (it.waterResistant === true) set(it, '방수로 기록한 옷');
      else if (rainAvoidedLight && RAIN_SENSITIVE.includes(it.category) && !isLight(it)) set(it, '비 와도 티 덜 나는 색');
    }
    if (input.pinnedKeys.includes(it.key)) set(it, '고정한 옷');
    if (it.daysSinceWorn != null && it.daysSinceWorn >= UNDERUSED_DAYS) set(it, `${UNDERUSED_DAYS}일 넘게 안 입은 옷`);
    const season = rule?.seasons.find((x) => it.seasonTags.includes(x));
    if (season && !(rule && it.seasonTags.every((t) => rule.offSeasons.includes(t)))) set(it, `${labelOf(SEASONS, season)} 옷`);
    if (input.taste.personalizationEnabled) {
      const style = it.styleTags.find((t) => input.taste.preferredStyles.includes(t));
      if (style) set(it, `취향: ${styleKo(style)}`);
    }
  }
  return notes;
}

function dedupe(reasons: Reason[]): Reason[] {
  const seen = new Set<string>();
  return reasons.filter((r) => (seen.has(r.text) ? false : (seen.add(r.text), true)));
}

function styleKo(t: string): string {
  return labelOf(STYLE_TAGS, t);
}
