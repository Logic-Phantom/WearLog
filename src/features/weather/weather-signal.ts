/**
 * Turns a WeatherContext (real snapshot / manual pick / none) into the signal the recommender uses,
 * plus the exact values to quote in reasons. Values a provider did not send are never shown.
 */
import type { ManualWeather, WeatherContext, WeatherSnapshot } from '@/domain/models';
import {
  MANUAL_WEATHER_OPTIONS,
  RAIN_PROBABILITY_THRESHOLD_PCT,
  WINDY_THRESHOLD_MPS,
  bandLabel,
  temperatureBand,
  type TemperatureBand,
} from '@/domain/recommendation-policy';

export interface WeatherSignal {
  band: TemperatureBand | null;
  rainLikely: boolean;
  windy: boolean;
  indoor: boolean;
  /** e.g. "현재 12°C · 체감 9°C · 오후 강수확률 60%" — only fields that exist. */
  summary: string | null;
  source: 'snapshot' | 'manual' | 'none';
}

const PERIOD_KO = { now: '현재', morning: '오전', afternoon: '오후', evening: '저녁' } as const;

export function isSnapshotFresh(s: WeatherSnapshot, now: Date = new Date()): boolean {
  return new Date(s.validUntil).getTime() > now.getTime();
}

export function snapshotSummary(s: WeatherSnapshot): string | null {
  const parts: string[] = [];
  const when = PERIOD_KO[s.forecastFor];
  if (s.temperatureC != null) parts.push(`${when} ${Math.round(s.temperatureC)}°C`);
  if (s.apparentTemperatureC != null && s.apparentTemperatureSource !== 'unknown') {
    parts.push(`체감 ${Math.round(s.apparentTemperatureC)}°C${s.apparentTemperatureSource === 'estimated' ? '(추정)' : ''}`);
  }
  if (s.precipitationProbabilityPct != null) parts.push(`강수확률 ${Math.round(s.precipitationProbabilityPct)}%`);
  return parts.length ? parts.join(' · ') : null;
}

function fromManual(manual: ManualWeather): WeatherSignal {
  const opt = MANUAL_WEATHER_OPTIONS.find((o) => o.id === manual)!;
  return {
    band: opt.band,
    rainLikely: opt.rain,
    windy: false,
    indoor: manual === 'indoor',
    summary: `직접 선택: ${opt.labelKo}`,
    source: 'manual',
  };
}

export function resolveWeatherSignal(ctx: WeatherContext, now: Date = new Date()): WeatherSignal {
  if (ctx.kind === 'manual') return fromManual(ctx.manual);
  if (ctx.kind === 'none' || !isSnapshotFresh(ctx.snapshot, now)) {
    return { band: null, rainLikely: false, windy: false, indoor: false, summary: null, source: 'none' };
  }
  const s = ctx.snapshot;
  // Recommend for the felt temperature only when the provider supplied it; otherwise the air temp.
  const basis = s.apparentTemperatureSource === 'provider' && s.apparentTemperatureC != null ? s.apparentTemperatureC : s.temperatureC;
  const rainByType = s.precipitationType != null && s.precipitationType !== 'none';
  const rainByProb = s.precipitationProbabilityPct != null && s.precipitationProbabilityPct >= RAIN_PROBABILITY_THRESHOLD_PCT;
  return {
    band: basis != null ? temperatureBand(basis) : null,
    rainLikely: rainByType || rainByProb,
    windy: s.windSpeedMps != null && s.windSpeedMps >= WINDY_THRESHOLD_MPS,
    indoor: false,
    summary: snapshotSummary(s),
    source: 'snapshot',
  };
}

export function bandLabelOrNull(band: TemperatureBand | null): string | null {
  return band ? bandLabel(band) : null;
}
