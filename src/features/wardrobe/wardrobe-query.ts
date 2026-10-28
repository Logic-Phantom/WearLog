import { GARMENT_CATEGORIES, STYLE_TAGS, labelOf } from '@/domain/categories';
import type { GarmentItem, ISODate } from '@/domain/models';
import { getColor } from '@/domain/palette';

export type WardrobeSort = 'recent' | 'name' | 'mostWorn' | 'leastRecentlyWorn';

export const WARDROBE_SORTS: readonly { id: WardrobeSort; label: string }[] = [
  { id: 'recent', label: '최근 등록' },
  { id: 'name', label: '이름순' },
  { id: 'mostWorn', label: '많이 입은' },
  { id: 'leastRecentlyWorn', label: '오래 안 입은' },
];

export interface WearInfo {
  wearCount: number;
  lastWornDay: ISODate | null;
}

function haystack(g: GarmentItem): string {
  return [g.name, g.brand, g.note, labelOf(GARMENT_CATEGORIES, g.category), ...g.colorIds.map((id) => getColor(id)?.nameKo), ...g.styleTags.map((t) => labelOf(STYLE_TAGS, t))]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Local search (name·brand·memo·category·color·style) + sort. Pure; the list is already on device. */
export function queryWardrobe(items: GarmentItem[], query: string, sort: WardrobeSort, wear: Map<string, WearInfo>): GarmentItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = terms.length ? items.filter((g) => terms.every((t) => haystack(g).includes(t))) : [...items];
  const count = (g: GarmentItem) => wear.get(g.id)?.wearCount ?? 0;
  // Never worn sorts as the oldest ('' < any date).
  const last = (g: GarmentItem) => wear.get(g.id)?.lastWornDay ?? '';
  switch (sort) {
    case 'name':
      return hits.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    case 'mostWorn':
      return hits.sort((a, b) => count(b) - count(a) || b.createdAt.localeCompare(a.createdAt));
    case 'leastRecentlyWorn':
      return hits.sort((a, b) => last(a).localeCompare(last(b)) || a.createdAt.localeCompare(b.createdAt));
    default:
      return hits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
