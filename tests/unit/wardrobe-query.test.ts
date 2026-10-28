import type { GarmentItem } from '@/domain/models';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { emptyGarment, garmentFromTemplate } from '@/features/wardrobe/garment-draft';
import { queryWardrobe } from '@/features/wardrobe/wardrobe-query';

const g = (id: string, over: Partial<GarmentItem>): GarmentItem => ({ ...emptyGarment(), id, ...over });

const items = [
  g('a', { name: '화이트 셔츠', colorIds: ['white'], createdAt: '2026-10-01T00:00:00Z' }),
  g('b', { name: '데님 팬츠', category: 'bottom', brand: '노매뉴얼', colorIds: ['denimBlue'], createdAt: '2026-10-03T00:00:00Z' }),
  g('c', { name: '블랙 니트', colorIds: ['black'], styleTags: ['minimal'], createdAt: '2026-10-02T00:00:00Z' }),
];
const wear = new Map([
  ['a', { wearCount: 5, lastWornDay: '2026-10-20' }],
  ['c', { wearCount: 1, lastWornDay: '2026-10-05' }],
]);

describe('queryWardrobe', () => {
  it('searches name, brand, category, color and style labels', () => {
    expect(queryWardrobe(items, '노매뉴얼', 'recent', wear).map((x) => x.id)).toEqual(['b']);
    expect(queryWardrobe(items, '하의', 'recent', wear).map((x) => x.id)).toEqual(['b']);
    expect(queryWardrobe(items, '블랙 미니멀', 'recent', wear).map((x) => x.id)).toEqual(['c']);
    expect(queryWardrobe(items, '  ', 'recent', wear)).toHaveLength(3);
  });

  it('sorts by recent, wear count and least recently worn (never worn first)', () => {
    expect(queryWardrobe(items, '', 'recent', wear).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(queryWardrobe(items, '', 'mostWorn', wear).map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(queryWardrobe(items, '', 'leastRecentlyWorn', wear).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input', () => {
    const copy = [...items];
    queryWardrobe(items, '', 'name', wear);
    expect(items).toEqual(copy);
  });
});

describe('garmentFromTemplate', () => {
  it('pre-fills attributes, keeps provenance, never copies the sample photo', () => {
    const t = getTemplate('ph-coat-beige')!;
    const d = garmentFromTemplate(t);
    expect(d).toMatchObject({ name: t.nameKo, category: 'outer', sourceType: 'fromSample', fromTemplateId: t.id, outerWeight: 'medium', colorIds: ['beige'] });
    expect(d.thumbnailUri).toBeNull();
    expect(d.cutoutUri).toBeNull();
    expect(d.purchasePriceMinor).toBeNull();
  });
});
