import type { GarmentItem, SampleCustomization, SampleGarmentTemplate } from '@/domain/models';
import { newId } from '@/utils/id';

export function emptyGarment(): GarmentItem {
  const now = new Date().toISOString();
  return {
    id: newId('g_'),
    name: '',
    category: 'top',
    subcategory: null,
    sourceType: 'manual',
    originalUri: null,
    thumbnailUri: null,
    cutoutUri: null,
    colorIds: ['black'],
    pattern: 'solid',
    fit: null,
    seasonTags: [],
    styleTags: [],
    occasionTags: [],
    outerWeight: null,
    waterResistant: null,
    brand: null,
    sizeLabel: null,
    purchasePriceMinor: null,
    currency: 'KRW',
    purchasedAt: null,
    note: null,
    status: 'active',
    userVerifiedFields: [],
    fromTemplateId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * "샘플 → 내 옷으로 등록": a NEW owned draft pre-filled from the template's attributes. The sample's
 * photo is never copied (it is not a photo of the user's garment); provenance stays in
 * `sourceType: 'fromSample'` + `fromTemplateId`, and nothing is saved until the user taps 등록.
 */
export function garmentFromTemplate(t: SampleGarmentTemplate, custom?: SampleCustomization): GarmentItem {
  return {
    ...emptyGarment(),
    name: t.nameKo,
    category: t.category,
    subcategory: t.subcategory,
    sourceType: 'fromSample',
    colorIds: [custom?.colorId ?? t.defaultColorId],
    pattern: custom?.pattern ?? t.supportedPatterns[0] ?? 'solid',
    fit: custom?.fit ?? null,
    seasonTags: [...t.seasonTags],
    styleTags: [...t.styleTags],
    outerWeight: t.outerWeight ?? null,
    fromTemplateId: t.id,
  };
}
