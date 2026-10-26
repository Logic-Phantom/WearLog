import type { ForecastPeriod, WeatherSnapshot } from '@/domain/models';

import type { KmaGrid } from './kma-grid';

/**
 * Provider boundary (prompt §3.9). Swapping KMA for another licensed source must not touch
 * recommendation or screen code. Selection rationale: docs/WEATHER_PROVIDER.md.
 */
export interface WeatherQuery {
  grid: KmaGrid;
  /** City/구 label decided on-device (never coordinates). */
  locationLabel: string;
}

export interface WeatherProvider {
  readonly id: string;
  readonly attribution: string;
  isConfigured(): boolean;
  /** Snapshots for now/morning/afternoon/evening that the source actually has. */
  fetch(q: WeatherQuery, signal?: AbortSignal): Promise<Partial<Record<ForecastPeriod, WeatherSnapshot>>>;
}
