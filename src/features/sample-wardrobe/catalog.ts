/**
 * Bundled, read-only sample garment catalog (prompt §3.2). Self-made vector silhouettes only —
 * no product photos, brand logos or third-party artwork. Provenance: docs/SAMPLE_CATALOG.md.
 * User changes never touch these templates; they go into an outfit's `customization`.
 */
import type { SampleGarmentTemplate } from '@/domain/models';
import type { ColorId } from '@/domain/palette';

export const SAMPLE_CATALOG_VERSION = 1;

const NEUTRALS: ColorId[] = ['white', 'cream', 'black', 'charcoal', 'gray', 'navy', 'beige'];
const ALL: ColorId[] = ['white', 'cream', 'black', 'charcoal', 'gray', 'navy', 'beige', 'brown', 'olive', 'denimBlue', 'lightBlue', 'red', 'burgundy', 'green', 'pink', 'yellow'];
const DENIM: ColorId[] = ['denimBlue', 'lightBlue', 'navy', 'black', 'gray', 'white'];
const EARTH: ColorId[] = ['beige', 'brown', 'olive', 'cream', 'black', 'charcoal', 'navy', 'gray'];

type T = Omit<SampleGarmentTemplate, 'assetVersion'>;

const templates: T[] = [
  // 상의
  { id: 'tee-short', nameKo: '반팔 티셔츠', category: 'top', subcategory: 'tshirt', shapeId: 'tee', defaultColorId: 'white', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'stripe'], styleTags: ['casual', 'minimal', 'street'], seasonTags: ['spring', 'summer'] },
  { id: 'tee-long', nameKo: '긴팔 티셔츠', category: 'top', subcategory: 'longsleeve', shapeId: 'longTee', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'stripe'], styleTags: ['casual', 'minimal'], seasonTags: ['spring', 'fall'] },
  { id: 'sleeveless', nameKo: '민소매', category: 'top', subcategory: 'sleeveless', shapeId: 'sleeveless', defaultColorId: 'white', supportedColorIds: ALL, supportedFits: ['regular'], supportedPatterns: ['solid'], styleTags: ['sporty', 'casual'], seasonTags: ['summer'] },
  { id: 'tee-stripe', nameKo: '스트라이프 티셔츠', category: 'top', subcategory: 'tshirt', shapeId: 'longTee', defaultColorId: 'navy', supportedColorIds: NEUTRALS, supportedFits: ['regular'], supportedPatterns: ['stripe'], styleTags: ['classic', 'casual'], seasonTags: ['spring', 'fall'] },
  { id: 'shirt', nameKo: '셔츠', category: 'top', subcategory: 'shirt', shapeId: 'shirt', defaultColorId: 'white', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'stripe', 'check'], styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'summer', 'fall'] },
  { id: 'shirt-oxford', nameKo: '옥스퍼드 셔츠', category: 'top', subcategory: 'shirt', shapeId: 'shirt', defaultColorId: 'lightBlue', supportedColorIds: ['lightBlue', 'white', 'pink', 'cream', 'navy'], supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'stripe'], styleTags: ['classic', 'cityboy'], seasonTags: ['spring', 'fall'] },
  { id: 'knit', nameKo: '니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'gray', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['minimal', 'classic'], seasonTags: ['fall', 'winter'] },
  { id: 'sweatshirt', nameKo: '맨투맨', category: 'top', subcategory: 'sweatshirt', shapeId: 'knit', defaultColorId: 'charcoal', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['casual', 'street'], seasonTags: ['spring', 'fall'] },
  { id: 'hoodie', nameKo: '후드티', category: 'top', subcategory: 'hoodie', shapeId: 'hoodie', defaultColorId: 'gray', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['street', 'casual', 'sporty'], seasonTags: ['spring', 'fall', 'winter'] },
  // 하의
  { id: 'jeans', nameKo: '청바지', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'denimBlue', supportedColorIds: DENIM, supportedFits: ['straight', 'wide', 'slim'], supportedPatterns: ['solid', 'denimWash'], styleTags: ['casual', 'street', 'cityboy'], seasonTags: ['spring', 'summer', 'fall', 'winter'] },
  { id: 'slacks', nameKo: '슬랙스', category: 'bottom', subcategory: 'slacks', shapeId: 'pants', defaultColorId: 'charcoal', supportedColorIds: NEUTRALS, supportedFits: ['straight', 'wide', 'slim'], supportedPatterns: ['solid'], styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall', 'winter'] },
  { id: 'chino', nameKo: '치노 팬츠', category: 'bottom', subcategory: 'chino', shapeId: 'pants', defaultColorId: 'beige', supportedColorIds: EARTH, supportedFits: ['straight', 'slim'], supportedPatterns: ['solid'], styleTags: ['classic', 'casual', 'cityboy'], seasonTags: ['spring', 'fall'] },
  { id: 'cargo', nameKo: '카고 팬츠', category: 'bottom', subcategory: 'cargo', shapeId: 'cargo', defaultColorId: 'olive', supportedColorIds: EARTH, supportedFits: ['straight', 'wide'], supportedPatterns: ['solid'], styleTags: ['street', 'gorpcore', 'workwear'], seasonTags: ['spring', 'fall'] },
  { id: 'track', nameKo: '트랙 팬츠', category: 'bottom', subcategory: 'track', shapeId: 'pants', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: ['straight', 'wide'], supportedPatterns: ['solid', 'stripe'], styleTags: ['sporty', 'street'], seasonTags: ['spring', 'fall'] },
  { id: 'shorts', nameKo: '쇼츠', category: 'bottom', subcategory: 'shorts', shapeId: 'shorts', defaultColorId: 'beige', supportedColorIds: [...EARTH, 'denimBlue'], supportedFits: ['regular'], supportedPatterns: ['solid', 'denimWash'], styleTags: ['casual', 'sporty'], seasonTags: ['summer'] },
  { id: 'skirt', nameKo: '기본 스커트', category: 'bottom', subcategory: 'skirt', shapeId: 'skirt', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: ['regular', 'long'], supportedPatterns: ['solid', 'check'], styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'summer', 'fall'] },
  // 아우터
  { id: 'denim-jacket', nameKo: '데님 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'denimBlue', supportedColorIds: DENIM, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'denimWash'], styleTags: ['casual', 'street'], seasonTags: ['spring', 'fall'], outerWeight: 'light' },
  { id: 'bomber', nameKo: '봄버 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'olive', supportedColorIds: [...EARTH], supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['street', 'casual'], seasonTags: ['fall', 'spring'], outerWeight: 'medium' },
  { id: 'cardigan', nameKo: '가디건', category: 'outer', subcategory: 'cardigan', shapeId: 'cardigan', defaultColorId: 'cream', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall'], outerWeight: 'light' },
  { id: 'blazer', nameKo: '블레이저', category: 'outer', subcategory: 'blazer', shapeId: 'blazer', defaultColorId: 'navy', supportedColorIds: NEUTRALS, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'check'], styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'fall'], outerWeight: 'light' },
  { id: 'trench', nameKo: '트렌치코트', category: 'outer', subcategory: 'coat', shapeId: 'coat', defaultColorId: 'beige', supportedColorIds: EARTH, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'fall'], outerWeight: 'medium' },
  { id: 'long-coat', nameKo: '롱 코트', category: 'outer', subcategory: 'coat', shapeId: 'coat', defaultColorId: 'black', supportedColorIds: NEUTRALS, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid', 'check'], styleTags: ['minimal', 'classic'], seasonTags: ['winter', 'fall'], outerWeight: 'heavy' },
  { id: 'padding', nameKo: '패딩', category: 'outer', subcategory: 'padding', shapeId: 'puffer', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['street', 'gorpcore', 'casual'], seasonTags: ['winter'], outerWeight: 'heavy' },
  { id: 'windbreaker', nameKo: '윈드브레이커', category: 'outer', subcategory: 'windbreaker', shapeId: 'jacket', defaultColorId: 'green', supportedColorIds: ALL, supportedFits: ['regular', 'oversized'], supportedPatterns: ['solid'], styleTags: ['gorpcore', 'sporty'], seasonTags: ['spring', 'fall'], outerWeight: 'light' },
  // 신발
  { id: 'sneakers', nameKo: '기본 스니커즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'white', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid'], styleTags: ['casual', 'street', 'minimal', 'sporty'], seasonTags: ['spring', 'summer', 'fall', 'winter'] },
  { id: 'loafers', nameKo: '로퍼', category: 'shoes', subcategory: 'loafers', shapeId: 'loafer', defaultColorId: 'black', supportedColorIds: ['black', 'brown', 'burgundy', 'charcoal'], supportedFits: [], supportedPatterns: ['solid'], styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'] },
  { id: 'boots', nameKo: '부츠', category: 'shoes', subcategory: 'boots', shapeId: 'boot', defaultColorId: 'brown', supportedColorIds: ['brown', 'black', 'beige', 'charcoal'], supportedFits: [], supportedPatterns: ['solid'], styleTags: ['workwear', 'classic', 'gorpcore'], seasonTags: ['fall', 'winter'] },
  { id: 'sandals', nameKo: '샌들', category: 'shoes', subcategory: 'sandals', shapeId: 'sandal', defaultColorId: 'black', supportedColorIds: ['black', 'brown', 'beige', 'white'], supportedFits: [], supportedPatterns: ['solid'], styleTags: ['casual', 'gorpcore'], seasonTags: ['summer'] },
  // 액세서리
  { id: 'cap', nameKo: '볼캡', category: 'hat', subcategory: 'cap', shapeId: 'cap', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid'], styleTags: ['street', 'casual', 'sporty'], seasonTags: ['spring', 'summer', 'fall'] },
  { id: 'beanie', nameKo: '비니', category: 'hat', subcategory: 'beanie', shapeId: 'beanie', defaultColorId: 'charcoal', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid'], styleTags: ['street', 'casual'], seasonTags: ['fall', 'winter'] },
  { id: 'tote', nameKo: '토트백', category: 'bag', subcategory: 'tote', shapeId: 'tote', defaultColorId: 'cream', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid'], styleTags: ['minimal', 'casual'], seasonTags: ['spring', 'summer', 'fall', 'winter'] },
  { id: 'crossbody', nameKo: '크로스백', category: 'bag', subcategory: 'crossbody', shapeId: 'crossbody', defaultColorId: 'black', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid'], styleTags: ['street', 'gorpcore', 'cityboy'], seasonTags: ['spring', 'summer', 'fall', 'winter'] },
  { id: 'belt', nameKo: '벨트', category: 'accessory', subcategory: 'belt', shapeId: 'belt', defaultColorId: 'black', supportedColorIds: ['black', 'brown', 'beige'], supportedFits: [], supportedPatterns: ['solid'], styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'summer', 'fall', 'winter'] },
  { id: 'scarf', nameKo: '스카프', category: 'accessory', subcategory: 'scarf', shapeId: 'scarf', defaultColorId: 'burgundy', supportedColorIds: ALL, supportedFits: [], supportedPatterns: ['solid', 'check'], styleTags: ['classic'], seasonTags: ['fall', 'winter'] },
];

/**
 * Photo samples from the user-provided high-resolution sample boards (assets/showcase/g-*,
 * docs/SAMPLE_CATALOG.md). Items with third-party logos (caps, logo sneakers, branded bags) were left
 * out. One photographed color each; `shapeId` is the vector fallback if an image ever fails to load.
 */
type P = Omit<T, 'supportedColorIds' | 'supportedFits' | 'supportedPatterns'> & { photo: { tile: string; cutout?: string } };
const photo = (p: P): T => ({ ...p, supportedColorIds: [p.defaultColorId], supportedFits: [], supportedPatterns: ['solid'] });

const photoTemplates: T[] = [
  // 상의
  photo({ id: 'ph-knit-cream', nameKo: '크림 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'cream', styleTags: ['minimal', 'classic'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-knit-cream', cutout: 'g-knit-cream-cut' } }),
  photo({ id: 'ph-knit-oatmeal', nameKo: '오트밀 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'beige', styleTags: ['minimal', 'casual'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-knit-oatmeal', cutout: 'g-knit-oatmeal-cut' } }),
  photo({ id: 'ph-knit-charcoal', nameKo: '차콜 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'charcoal', styleTags: ['minimal', 'classic'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-knit-charcoal', cutout: 'g-knit-charcoal-cut' } }),
  photo({ id: 'ph-knit-black', nameKo: '블랙 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'black', styleTags: ['minimal', 'cityboy'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-knit-black', cutout: 'g-knit-black-cut' } }),
  photo({ id: 'ph-knit-navy', nameKo: '네이비 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'navy', styleTags: ['classic', 'cityboy'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-knit-navy', cutout: 'g-knit-navy-cut' } }),
  photo({ id: 'ph-polo-black', nameKo: '블랙 폴로 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'black', styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'fall'], photo: { tile: 'g-polo-black', cutout: 'g-polo-black-cut' } }),
  photo({ id: 'ph-hoodie-gray', nameKo: '그레이 후드티', category: 'top', subcategory: 'hoodie', shapeId: 'hoodie', defaultColorId: 'gray', styleTags: ['casual', 'street', 'sporty'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-hoodie-gray', cutout: 'g-hoodie-gray-cut' } }),
  photo({ id: 'ph-zip-hoodie-black', nameKo: '블랙 후드 집업', category: 'top', subcategory: 'hoodie', shapeId: 'hoodie', defaultColorId: 'black', styleTags: ['street', 'casual'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-zip-hoodie-black', cutout: 'g-zip-hoodie-black-cut' } }),
  photo({ id: 'ph-tee-white', nameKo: '화이트 반팔 티', category: 'top', subcategory: 'tshirt', shapeId: 'tee', defaultColorId: 'white', styleTags: ['casual', 'minimal', 'street'], seasonTags: ['spring', 'summer'], photo: { tile: 'g-tee-white', cutout: 'g-tee-white-cut' } }),
  photo({ id: 'ph-shirt-white', nameKo: '화이트 셔츠', category: 'top', subcategory: 'shirt', shapeId: 'shirt', defaultColorId: 'white', styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'g-shirt-white', cutout: 'g-shirt-white-cut' } }),
  photo({ id: 'ph-shirt-navy', nameKo: '네이비 셔츠', category: 'top', subcategory: 'shirt', shapeId: 'shirt', defaultColorId: 'navy', styleTags: ['classic', 'cityboy'], seasonTags: ['spring', 'fall'], photo: { tile: 'g-shirt-navy', cutout: 'g-shirt-navy-cut' } }),
  // 아우터
  photo({ id: 'ph-zip-jacket-black', nameKo: '블랙 집업 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'black', styleTags: ['street', 'minimal', 'cityboy'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'g-zip-jacket-black', cutout: 'g-zip-jacket-black-cut' } }),
  photo({ id: 'ph-blouson-ivory', nameKo: '아이보리 블루종', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'cream', styleTags: ['casual', 'cityboy'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'g-blouson-ivory', cutout: 'g-blouson-ivory-cut' } }),
  photo({ id: 'ph-work-jacket-beige', nameKo: '베이지 워크 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'beige', styleTags: ['workwear', 'casual'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'g-work-jacket-beige', cutout: 'g-work-jacket-beige-cut' } }),
  photo({ id: 'ph-coat-beige', nameKo: '베이지 싱글 코트', category: 'outer', subcategory: 'coat', shapeId: 'coat', defaultColorId: 'beige', styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'fall'], outerWeight: 'medium', photo: { tile: 'g-coat-beige', cutout: 'g-coat-beige-cut' } }),
  photo({ id: 'ph-puffer-black', nameKo: '블랙 숏패딩', category: 'outer', subcategory: 'padding', shapeId: 'puffer', defaultColorId: 'black', styleTags: ['street', 'casual', 'gorpcore'], seasonTags: ['winter'], outerWeight: 'heavy', photo: { tile: 'g-puffer-black', cutout: 'g-puffer-black-cut' } }),
  photo({ id: 'ph-cardigan-ivory', nameKo: '아이보리 가디건', category: 'outer', subcategory: 'cardigan', shapeId: 'cardigan', defaultColorId: 'white', styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'g-cardigan-ivory' } }),
  photo({ id: 'ph-cardigan-gray', nameKo: '그레이 가디건', category: 'outer', subcategory: 'cardigan', shapeId: 'cardigan', defaultColorId: 'gray', styleTags: ['minimal', 'casual'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'g-cardigan-gray', cutout: 'g-cardigan-gray-cut' } }),
  // 하의
  photo({ id: 'ph-jeans-light', nameKo: '라이트 와이드 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'lightBlue', styleTags: ['casual', 'street'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-jeans-light', cutout: 'g-jeans-light-cut' } }),
  photo({ id: 'ph-jeans-mid', nameKo: '미드 블루 와이드 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'denimBlue', styleTags: ['casual', 'street', 'cityboy'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-jeans-mid', cutout: 'g-jeans-mid-cut' } }),
  photo({ id: 'ph-jeans-black', nameKo: '워시드 블랙 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'charcoal', styleTags: ['street', 'minimal'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-jeans-black', cutout: 'g-jeans-black-cut' } }),
  photo({ id: 'ph-slacks-black', nameKo: '블랙 와이드 슬랙스', category: 'bottom', subcategory: 'slacks', shapeId: 'pants', defaultColorId: 'black', styleTags: ['minimal', 'classic', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-slacks-black', cutout: 'g-slacks-black-cut' } }),
  photo({ id: 'ph-slacks-charcoal', nameKo: '차콜 슬랙스', category: 'bottom', subcategory: 'slacks', shapeId: 'pants', defaultColorId: 'charcoal', styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-slacks-charcoal', cutout: 'g-slacks-charcoal-cut' } }),
  photo({ id: 'ph-pants-ivory', nameKo: '아이보리 와이드 팬츠', category: 'bottom', subcategory: 'slacks', shapeId: 'pants', defaultColorId: 'cream', styleTags: ['minimal', 'casual'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'g-pants-ivory', cutout: 'g-pants-ivory-cut' } }),
  photo({ id: 'ph-skirt-black', nameKo: '블랙 롱스커트', category: 'bottom', subcategory: 'skirt', shapeId: 'skirt', defaultColorId: 'black', styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall'], photo: { tile: 'g-skirt-black', cutout: 'g-skirt-black-cut' } }),
  // 신발
  photo({ id: 'ph-sneakers-white', nameKo: '화이트 스니커즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'white', styleTags: ['casual', 'minimal', 'street'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-sneakers-white', cutout: 'g-sneakers-white-cut' } }),
  photo({ id: 'ph-runner-gray', nameKo: '그레이 러닝화', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'gray', styleTags: ['sporty', 'gorpcore', 'casual'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-runner-gray', cutout: 'g-runner-gray-cut' } }),
  photo({ id: 'ph-shoes-black', nameKo: '블랙 스니커즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'black', styleTags: ['street', 'minimal'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-shoes-black', cutout: 'g-shoes-black-cut' } }),
  photo({ id: 'ph-loafers-black', nameKo: '블랙 페니 로퍼', category: 'shoes', subcategory: 'loafers', shapeId: 'loafer', defaultColorId: 'black', styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'g-loafers-black', cutout: 'g-loafers-black-cut' } }),
  // 가방
  photo({ id: 'ph-hobo-black', nameKo: '블랙 호보백', category: 'bag', subcategory: 'shoulder', shapeId: 'tote', defaultColorId: 'black', styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-hobo-black', cutout: 'g-hobo-black-cut' } }),
  photo({ id: 'ph-shoulder-black', nameKo: '블랙 레더 숄더백', category: 'bag', subcategory: 'shoulder', shapeId: 'tote', defaultColorId: 'black', styleTags: ['minimal', 'casual'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-shoulder-black', cutout: 'g-shoulder-black-cut' } }),
  photo({ id: 'ph-nylon-bag-black', nameKo: '블랙 나일론 숄더백', category: 'bag', subcategory: 'shoulder', shapeId: 'crossbody', defaultColorId: 'black', styleTags: ['casual', 'street'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-nylon-bag-black', cutout: 'g-nylon-bag-black-cut' } }),
  photo({ id: 'ph-backpack-black', nameKo: '블랙 백팩', category: 'bag', subcategory: 'backpack', shapeId: 'crossbody', defaultColorId: 'black', styleTags: ['street', 'casual', 'gorpcore'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-backpack-black', cutout: 'g-backpack-black-cut' } }),
  // 액세서리
  photo({ id: 'ph-scarf-oatmeal', nameKo: '오트밀 머플러', category: 'accessory', subcategory: 'scarf', shapeId: 'scarf', defaultColorId: 'beige', styleTags: ['classic', 'minimal'], seasonTags: ['fall', 'winter'], photo: { tile: 'g-scarf-oatmeal', cutout: 'g-scarf-oatmeal-cut' } }),
  photo({ id: 'ph-watch-silver', nameKo: '실버 메탈 시계', category: 'accessory', subcategory: 'watch', shapeId: 'belt', defaultColorId: 'gray', styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-watch-silver', cutout: 'g-watch-silver-cut' } }),
  photo({ id: 'ph-sunglasses-black', nameKo: '블랙 선글라스', category: 'accessory', subcategory: 'sunglasses', shapeId: 'belt', defaultColorId: 'black', styleTags: ['street', 'minimal'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'g-sunglasses-black', cutout: 'g-sunglasses-black-cut' } }),
  photo({ id: 'ph-headphones-black', nameKo: '블랙 헤드폰', category: 'accessory', subcategory: 'headphones', shapeId: 'belt', defaultColorId: 'black', styleTags: ['street', 'cityboy'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'g-headphones-black', cutout: 'g-headphones-black-cut' } }),
];

/** Photo samples first (showcase look), then the editable vector templates. */
export const SAMPLE_TEMPLATES: readonly SampleGarmentTemplate[] = [...photoTemplates, ...templates].map((t) => ({ ...t, assetVersion: 1 }));

/** Samples offered by "샘플 포함" recommendations: photo samples only, so outfits read like the showcase. */
export const RECOMMENDABLE_SAMPLES: readonly SampleGarmentTemplate[] = SAMPLE_TEMPLATES.filter((t) => t.photo);

const BY_ID = new Map(SAMPLE_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): SampleGarmentTemplate | undefined {
  return BY_ID.get(id);
}
