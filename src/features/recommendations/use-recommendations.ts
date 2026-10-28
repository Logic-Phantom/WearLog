import { useMemo } from 'react';

import type { Occasion } from '@/domain/categories';
import type { GarmentItem } from '@/domain/models';
import { SIMILAR_OUTFIT_LOOKBACK_DAYS } from '@/domain/recommendation-policy';
import { localDay } from '@/domain/wear';
import { listOutfits } from '@/features/outfit-builder/outfit-repository';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { resolveWeatherSignal } from '@/features/weather/weather-signal';
import { garmentWearStats, listWearsBetween } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';

import { recommend, type RecommendResult } from './engine';
import { candidatePool, ownedToRecItem, refsSignature } from './rec-items';

export type RecommendMode = 'ownedOnly' | 'withSamples';

/** Wires local data + taste + weather into the pure engine. No network involved. */
/** `focus: 'taste'` (취향 맞춤) scores without weather; `'weather'` (날씨 맞춤, default) uses it when enabled. */
export function useRecommendations(opts: { mode: RecommendMode; occasion: Occasion | null; excludedKeys: string[]; pinnedKeys: string[]; focus?: 'weather' | 'taste' }) {
  const { taste, weatherContext, weatherPrefs, dataVersion } = useAppState();
  const owned = useAsync(async () => {
    const since = new Date(Date.now() - SIMILAR_OUTFIT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const [items, stats, outfits, wears] = await Promise.all([listGarments(), garmentWearStats(), listOutfits(), listWearsBetween(localDay(since), localDay(new Date()))]);
    // Recently saved or worn outfits → similar-outfit penalty (same key format as engine signatures).
    const signatures = new Set<string>();
    for (const o of outfits) if (o.updatedAt >= since.toISOString()) signatures.add(refsSignature(o.itemRefs));
    for (const w of wears) {
      const o = w.outfitId ? outfits.find((x) => x.id === w.outfitId) : null;
      signatures.add(o ? refsSignature(o.itemRefs) : refsSignature(w.garmentIds.map((id) => ({ kind: 'ownedGarment' as const, garmentItemId: id }))));
    }
    return { items, stats, signatures: [...signatures] };
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
      recentOutfitSignatures: owned.data.signatures,
    });
  }, [owned.data, opts.mode, opts.occasion, opts.excludedKeys, opts.pinnedKeys, opts.focus, taste, weather, weatherPrefs.weatherRecommendationEnabled]);

  return { result, ownedMap, ownedCount: owned.data?.items.length ?? 0, loading: owned.loading, error: owned.error, weather };
}
