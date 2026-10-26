/** Controlled vocabularies shared by wardrobe, samples, recommendations and community. */

export const GARMENT_CATEGORIES = [
  { id: 'top', label: '상의', required: true },
  { id: 'bottom', label: '하의', required: true },
  { id: 'outer', label: '아우터', required: false },
  { id: 'onepiece', label: '원피스·점프수트', required: false },
  { id: 'shoes', label: '신발', required: true },
  { id: 'bag', label: '가방', required: false },
  { id: 'hat', label: '모자', required: false },
  { id: 'accessory', label: '액세서리', required: false },
  { id: 'other', label: '기타', required: false },
] as const;

export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number]['id'];

export const SEASONS = [
  { id: 'spring', label: '봄' },
  { id: 'summer', label: '여름' },
  { id: 'fall', label: '가을' },
  { id: 'winter', label: '겨울' },
] as const;
export type Season = (typeof SEASONS)[number]['id'];

export const STYLE_TAGS = [
  { id: 'street', label: '스트릿' },
  { id: 'cityboy', label: '시티보이' },
  { id: 'minimal', label: '미니멀' },
  { id: 'gorpcore', label: '고프코어' },
  { id: 'casual', label: '캐주얼' },
  { id: 'classic', label: '클래식' },
  { id: 'workwear', label: '워크웨어' },
  { id: 'sporty', label: '스포츠 믹스' },
] as const;
export type StyleTag = (typeof STYLE_TAGS)[number]['id'];

export const OCCASIONS = [
  { id: 'daily', label: '데일리' },
  { id: 'work', label: '출근·학교' },
  { id: 'date', label: '데이트' },
  { id: 'travel', label: '여행' },
  { id: 'outdoor', label: '야외 활동' },
  { id: 'special', label: '특별한 약속' },
] as const;
export type Occasion = (typeof OCCASIONS)[number]['id'];

export const FITS = [
  { id: 'regular', label: '레귤러' },
  { id: 'oversized', label: '오버핏' },
  { id: 'slim', label: '슬림' },
  { id: 'wide', label: '와이드' },
  { id: 'straight', label: '스트레이트' },
  { id: 'tapered', label: '테이퍼드' },
  { id: 'cropped', label: '크롭' },
  { id: 'long', label: '롱라인' },
] as const;
export type Fit = (typeof FITS)[number]['id'];

export const PATTERNS = [
  { id: 'solid', label: '무지' },
  { id: 'stripe', label: '스트라이프' },
  { id: 'check', label: '체크' },
  { id: 'denimWash', label: '데님 워시' },
  { id: 'graphic', label: '그래픽' },
] as const;
export type Pattern = (typeof PATTERNS)[number]['id'];

/** Outer weight is user-entered; recommendations never guess it from a photo. */
export const OUTER_WEIGHTS = [
  { id: 'light', label: '얇음' },
  { id: 'medium', label: '보통' },
  { id: 'heavy', label: '두꺼움' },
] as const;
export type OuterWeight = (typeof OUTER_WEIGHTS)[number]['id'];

export function labelOf<T extends { id: string; label: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}
