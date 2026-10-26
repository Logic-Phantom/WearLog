import { AppError } from '@/domain/errors';
import type { ForecastPeriod, WeatherPreferences, WeatherSnapshot } from '@/domain/models';
import { kvGet, kvSet } from '@/infrastructure/database/database';
import { getCoarsePositionOnce } from '@/infrastructure/location/location-service';
import { isInKmaDomain, latLonToKmaGrid, type KmaGrid } from '@/infrastructure/weather-providers/kma-grid';
import { KmaProxyProvider } from '@/infrastructure/weather-providers/kma-proxy-provider';
import { getArea, nearestArea } from '@/infrastructure/weather-providers/korea-areas';
import type { WeatherProvider } from '@/infrastructure/weather-providers/weather-provider';

import { isSnapshotFresh } from './weather-signal';

const PREFS_KEY = 'weather.prefs.v1';
const CACHE_KEY = 'weather.cache.v1';

/** Swap here to change providers; nothing else imports a concrete provider. */
export const weatherProvider: WeatherProvider = new KmaProxyProvider();

export type WeatherBundle = Partial<Record<ForecastPeriod, WeatherSnapshot>>;

interface CacheEntry {
  /** Grid cell, not coordinates. */
  grid: KmaGrid;
  bundle: WeatherBundle;
}

export function defaultWeatherPrefs(): WeatherPreferences {
  return { locationMode: 'off', manualAreaId: null, weatherRecommendationEnabled: true, preferredOutingPeriod: 'now', rememberManualArea: true, updatedAt: null };
}

export async function loadWeatherPrefs(): Promise<WeatherPreferences> {
  return { ...defaultWeatherPrefs(), ...((await kvGet<WeatherPreferences>(PREFS_KEY)) ?? {}) };
}

export async function saveWeatherPrefs(p: WeatherPreferences): Promise<void> {
  // Not remembering → keep the mode but drop the area id from storage.
  await kvSet(PREFS_KEY, { ...p, manualAreaId: p.rememberManualArea ? p.manualAreaId : null, updatedAt: new Date().toISOString() });
}

/** Cached bundle only while still valid — stale data is never shown as current (prompt §3.9). */
export async function loadCachedWeather(now: Date = new Date()): Promise<WeatherBundle | null> {
  const c = await kvGet<CacheEntry>(CACHE_KEY);
  if (!c) return null;
  const fresh = Object.fromEntries(Object.entries(c.bundle).filter(([, s]) => s && isSnapshotFresh(s, now))) as WeatherBundle;
  return Object.keys(fresh).length ? fresh : null;
}

async function resolveTarget(prefs: WeatherPreferences): Promise<{ grid: KmaGrid; label: string }> {
  if (prefs.locationMode === 'manual') {
    const area = prefs.manualAreaId ? getArea(prefs.manualAreaId) : undefined;
    if (!area) throw new AppError('validation', '지역을 먼저 선택해 주세요.');
    return { grid: latLonToKmaGrid(area.lat, area.lon), label: area.label };
  }
  if (prefs.locationMode === 'current') {
    const { lat, lon } = await getCoarsePositionOnce();
    const grid = latLonToKmaGrid(lat, lon);
    if (!isInKmaDomain(grid)) throw new AppError('weather-unavailable', '이 지역은 기상청 예보 범위 밖이에요. 날씨를 직접 골라 주세요.');
    // Label at city/구 level from the bundled list; coordinates go out of scope here.
    return { grid, label: nearestArea(lat, lon).label };
  }
  throw new AppError('validation', '날씨 사용이 꺼져 있어요.');
}

/** User-initiated refresh. Throws AppError; callers fall back to manual weather. */
export async function refreshWeather(prefs: WeatherPreferences, signal?: AbortSignal): Promise<WeatherBundle> {
  if (!weatherProvider.isConfigured()) throw new AppError('weather-unavailable', '날씨 서버가 설정되지 않았어요. 날씨를 직접 골라 코디를 추천받을 수 있어요.');
  const target = await resolveTarget(prefs);
  const bundle = await weatherProvider.fetch({ grid: target.grid, locationLabel: target.label }, signal);
  await kvSet(CACHE_KEY, { grid: target.grid, bundle } satisfies CacheEntry);
  return bundle;
}
