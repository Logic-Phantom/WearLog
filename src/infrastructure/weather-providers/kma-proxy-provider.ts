import { AppError } from '@/domain/errors';
import type { ForecastPeriod, PrecipitationType, WeatherSnapshot } from '@/domain/models';
import { estimateWindChillC } from '@/features/weather/apparent-temperature';
import { edgeFunctionEndpoint } from '@/infrastructure/supabase/config';

import type { WeatherProvider, WeatherQuery } from './weather-provider';

/**
 * 기상청 단기예보 via our Supabase Edge Function `weather-kma` (supabase/functions/weather-kma).
 * The KMA service key stays server-side; the app sends only the 5 km grid index.
 */
const FUNCTION_NAME = 'weather-kma';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const PERIODS: ForecastPeriod[] = ['now', 'morning', 'afternoon', 'evening'];
const PTY: PrecipitationType[] = ['none', 'rain', 'rainSnow', 'snow', 'shower'];

interface RawPeriod {
  isForecast: boolean;
  forecastTime: string | null;
  temperatureC: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  conditionLabelKo: string | null;
  precipitationProbabilityPct: number | null;
  precipitationMm: number | null;
  precipitationType: string | null;
  windSpeedMps: number | null;
  humidityPct: number | null;
}

interface RawResponse {
  fetchedAt: string;
  validUntil: string;
  periods: Partial<Record<ForecastPeriod, RawPeriod>>;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

/** Strict schema check — unknown or malformed fields become null rather than invented values. */
export function parseKmaProxyResponse(json: unknown, locationLabel: string): Partial<Record<ForecastPeriod, WeatherSnapshot>> {
  const r = json as Partial<RawResponse> | null;
  if (!r || typeof r !== 'object' || !str(r.fetchedAt) || !str(r.validUntil) || typeof r.periods !== 'object' || r.periods == null) {
    throw new AppError('weather-unavailable', undefined, new Error('kma-schema'));
  }
  const out: Partial<Record<ForecastPeriod, WeatherSnapshot>> = {};
  for (const period of PERIODS) {
    const p = (r.periods as Record<string, Partial<RawPeriod> | undefined>)[period];
    if (!p || typeof p !== 'object') continue;
    const temperatureC = num(p.temperatureC);
    const windSpeedMps = num(p.windSpeedMps);
    const chill = estimateWindChillC(temperatureC, windSpeedMps);
    const pty = str(p.precipitationType);
    out[period] = {
      providerId: 'kma',
      locationLabel,
      fetchedAt: r.fetchedAt!,
      validUntil: r.validUntil!,
      timezone: 'Asia/Seoul',
      observationTime: str(p.forecastTime),
      forecastFor: period,
      isForecast: p.isForecast !== false,
      temperatureC,
      apparentTemperatureC: chill,
      apparentTemperatureSource: chill == null ? 'unknown' : 'estimated',
      minTemperatureC: num(p.minTemperatureC),
      maxTemperatureC: num(p.maxTemperatureC),
      conditionLabelKo: str(p.conditionLabelKo),
      precipitationProbabilityPct: num(p.precipitationProbabilityPct),
      precipitationMm: num(p.precipitationMm),
      precipitationType: pty && (PTY as string[]).includes(pty) ? (pty as PrecipitationType) : null,
      windSpeedMps,
      humidityPct: num(p.humidityPct),
      attribution: '기상청',
    };
  }
  if (!out.now && !out.morning && !out.afternoon && !out.evening) throw new AppError('weather-unavailable');
  return out;
}

async function fetchWithTimeout(url: string, init: RequestInit, outer?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  outer?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onAbort);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class KmaProxyProvider implements WeatherProvider {
  readonly id = 'kma';
  readonly attribution = '기상청';

  isConfigured(): boolean {
    return edgeFunctionEndpoint(FUNCTION_NAME) != null;
  }

  async fetch(q: WeatherQuery, signal?: AbortSignal) {
    const ep = edgeFunctionEndpoint(FUNCTION_NAME);
    if (!ep) throw new AppError('weather-unavailable');
    const url = `${ep.url}?nx=${q.grid.nx}&ny=${q.grid.ny}`;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (signal?.aborted) throw new AppError('weather-unavailable');
      try {
        const res = await fetchWithTimeout(url, { headers: { apikey: ep.key, Authorization: `Bearer ${ep.key}` } }, signal);
        if (res.ok) return parseKmaProxyResponse(await res.json(), q.locationLabel);
        // Retry only transient statuses; 4xx (except 429) are final.
        if (res.status !== 429 && res.status < 500) throw new AppError('weather-unavailable', undefined, new Error(`http-${res.status}`));
        lastErr = new Error(`http-${res.status}`);
      } catch (e) {
        if (e instanceof AppError) throw e;
        lastErr = e;
      }
      if (attempt < MAX_RETRIES) await sleep(500 * 2 ** attempt);
    }
    throw new AppError('weather-unavailable', undefined, lastErr);
  }
}
