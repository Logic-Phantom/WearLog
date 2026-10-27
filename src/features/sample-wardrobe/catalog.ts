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
 * Photo samples cut from the user-provided showcase board (assets/showcase, docs/SAMPLE_CATALOG.md).
 * One photographed color each; `shapeId` is the vector fallback if an image ever fails to load.
 */
type P = Omit<T, 'supportedColorIds' | 'supportedFits' | 'supportedPatterns'> & { photo: { tile: string; cutout?: string } };
const photo = (p: P): T => ({ ...p, supportedColorIds: [p.defaultColorId], supportedFits: [], supportedPatterns: ['solid'] });

const photoTemplates: T[] = [
  // 상의
  photo({ id: 'ph-sweater-gray', nameKo: '그레이 니트 스웨터', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'gray', styleTags: ['minimal', 'casual'], seasonTags: ['fall', 'winter'], photo: { tile: 'a-sweater-gray', cutout: 'a-sweater-gray-cut' } }),
  photo({ id: 'ph-tee-white', nameKo: '화이트 반팔 티', category: 'top', subcategory: 'tshirt', shapeId: 'tee', defaultColorId: 'white', styleTags: ['casual', 'minimal', 'street'], seasonTags: ['spring', 'summer'], photo: { tile: 'b-tee-white', cutout: 'b-tee-white-cut' } }),
  photo({ id: 'ph-knit-cream', nameKo: '크림 반팔 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'cream', styleTags: ['minimal', 'classic'], seasonTags: ['spring', 'fall'], photo: { tile: 'f-knit-cream', cutout: 'f-knit-cream-cut' } }),
  photo({ id: 'ph-sweat-gray', nameKo: '그레이 맨투맨', category: 'top', subcategory: 'sweatshirt', shapeId: 'knit', defaultColorId: 'gray', styleTags: ['casual', 'street'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'w-sweat-gray', cutout: 'w-sweat-gray-cut' } }),
  photo({ id: 'ph-knit-black', nameKo: '블랙 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'black', styleTags: ['minimal', 'classic'], seasonTags: ['fall', 'winter'], photo: { tile: 'w-knit-black', cutout: 'w-knit-black-cut' } }),
  photo({ id: 'ph-knit-white', nameKo: '화이트 니트', category: 'top', subcategory: 'knit', shapeId: 'knit', defaultColorId: 'cream', styleTags: ['minimal', 'casual'], seasonTags: ['fall', 'winter'], photo: { tile: 'w-knit-white' } }),
  // 하의
  photo({ id: 'ph-jeans-wide', nameKo: '와이드 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'denimBlue', styleTags: ['casual', 'street', 'cityboy'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'b-jeans-wide', cutout: 'b-jeans-wide-cut' } }),
  photo({ id: 'ph-denim-wide', nameKo: '데님 팬츠', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'denimBlue', styleTags: ['casual', 'street'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'l-denim-wide', cutout: 'l-denim-wide-cut' } }),
  photo({ id: 'ph-jeans-indigo', nameKo: '인디고 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'navy', styleTags: ['casual', 'classic', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'w-jeans-indigo', cutout: 'w-jeans-indigo-cut' } }),
  photo({ id: 'ph-jeans-light', nameKo: '라이트 그레이 데님', category: 'bottom', subcategory: 'jeans', shapeId: 'pants', defaultColorId: 'gray', styleTags: ['casual', 'street'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'w-jeans-light', cutout: 'w-jeans-light-cut' } }),
  photo({ id: 'ph-cargo-khaki', nameKo: '카키 카고 팬츠', category: 'bottom', subcategory: 'cargo', shapeId: 'cargo', defaultColorId: 'olive', styleTags: ['street', 'gorpcore', 'workwear'], seasonTags: ['spring', 'fall'], photo: { tile: 'f-cargo-khaki', cutout: 'f-cargo-khaki-cut' } }),
  photo({ id: 'ph-pants-black', nameKo: '블랙 와이드 팬츠', category: 'bottom', subcategory: 'slacks', shapeId: 'pants', defaultColorId: 'black', styleTags: ['minimal', 'classic', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'f-pants-black', cutout: 'f-pants-black-cut' } }),
  // 아우터
  photo({ id: 'ph-trench-beige', nameKo: '베이지 트렌치 코트', category: 'outer', subcategory: 'coat', shapeId: 'coat', defaultColorId: 'beige', styleTags: ['classic', 'minimal'], seasonTags: ['spring', 'fall'], outerWeight: 'medium', photo: { tile: 'w-trench-beige' } }),
  photo({ id: 'ph-trucker-black', nameKo: '블랙 트러커 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'black', styleTags: ['street', 'casual'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'b-jacket-black', cutout: 'b-jacket-black-cut' } }),
  photo({ id: 'ph-jacket-navy', nameKo: '네이비 워크 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'navy', styleTags: ['workwear', 'cityboy', 'casual'], seasonTags: ['spring', 'fall', 'winter'], outerWeight: 'medium', photo: { tile: 'f-jacket-black', cutout: 'f-jacket-black-cut' } }),
  photo({ id: 'ph-zip-black', nameKo: '블랙 집업 재킷', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'black', styleTags: ['street', 'minimal'], seasonTags: ['spring', 'fall'], outerWeight: 'light', photo: { tile: 'l-jacket-black', cutout: 'l-jacket-black-cut' } }),
  photo({ id: 'ph-fleece-charcoal', nameKo: '차콜 플리스 집업', category: 'outer', subcategory: 'jacket', shapeId: 'jacket', defaultColorId: 'charcoal', styleTags: ['gorpcore', 'casual'], seasonTags: ['fall', 'winter'], outerWeight: 'medium', photo: { tile: 'w-fleece-charcoal', cutout: 'w-fleece-charcoal-cut' } }),
  photo({ id: 'ph-coverall', nameKo: '워크 점프수트', category: 'onepiece', subcategory: 'jumpsuit', shapeId: 'coat', defaultColorId: 'charcoal', styleTags: ['workwear', 'street'], seasonTags: ['spring', 'fall'], photo: { tile: 'w-coverall-charcoal', cutout: 'w-coverall-charcoal-cut' } }),
  // 신발
  photo({ id: 'ph-sneakers-white', nameKo: '화이트 스니커즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'white', styleTags: ['casual', 'street', 'minimal', 'sporty'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'b-sneakers-white', cutout: 'b-sneakers-white-cut' } }),
  photo({ id: 'ph-sneakers-bw', nameKo: '블랙 스니커즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'black', styleTags: ['street', 'casual', 'sporty'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'f-sneakers-bw', cutout: 'f-sneakers-bw-cut' } }),
  photo({ id: 'ph-shoes-black', nameKo: '블랙 레더 슈즈', category: 'shoes', subcategory: 'loafers', shapeId: 'loafer', defaultColorId: 'black', styleTags: ['classic', 'minimal', 'cityboy'], seasonTags: ['spring', 'fall', 'winter'], photo: { tile: 'w-shoes-black', cutout: 'w-shoes-black-cut' } }),
  photo({ id: 'ph-chunky-black', nameKo: '블랙 청키 슈즈', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'black', styleTags: ['street', 'gorpcore'], seasonTags: ['fall', 'winter'], photo: { tile: 'w-chunky-black', cutout: 'w-chunky-black-cut' } }),
  photo({ id: 'ph-sneakers-brown', nameKo: '레트로 러닝화', category: 'shoes', subcategory: 'sneakers', shapeId: 'sneaker', defaultColorId: 'brown', styleTags: ['gorpcore', 'sporty', 'casual'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'w-sneakers-brown', cutout: 'w-sneakers-brown-cut' } }),
  // 액세서리
  photo({ id: 'ph-cap-black', nameKo: '블랙 볼캡', category: 'hat', subcategory: 'cap', shapeId: 'cap', defaultColorId: 'black', styleTags: ['street', 'casual', 'sporty'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'b-cap-black', cutout: 'b-cap-black-cut' } }),
  photo({ id: 'ph-cap-gray', nameKo: '그레이 볼캡', category: 'hat', subcategory: 'cap', shapeId: 'cap', defaultColorId: 'gray', styleTags: ['casual', 'gorpcore'], seasonTags: ['spring', 'summer', 'fall'], photo: { tile: 'f-cap-gray', cutout: 'f-cap-gray-cut' } }),
  photo({ id: 'ph-bag-black', nameKo: '블랙 토트백', category: 'bag', subcategory: 'tote', shapeId: 'tote', defaultColorId: 'black', styleTags: ['minimal', 'casual'], seasonTags: ['spring', 'summer', 'fall', 'winter'], photo: { tile: 'b-bag-black', cutout: 'b-bag-black-cut' } }),
];

/** Photo samples first (showcase look), then the editable vector templates. */
export const SAMPLE_TEMPLATES: readonly SampleGarmentTemplate[] = [...photoTemplates, ...templates].map((t) => ({ ...t, assetVersion: 1 }));

/** Samples offered by "샘플 포함" recommendations: photo samples only, so outfits read like the showcase. */
export const RECOMMENDABLE_SAMPLES: readonly SampleGarmentTemplate[] = SAMPLE_TEMPLATES.filter((t) => t.photo);

const BY_ID = new Map(SAMPLE_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): SampleGarmentTemplate | undefined {
  return BY_ID.get(id);
}
