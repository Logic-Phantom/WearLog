/**
 * Single source of garment colors (prompt §3.2). Recommendations reason over `colorId` + `family`,
 * never over raw HEX; UI reads HEX from here only.
 */

export type ColorFamily = 'neutral' | 'earth' | 'denim' | 'cool' | 'warm' | 'pastel';

export interface GarmentColor {
  id: string;
  nameKo: string;
  hex: string;
  /** 0 = dark … 2 = light. Used for contrast rules and for drawing a ring around light swatches. */
  luminanceGroup: 0 | 1 | 2;
  family: ColorFamily;
}

export const GARMENT_COLORS = [
  { id: 'white', nameKo: '화이트', hex: '#F7F7F4', luminanceGroup: 2, family: 'neutral' },
  { id: 'cream', nameKo: '크림', hex: '#EDE1C8', luminanceGroup: 2, family: 'earth' },
  { id: 'black', nameKo: '블랙', hex: '#191919', luminanceGroup: 0, family: 'neutral' },
  { id: 'charcoal', nameKo: '차콜', hex: '#3F4145', luminanceGroup: 0, family: 'neutral' },
  { id: 'gray', nameKo: '그레이', hex: '#A8ABB0', luminanceGroup: 1, family: 'neutral' },
  { id: 'navy', nameKo: '네이비', hex: '#1F3150', luminanceGroup: 0, family: 'cool' },
  { id: 'beige', nameKo: '베이지', hex: '#D8C1A0', luminanceGroup: 2, family: 'earth' },
  { id: 'brown', nameKo: '브라운', hex: '#76513D', luminanceGroup: 0, family: 'earth' },
  { id: 'olive', nameKo: '올리브', hex: '#737B4E', luminanceGroup: 1, family: 'earth' },
  { id: 'denimBlue', nameKo: '데님 블루', hex: '#4776A8', luminanceGroup: 1, family: 'denim' },
  { id: 'lightBlue', nameKo: '라이트 블루', hex: '#A9CDE8', luminanceGroup: 2, family: 'pastel' },
  { id: 'red', nameKo: '레드', hex: '#C63E43', luminanceGroup: 1, family: 'warm' },
  { id: 'burgundy', nameKo: '버건디', hex: '#702E43', luminanceGroup: 0, family: 'warm' },
  { id: 'green', nameKo: '그린', hex: '#47785F', luminanceGroup: 1, family: 'cool' },
  { id: 'pink', nameKo: '핑크', hex: '#E8B9C8', luminanceGroup: 2, family: 'pastel' },
  { id: 'yellow', nameKo: '옐로', hex: '#E6D36F', luminanceGroup: 2, family: 'warm' },
] as const satisfies readonly GarmentColor[];

export type ColorId = (typeof GARMENT_COLORS)[number]['id'];

const BY_ID = new Map<string, GarmentColor>(GARMENT_COLORS.map((c) => [c.id, c]));

export function isColorId(id: string): id is ColorId {
  return BY_ID.has(id);
}

export function getColor(id: string): GarmentColor | undefined {
  return BY_ID.get(id);
}

export function colorHex(id: string): string {
  return BY_ID.get(id)?.hex ?? '#A8ABB0';
}

/** Slightly darker outline for vector garments, derived (not hand-picked per color). */
export function shadeHex(hex: string, amount = 0.18): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.round(((n >> shift) & 0xff) * (1 - amount)));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Color harmony used by the recommendation engine. Kept deliberately simple and explainable:
 * neutrals pair with anything; at most one "loud" (warm/pastel) color per outfit; earth+denim ok.
 * Returns the rule that fired so the reason shown to the user matches what was computed.
 */
export function harmonyRule(colorIds: string[]): { score: number; rule: 'tonal' | 'neutralBase' | 'oneAccent' | 'clash' } {
  const colors = colorIds.map((id) => BY_ID.get(id)).filter((c): c is GarmentColor => !!c);
  if (colors.length === 0) return { score: 0, rule: 'neutralBase' };
  const families = new Set(colors.map((c) => c.family));
  const loud = colors.filter((c) => c.family === 'warm' || c.family === 'pastel');
  if (families.size === 1) return { score: 1, rule: 'tonal' };
  if (loud.length >= 2 && new Set(loud.map((c) => c.id)).size >= 2) return { score: -1, rule: 'clash' };
  if (loud.length === 1) return { score: 0.6, rule: 'oneAccent' };
  return { score: 0.8, rule: 'neutralBase' };
}
