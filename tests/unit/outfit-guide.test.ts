import { DAILY_RANGE_LAYER_THRESHOLD_C } from '@/domain/recommendation-policy';
import type { WeatherSnapshot } from '@/domain/models';
import { outfitGuide } from '@/features/weather/outfit-guide';
import { resolveWeatherSignal } from '@/features/weather/weather-signal';

const snap = (over: Partial<WeatherSnapshot>): WeatherSnapshot => ({
  providerId: 'kma', locationLabel: '서울 중구', fetchedAt: '2026-10-28T06:41:02Z', validUntil: '2099-01-01T00:00:00Z', timezone: 'Asia/Seoul',
  observationTime: null, forecastFor: 'now', isForecast: false, temperatureC: 13.7, apparentTemperatureC: null, apparentTemperatureSource: 'unknown',
  minTemperatureC: 7, maxTemperatureC: 13, conditionLabelKo: '맑음', precipitationProbabilityPct: 0, precipitationMm: 0, precipitationType: 'none',
  windSpeedMps: 3.6, humidityPct: 18, attribution: '기상청', ...over,
});

describe('weather signal → 오늘 옷차림 가이드', () => {
  it('today in 서울 (13.7°C, 7~13°, calm, dry): chilly guide only', () => {
    const w = resolveWeatherSignal({ kind: 'snapshot', snapshot: snap({}) });
    expect(w.band).toBe('chilly');
    expect(w.layering).toBeNull();
    expect(outfitGuide(w).map((l) => l.icon)).toEqual(['shirt-outline']);
  });

  it(`adds 일교차 (≥${DAILY_RANGE_LAYER_THRESHOLD_C}°C), wind and rain lines only when reported`, () => {
    const w = resolveWeatherSignal({ kind: 'snapshot', snapshot: snap({ minTemperatureC: 6, maxTemperatureC: 18, windSpeedMps: 8, precipitationProbabilityPct: 70 }) });
    expect(w.layering).toEqual({ minC: 6, maxC: 18 });
    const g = outfitGuide(w);
    expect(g.map((l) => l.icon)).toEqual(['shirt-outline', 'swap-vertical-outline', 'flag-outline', 'umbrella-outline']);
    expect(g[1].text).toContain('일교차 12°C');
    expect(g[2].text).toContain('초속 8m');
  });

  it('missing low/high never invents a range; no weather → no guide', () => {
    expect(resolveWeatherSignal({ kind: 'snapshot', snapshot: snap({ minTemperatureC: null }) }).layering).toBeNull();
    expect(outfitGuide(resolveWeatherSignal({ kind: 'none', reason: 'disabled' }))).toEqual([]);
    expect(outfitGuide(resolveWeatherSignal({ kind: 'manual', manual: 'indoor' }))[0].icon).toBe('home-outline');
  });
});
