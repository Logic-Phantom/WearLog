import type { GarmentItem, SampleGarmentTemplate } from '@/domain/models';
import { RECOMMENDABLE_SAMPLES } from '@/features/sample-wardrobe/catalog';

import type { RecItem } from './engine';

const DAY_MS = 24 * 60 * 60 * 1000;

export function ownedToRecItem(g: GarmentItem, lastWornDay: string | null, today: Date = new Date()): RecItem {
  const days = lastWornDay ? Math.floor((today.getTime() - new Date(`${lastWornDay}T00:00:00`).getTime()) / DAY_MS) : null;
  return {
    key: `owned:${g.id}`,
    ref: { kind: 'ownedGarment', garmentItemId: g.id },
    name: g.name,
    category: g.category,
    colorIds: g.colorIds,
    styleTags: g.styleTags,
    seasonTags: g.seasonTags,
    occasionTags: g.occasionTags,
    outerWeight: g.outerWeight,
    waterResistant: g.waterResistant,
    daysSinceWorn: days,
  };
}

export function sampleToRecItem(t: SampleGarmentTemplate): RecItem {
  return {
    key: `sample:${t.id}`,
    ref: { kind: 'sampleTemplate', templateId: t.id, customization: { colorId: t.defaultColorId, fit: t.supportedFits[0] } },
    name: t.nameKo,
    category: t.category,
    colorIds: [t.defaultColorId],
    styleTags: t.styleTags,
    seasonTags: t.seasonTags,
    occasionTags: [],
    outerWeight: t.outerWeight ?? null,
    waterResistant: null,
    daysSinceWorn: null,
  };
}

/**
 * Candidate pool by mode. "내 옷만" (default) never includes samples; "샘플 포함" is an explicit
 * opt-in and keeps each item's provenance in its `ref` (prompt §3.5).
 */
export function candidatePool(mode: 'ownedOnly' | 'withSamples', owned: RecItem[]): RecItem[] {
  return mode === 'ownedOnly' ? owned : [...owned, ...RECOMMENDABLE_SAMPLES.map(sampleToRecItem)];
}
