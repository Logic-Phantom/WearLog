import type { SampleOutfitPreset } from '@/domain/models';

/**
 * Editable sample outfits built from the photo samples (prompt §3.2: ≥ 8). Style examples — never
 * "트렌드 1위" or a right answer. Validated by tests/unit/sample-catalog.test.ts.
 */
export const SAMPLE_PRESETS: readonly SampleOutfitPreset[] = [
  {
    id: 'preset-jacket-wide-black',
    title: '블랙 집업 재킷 + 와이드 슬랙스',
    description: '시티보이 무드의 올블랙 레이어드',
    styleTags: ['cityboy', 'minimal'],
    occasion: 'daily',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-tee-white', customization: { colorId: 'white' } },
      { templateId: 'ph-slacks-black', customization: { colorId: 'black' } },
      { templateId: 'ph-zip-jacket-black', customization: { colorId: 'black' } },
      { templateId: 'ph-sneakers-white', customization: { colorId: 'white' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-cream-knit-denim',
    title: '크림 니트 + 라이트 데님',
    description: '부드러운 크림 니트에 와이드 데님, 호보백',
    styleTags: ['casual', 'minimal'],
    occasion: 'daily',
    seasons: ['fall', 'winter'],
    items: [
      { templateId: 'ph-knit-cream', customization: { colorId: 'cream' } },
      { templateId: 'ph-jeans-light', customization: { colorId: 'lightBlue' } },
      { templateId: 'ph-sneakers-white', customization: { colorId: 'white' } },
      { templateId: 'ph-hobo-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-hoodie-black-pants',
    title: '그레이 후드티 + 블랙 데님',
    description: '편한 원마일웨어 조합',
    styleTags: ['casual', 'street'],
    occasion: 'daily',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-hoodie-gray', customization: { colorId: 'gray' } },
      { templateId: 'ph-jeans-black', customization: { colorId: 'charcoal' } },
      { templateId: 'ph-runner-gray', customization: { colorId: 'gray' } },
      { templateId: 'ph-backpack-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-trench-commute',
    title: '베이지 코트 출근룩',
    description: '싱글 코트와 차콜 슬랙스, 로퍼로 정돈한 출근 코디',
    styleTags: ['classic', 'minimal'],
    occasion: 'work',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-knit-black', customization: { colorId: 'black' } },
      { templateId: 'ph-slacks-charcoal', customization: { colorId: 'charcoal' } },
      { templateId: 'ph-coat-beige', customization: { colorId: 'beige' } },
      { templateId: 'ph-loafers-black', customization: { colorId: 'black' } },
      { templateId: 'ph-shoulder-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-navy-shirt-ivory',
    title: '네이비 셔츠 + 아이보리 팬츠',
    description: '셔츠 한 장으로 끝내는 깔끔한 간절기 코디',
    styleTags: ['classic', 'cityboy'],
    occasion: 'date',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-shirt-navy', customization: { colorId: 'navy' } },
      { templateId: 'ph-pants-ivory', customization: { colorId: 'cream' } },
      { templateId: 'ph-sneakers-white', customization: { colorId: 'white' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-blouson-headphones',
    title: '아이보리 블루종 + 헤드폰',
    description: '밝은 블루종에 화이트 티, 백팩으로 캠퍼스 무드',
    styleTags: ['casual', 'cityboy'],
    occasion: 'daily',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-tee-white', customization: { colorId: 'white' } },
      { templateId: 'ph-jeans-mid', customization: { colorId: 'denimBlue' } },
      { templateId: 'ph-blouson-ivory', customization: { colorId: 'cream' } },
      { templateId: 'ph-shoes-black', customization: { colorId: 'black' } },
      { templateId: 'ph-backpack-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-puffer-winter',
    title: '블랙 숏패딩 겨울 코디',
    description: '숏패딩과 라이트 데님, 러닝화',
    styleTags: ['street', 'casual'],
    occasion: 'daily',
    seasons: ['winter'],
    items: [
      { templateId: 'ph-zip-hoodie-black', customization: { colorId: 'black' } },
      { templateId: 'ph-jeans-light', customization: { colorId: 'lightBlue' } },
      { templateId: 'ph-puffer-black', customization: { colorId: 'black' } },
      { templateId: 'ph-runner-gray', customization: { colorId: 'gray' } },
      { templateId: 'ph-backpack-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-charcoal-knit-skirt',
    title: '차콜 니트 + 롱스커트',
    description: '차분한 모노톤에 롱스커트, 로퍼',
    styleTags: ['minimal', 'classic'],
    occasion: 'date',
    seasons: ['fall', 'winter'],
    items: [
      { templateId: 'ph-knit-charcoal', customization: { colorId: 'charcoal' } },
      { templateId: 'ph-skirt-black', customization: { colorId: 'black' } },
      { templateId: 'ph-loafers-black', customization: { colorId: 'black' } },
      { templateId: 'ph-hobo-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
  {
    id: 'preset-white-shirt-cardigan',
    title: '화이트 셔츠 + 그레이 가디건',
    description: '셔츠 위 가디건, 블랙 슬랙스로 단정하게',
    styleTags: ['minimal', 'classic'],
    occasion: 'work',
    seasons: ['spring', 'fall'],
    items: [
      { templateId: 'ph-shirt-white', customization: { colorId: 'white' } },
      { templateId: 'ph-slacks-black', customization: { colorId: 'black' } },
      { templateId: 'ph-cardigan-gray', customization: { colorId: 'gray' } },
      { templateId: 'ph-loafers-black', customization: { colorId: 'black' } },
    ],
    catalogVersion: 2,
  },
];

export function getPreset(id: string): SampleOutfitPreset | undefined {
  return SAMPLE_PRESETS.find((p) => p.id === id);
}
