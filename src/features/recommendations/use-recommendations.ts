import { useMemo } from 'react';

import type { Occasion } from '@/domain/categories';
import type { GarmentItem } from '@/domain/models';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { resolveWeatherSignal } from '@/features/weather/weather-signal';
import { garmentWearStats } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

import { recommend, type RecommendResult } from './engine';
import { candidatePool, ownedToRecItem } from './rec-items';

export type RecommendMode = 'ownedOnly' | 'withSamples';

/** Wires local data + taste + weather into the pure engine. No network involved. */
/** `focus: 'taste'` (취향 맞춤) scores without weather; `'weather'` (날씨 맞춤, default) uses it when enabled. */
export function useRecommendations(opts: { mode: RecommendMode; occasion: Occasion | null; excludedKeys: string[]; pinnedKeys: string[]; focus?: 'weather' | 'taste' }) {
  const { taste, weatherContext, weatherPrefs, dataVersion } = useAppState();
  const owned = useAsync(async () => {
    const [items, stats] = await Promise.all([listGarments(), garmentWearStats()]);
    return { items, stats };
  }, [dataVersion]);

  const ownedMap = useMemo(() => new Map<string, GarmentItem>((owned.data?.items ?? []).map((g) => [g.id, g])), [owned.data]);
  const weather = useMemo(() => resolveWeatherSignal(weatherContext), [weatherContext]);

  const result = useMemo<RecommendResult | null>(() => {
    if (!owned.data) return null;
    const recOwned = owned.data.items.map((g) => ownedToRecItem(g, owned.data!.stats.get(g.id)?.lastWornDay ?? null));
    return recommend({
      items: candidatePool(opts.mode, recOwned),
      taste,
      occasion: opts.occasion,
      weather,
      weatherEnabled: weatherPrefs.weatherRecommendationEnabled && opts.focus !== 'taste',
      excludedKeys: opts.excludedKeys,
      pinnedKeys: opts.pinnedKeys,
      recentOutfitSignatures: [],
    });
  }, [owned.data, opts.mode, opts.occasion, opts.excludedKeys, opts.pinnedKeys, opts.focus, taste, weather, weatherPrefs.weatherRecommendationEnabled]);

  return { result, ownedMap, ownedCount: owned.data?.items.length ?? 0, loading: owned.loading, error: owned.error, weather };
}
