import type { Fit, Occasion, StyleTag } from '@/domain/categories';
import type { ColorId } from '@/domain/palette';
import type { SampleCustomization } from '@/domain/models';

/**
 * Visual taste cards (prompt §3.1). Each card is drawn from the self-made sample vectors (no
 * downloaded photos), so every card shares background, lighting and angle and differs only in the
 * style/fit/color being compared. Licensed photo cards can replace these later — record them in
 * docs/IMAGE_ASSET_ATTRIBUTIONS.md first.
 */
export interface StyleCard {
  id: string;
  questionId: 'style' | 'fit' | 'color' | 'occasion';
  label: string;
  styleTags: StyleTag[];
  fits?: Fit[];
  colorIds?: ColorId[];
  occasions?: Occasion[];
  preview: { templateId: string; customization: SampleCustomization }[];
}

export const TASTE_QUESTIONS = [
  { id: 'style', title: '끌리는 스타일을 골라 주세요', hint: '여러 개 골라도 돼요' },
  { id: 'fit', title: '선호하는 실루엣은?', hint: '평소 자주 입는 핏을 골라 주세요' },
  { id: 'color', title: '좋아하는 색감은?', hint: '옷장에서 자주 보이는 색을 떠올려 보세요' },
  { id: 'occasion', title: '주로 어떤 날 입나요?', hint: '추천할 때 상황을 먼저 고려해요' },
] as const;

const p = (templateId: string, colorId: ColorId, fit?: Fit) => ({ templateId, customization: { colorId, fit } });

export const STYLE_CARDS: readonly StyleCard[] = [
  { id: 'style-street', questionId: 'style', label: '스트릿', styleTags: ['street'], preview: [p('hoodie', 'charcoal', 'oversized'), p('cargo', 'black', 'wide')] },
  { id: 'style-cityboy', questionId: 'style', label: '시티보이', styleTags: ['cityboy'], preview: [p('shirt-oxford', 'lightBlue', 'oversized'), p('chino', 'beige', 'straight')] },
  { id: 'style-minimal', questionId: 'style', label: '미니멀', styleTags: ['minimal'], preview: [p('tee-long', 'black'), p('slacks', 'charcoal', 'straight')] },
  { id: 'style-gorpcore', questionId: 'style', label: '고프코어', styleTags: ['gorpcore'], preview: [p('windbreaker', 'green'), p('cargo', 'olive', 'straight')] },
  { id: 'style-casual', questionId: 'style', label: '캐주얼', styleTags: ['casual'], preview: [p('tee-short', 'white'), p('jeans', 'denimBlue', 'straight')] },
  { id: 'style-classic', questionId: 'style', label: '클래식', styleTags: ['classic'], preview: [p('blazer', 'navy'), p('slacks', 'gray', 'straight')] },
  { id: 'style-workwear', questionId: 'style', label: '워크웨어', styleTags: ['workwear'], preview: [p('bomber', 'brown'), p('cargo', 'beige', 'straight')] },
  { id: 'style-sporty', questionId: 'style', label: '스포츠 믹스', styleTags: ['sporty'], preview: [p('tee-short', 'black'), p('track', 'navy', 'wide')] },

  { id: 'fit-oversized', questionId: 'fit', label: '오버핏', styleTags: [], fits: ['oversized', 'wide'], preview: [p('tee-short', 'gray', 'oversized'), p('jeans', 'denimBlue', 'wide')] },
  { id: 'fit-regular', questionId: 'fit', label: '레귤러', styleTags: [], fits: ['regular', 'straight'], preview: [p('tee-short', 'gray', 'regular'), p('jeans', 'denimBlue', 'straight')] },
  { id: 'fit-slim', questionId: 'fit', label: '슬림', styleTags: [], fits: ['slim'], preview: [p('tee-short', 'gray', 'regular'), p('jeans', 'denimBlue', 'slim')] },
  { id: 'fit-long', questionId: 'fit', label: '롱라인', styleTags: [], fits: ['long'], preview: [p('long-coat', 'gray'), p('skirt', 'gray', 'long')] },

  { id: 'color-mono', questionId: 'color', label: '무채색', styleTags: [], colorIds: ['black', 'white', 'gray', 'charcoal'], preview: [p('tee-long', 'black'), p('slacks', 'gray', 'straight')] },
  { id: 'color-earth', questionId: 'color', label: '어스톤', styleTags: [], colorIds: ['beige', 'brown', 'olive', 'cream'], preview: [p('knit', 'beige'), p('chino', 'brown', 'straight')] },
  { id: 'color-denim', questionId: 'color', label: '데님·블루', styleTags: [], colorIds: ['denimBlue', 'lightBlue', 'navy'], preview: [p('shirt', 'lightBlue'), p('jeans', 'denimBlue', 'straight')] },
  { id: 'color-point', questionId: 'color', label: '원색 포인트', styleTags: [], colorIds: ['red', 'yellow', 'green'], preview: [p('knit', 'red'), p('slacks', 'black', 'straight')] },
  { id: 'color-pastel', questionId: 'color', label: '파스텔', styleTags: [], colorIds: ['pink', 'lightBlue', 'cream'], preview: [p('tee-short', 'pink'), p('chino', 'cream', 'straight')] },

  { id: 'occ-daily', questionId: 'occasion', label: '데일리', styleTags: [], occasions: ['daily'], preview: [p('sweatshirt', 'gray'), p('jeans', 'denimBlue', 'straight')] },
  { id: 'occ-work', questionId: 'occasion', label: '출근·학교', styleTags: [], occasions: ['work'], preview: [p('shirt', 'white'), p('slacks', 'navy', 'straight')] },
  { id: 'occ-date', questionId: 'occasion', label: '데이트', styleTags: [], occasions: ['date'], preview: [p('knit', 'cream'), p('slacks', 'black', 'slim')] },
  { id: 'occ-outdoor', questionId: 'occasion', label: '야외 활동', styleTags: [], occasions: ['outdoor', 'travel'], preview: [p('windbreaker', 'olive'), p('shorts', 'beige')] },
];
