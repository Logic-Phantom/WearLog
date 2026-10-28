import { BAND_OUTFIT_GUIDE } from '@/domain/recommendation-policy';

import type { WeatherSignal } from './weather-signal';

export interface OutfitGuideLine {
  icon: 'shirt-outline' | 'swap-vertical-outline' | 'flag-outline' | 'umbrella-outline' | 'home-outline';
  text: string;
}

/**
 * "오늘 옷차림" guide for the weather in use: one base line from the policy band plus only the
 * conditions the provider actually reported (일교차, wind, rain). Empty when there is no weather.
 */
export function outfitGuide(w: WeatherSignal): OutfitGuideLine[] {
  if (w.source === 'none') return [];
  if (w.indoor) return [{ icon: 'home-outline', text: '실내 위주라 날씨보다 취향·상황에 맞춰 골라요' }];
  const lines: OutfitGuideLine[] = [];
  if (w.band) lines.push({ icon: 'shirt-outline', text: BAND_OUTFIT_GUIDE[w.band] });
  if (w.layering) {
    const { minC, maxC } = w.layering;
    lines.push({ icon: 'swap-vertical-outline', text: `일교차 ${Math.round(maxC - minC)}°C(최저 ${Math.round(minC)}° / 최고 ${Math.round(maxC)}°) — 벗고 입기 쉬운 겉옷을 챙겨요` });
  }
  if (w.windy) lines.push({ icon: 'flag-outline', text: w.windSpeedMps != null ? `바람이 초속 ${Math.round(w.windSpeedMps)}m로 강해요 — 바람막이·여밈 있는 겉옷` : '바람이 강해요 — 바람막이·여밈 있는 겉옷' });
  if (w.rainLikely) lines.push({ icon: 'umbrella-outline', text: '비 소식 — 우산을 챙기고 밝은 색 하의·신발은 피해요' });
  return lines;
}
