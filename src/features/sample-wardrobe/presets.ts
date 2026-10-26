import type { SampleOutfitPreset } from '@/domain/models';

/**
 * Editable sample outfits (prompt §3.2: ≥ 8). Style examples — never "트렌드 1위" or a right answer.
 * Validated by tests/unit/sample-catalog.test.ts (template refs, color support, slot rules).
 */
export const SAMPLE_PRESETS: readonly SampleOutfitPreset[] = [
  {
    id: 'preset-white-tee-wide-denim',
    title: '화이트 티 + 와이드 데님',
    description: '반팔 티셔츠와 와이드 청바지, 화이트 스니커즈의 기본 조합',
    styleTags: ['casual', 'street'],
    occasion: 'daily',
    seasons: ['summer', 'spring'],
    items: [
      { templateId: 'tee-short', customization: { colorId: 'white', fit: 'oversized' } },
      { templateId: 'jeans', customization: { colorId: 'denimBlue', fit: 'wide' } },
      { templateId: 'sneakers', customization: { colorId: 'white' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-black-long-gray-slacks',
    title: '블랙 긴팔 + 그레이 슬랙스',
    description: '모노톤으로 정돈한 출근 코디',
    styleTags: ['minimal'],
    occasion: 'work',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'tee-long', customization: { colorId: 'black' } },
      { templateId: 'slacks', customization: { colorId: 'gray', fit: 'straight' } },
      { templateId: 'loafers', customization: { colorId: 'black' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-stripe-chino-navy',
    title: '스트라이프 셔츠 + 치노 + 네이비 아우터',
    description: '클래식한 봄·가을 레이어드',
    styleTags: ['classic', 'cityboy'],
    occasion: 'date',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'shirt', customization: { colorId: 'lightBlue', pattern: 'stripe' } },
      { templateId: 'chino', customization: { colorId: 'beige', fit: 'straight' } },
      { templateId: 'blazer', customization: { colorId: 'navy' } },
      { templateId: 'loafers', customization: { colorId: 'brown' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-gray-hoodie-cargo',
    title: '그레이 후드 + 블랙 카고',
    description: '편하게 입는 스트릿 조합',
    styleTags: ['street'],
    occasion: 'daily',
    seasons: ['fall', 'spring'],
    items: [
      { templateId: 'hoodie', customization: { colorId: 'gray', fit: 'oversized' } },
      { templateId: 'cargo', customization: { colorId: 'black', fit: 'wide' } },
      { templateId: 'sneakers', customization: { colorId: 'black' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-knit-denim-coat',
    title: '니트 + 스트레이트 데님 + 코트',
    description: '쌀쌀한 날의 기본 레이어',
    styleTags: ['minimal', 'classic'],
    occasion: 'daily',
    seasons: ['fall', 'winter'],
    items: [
      { templateId: 'knit', customization: { colorId: 'cream' } },
      { templateId: 'jeans', customization: { colorId: 'denimBlue', fit: 'straight' } },
      { templateId: 'long-coat', customization: { colorId: 'charcoal' } },
      { templateId: 'boots', customization: { colorId: 'brown' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-tee-shorts-cap',
    title: '티셔츠 + 쇼츠 + 캡',
    description: '더운 날 가볍게',
    styleTags: ['casual', 'sporty'],
    occasion: 'outdoor',
    seasons: ['summer'],
    items: [
      { templateId: 'tee-short', customization: { colorId: 'navy' } },
      { templateId: 'shorts', customization: { colorId: 'beige' } },
      { templateId: 'sneakers', customization: { colorId: 'white' } },
      { templateId: 'cap', customization: { colorId: 'black' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-earth-tonal',
    title: '어스톤 톤온톤',
    description: '브라운·베이지 계열로 맞춘 조합',
    styleTags: ['workwear', 'minimal'],
    occasion: 'travel',
    seasons: ['fall'],
    items: [
      { templateId: 'sweatshirt', customization: { colorId: 'beige' } },
      { templateId: 'chino', customization: { colorId: 'brown', fit: 'straight' } },
      { templateId: 'trench', customization: { colorId: 'beige' } },
      { templateId: 'boots', customization: { colorId: 'brown' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-mono-street',
    title: '모노크롬 스트릿',
    description: '블랙·화이트만으로 맞춘 조합',
    styleTags: ['street', 'minimal'],
    occasion: 'daily',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'tee-long', customization: { colorId: 'white', fit: 'oversized' } },
      { templateId: 'track', customization: { colorId: 'black', fit: 'wide' } },
      { templateId: 'sneakers', customization: { colorId: 'black' } },
      { templateId: 'crossbody', customization: { colorId: 'black' } },
    ],
    catalogVersion: 1,
  },
  {
    id: 'preset-winter-padding',
    title: '패딩 + 비니',
    description: '매우 추운 날의 보온 조합',
    styleTags: ['street', 'gorpcore'],
    occasion: 'daily',
    seasons: ['winter'],
    items: [
      { templateId: 'hoodie', customization: { colorId: 'charcoal' } },
      { templateId: 'cargo', customization: { colorId: 'olive', fit: 'straight' } },
      { templateId: 'padding', customization: { colorId: 'black' } },
      { templateId: 'boots', customization: { colorId: 'black' } },
      { templateId: 'beanie', customization: { colorId: 'gray' } },
    ],
    catalogVersion: 1,
  },
];

export function getPreset(id: string): SampleOutfitPreset | undefined {
  return SAMPLE_PRESETS.find((p) => p.id === id);
}
