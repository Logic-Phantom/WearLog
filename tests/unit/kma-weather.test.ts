import type { WeatherSnapshot } from '@/domain/models';
import { temperatureBand } from '@/domain/recommendation-policy';
import { estimateWindChillC } from '@/features/weather/apparent-temperature';
import { resolveWeatherSignal, snapshotSummary } from '@/features/weather/weather-signal';
import { isInKmaDomain, latLonToKmaGrid } from '@/infrastructure/weather-providers/kma-grid';
import { parseKmaProxyResponse } from '@/infrastructure/weather-providers/kma-proxy-provider';
import { nearestArea } from '@/infrastructure/weather-providers/korea-areas';

describe('KMA grid conversion', () => {
  it.each([
    ['서울시청', 37.5665, 126.978, 60, 127],
    ['부산시청', 35.1796, 129.0756, 98, 76],
    ['제주시', 33.4996, 126.5312, 53, 38],
  ])('%s → (%i,%i)', (_n, lat, lon, nx, ny) => {
    expect(latLonToKmaGrid(lat, lon)).toEqual({ nx, ny });
  });

  it('flags points outside the KMA domain', () => {
    expect(isInKmaDomain(latLonToKmaGrid(48.8566, 2.3522))).toBe(false);
  });

  it('labels a fix at city/구 level from the bundled list', () => {
    expect(nearestArea(37.5172, 127.0473).label).toBe('서울 강남구');
  });
});

describe('temperature bands', () => {
  it.each([
    [5, 'freezing'],
    [5.4, 'freezing'],
    [6, 'cold'],
    [12, 'cold'],
    [13, 'chilly'],
    [18, 'chilly'],
    [19, 'mild'],
    [23, 'mild'],
    [24, 'warm'],
    [27, 'warm'],
    [28, 'hot'],
  ])('%p°C → %s', (t, band) => {
    expect(temperatureBand(t)).toBe(band);
  });
});

describe('apparent temperature', () => {
  it('estimates wind chill only in its valid range (≤10°C, ≥4.8 km/h)', () => {
    expect(estimateWindChillC(12, 3)).toBeNull();
    expect(estimateWindChillC(20, 5)).toBeNull();
    expect(estimateWindChillC(5, 0.5)).toBeNull();
    expect(estimateWindChillC(0, 5)).toBeLessThan(0);
    expect(estimateWindChillC(null, 5)).toBeNull();
  });
});

const NOW = new Date('2026-10-26T03:00:00Z');
const raw = {
  fetchedAt: '2026-10-26T03:00:00Z',
  validUntil: '2026-10-26T04:00:00Z',
  periods: {
    now: { isForecast: false, forecastTime: null, temperatureC: 8, minTemperatureC: 6, maxTemperatureC: 14, conditionLabelKo: '비', precipitationProbabilityPct: 60, precipitationMm: 1, precipitationType: 'rain', windSpeedMps: 3, humidityPct: 80 },
    afternoon: { isForecast: true, forecastTime: '2026-10-26T15:00:00+09:00', temperatureC: 'bad', precipitationType: 'acid' },
  },
};

describe('KMA proxy response parsing', () => {
  it('keeps provider fields and nulls anything malformed (never invents values)', () => {
    const b = parseKmaProxyResponse(raw, '서울 중구');
    expect(b.now!.temperatureC).toBe(8);
    expect(b.now!.apparentTemperatureSource).toBe('estimated');
    expect(b.afternoon!.temperatureC).toBeNull();
    expect(b.afternoon!.precipitationType).toBeNull();
    expect(b.afternoon!.apparentTemperatureSource).toBe('unknown');
    expect(b.morning).toBeUndefined();
    expect(b.now!.attribution).toBe('기상청');
  });

  it('rejects a response without the required envelope', () => {
    expect(() => parseKmaProxyResponse({ periods: {} }, 'x')).toThrow();
    expect(() => parseKmaProxyResponse(null, 'x')).toThrow();
  });
});

describe('weather signal', () => {
  const snap = parseKmaProxyResponse(raw, '서울 중구').now as WeatherSnapshot;

  it('quotes only real values and flags rain', () => {
    const s = resolveWeatherSignal({ kind: 'snapshot', snapshot: snap }, NOW);
    expect(s.band).toBe('cold');
    expect(s.rainLikely).toBe(true);
    expect(s.summary).toContain('현재 8°C');
    expect(s.summary).toContain('강수확률 60%');
    expect(s.summary).toContain('(추정)');
  });

  it('treats stale snapshots as no weather', () => {
    const s = resolveWeatherSignal({ kind: 'snapshot', snapshot: snap }, new Date('2026-10-26T05:00:00Z'));
    expect(s.source).toBe('none');
    expect(s.band).toBeNull();
  });

  it('manual "indoor" disables weather-driven layering', () => {
    expect(resolveWeatherSignal({ kind: 'manual', manual: 'indoor' })).toMatchObject({ indoor: true, band: null });
  });

  it('omits missing fields from the summary', () => {
    expect(snapshotSummary({ ...snap, apparentTemperatureC: null, apparentTemperatureSource: 'unknown', precipitationProbabilityPct: null })).toBe('현재 8°C');
  });
});

describe('weather-kma live response (2026-10-28, 서울 nx=60 ny=127)', () => {
  // Captured from the deployed Edge Function — keeps the app parser in step with the real proxy output.
  const live = {
    fetchedAt: '2026-10-28T06:41:02.859Z',
    validUntil: '2026-10-28T07:41:02.859Z',
    periods: {
      now: { isForecast: false, forecastTime: '2026-10-28T16:00:00+09:00', temperatureC: 13.7, minTemperatureC: 7, maxTemperatureC: 13, conditionLabelKo: '맑음', precipitationProbabilityPct: 0, precipitationMm: 0, precipitationType: 'none', windSpeedMps: 3.6, humidityPct: 18 },
      evening: { isForecast: true, forecastTime: '2026-10-28T19:00:00+09:00', temperatureC: 9, conditionLabelKo: '맑음', precipitationProbabilityPct: 0, precipitationMm: 0, precipitationType: 'none', windSpeedMps: 0.8, humidityPct: 60, minTemperatureC: 7, maxTemperatureC: 13 },
    },
  };

  it('parses the real proxy output without inventing missing periods', () => {
    const b = parseKmaProxyResponse(live, '서울 중구');
    expect(b.now).toMatchObject({ temperatureC: 13.7, conditionLabelKo: '맑음', precipitationProbabilityPct: 0, humidityPct: 18, attribution: '기상청' });
    expect(b.evening?.temperatureC).toBe(9);
    expect(b.morning).toBeUndefined();
    expect(b.afternoon).toBeUndefined();
  });
});
