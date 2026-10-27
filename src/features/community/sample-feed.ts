import type { StyleTag } from '@/domain/categories';
import { showcaseImage } from '@/features/sample-wardrobe/showcase-assets';

/**
 * Bundled example posts built from the user-provided sample street photos. Shown only while the community server is
 * not configured, always under a "샘플 게시물" label — they are not real users and hearts on them
 * stay on this screen (never sent, never stored).
 */
export interface SamplePost {
  id: string;
  authorHandle: string;
  avatar: number | undefined;
  /** Tall photo for the detail/feed card; `wide` for the "오늘의 베스트 착장" banner. */
  image: number | undefined;
  wide: number | undefined;
  feed: number | undefined;
  title: string;
  hashtags: string[];
  styleTags: StyleTag[];
  likeCount: number;
  commentCount: number;
  timeLabel: string;
  featured: boolean;
}

const img = (k: string) => showcaseImage(k);

export const SAMPLE_POSTS: readonly SamplePost[] = [
  { id: 'sample-trench', authorHandle: 'mood.coat', avatar: img('p-avatar-b'), image: img('p-street-trench'), wide: img('p-street-trench'), feed: img('p-street-trench'), title: '트렌치 코트로 완성한 출근룩', hashtags: ['#출근룩', '#코트', '#가을'], styleTags: ['classic', 'minimal'], likeCount: 2400, commentCount: 128, timeLabel: '1시간 전', featured: true },
  { id: 'sample-blouson', authorHandle: 'campus.kim', avatar: img('p-avatar-c'), image: img('p-look-blouson'), wide: img('p-look-blouson'), feed: img('p-look-blouson'), title: '아이보리 블루종 + 헤드폰 🎧', hashtags: ['#캠퍼스룩', '#블루종', '#데일리룩'], styleTags: ['casual', 'cityboy'], likeCount: 1800, commentCount: 64, timeLabel: '2시간 전', featured: true },
  { id: 'sample-knit', authorHandle: 'soft.daily', avatar: img('p-avatar-d'), image: img('p-look-knit'), wide: img('p-look-knit'), feed: img('p-look-knit'), title: '차콜 니트로 차분한 하루', hashtags: ['#니트', '#미니멀', '#가을'], styleTags: ['minimal'], likeCount: 1200, commentCount: 42, timeLabel: '3시간 전', featured: true },
  { id: 'sample-black-jacket', authorHandle: 'city.boy', avatar: img('p-avatar-a'), image: img('p-look-jacket'), wide: img('p-look-jacket'), feed: img('p-look-jacket'), title: '올블랙 집업 재킷 코디', hashtags: ['#시티보이', '#올블랙', '#와이드팬츠'], styleTags: ['cityboy', 'street'], likeCount: 980, commentCount: 31, timeLabel: '5시간 전', featured: true },
  { id: 'sample-navy-shirt', authorHandle: 'j_min', avatar: img('p-avatar-a'), image: img('p-look-navy'), wide: img('p-look-navy'), feed: img('p-look-navy'), title: '네이비 셔츠에 아이보리 팬츠 ☕', hashtags: ['#셔츠코디', '#간절기'], styleTags: ['classic', 'cityboy'], likeCount: 860, commentCount: 17, timeLabel: '어제', featured: false },
  { id: 'sample-cream', authorHandle: 'style.daily', avatar: img('p-avatar-d'), image: img('p-look-cream'), wide: img('p-look-cream'), feed: img('p-look-cream'), title: '크림 니트 + 와이드 데님', hashtags: ['#데일리룩', '#데님'], styleTags: ['casual'], likeCount: 720, commentCount: 12, timeLabel: '어제', featured: false },
  { id: 'sample-zip', authorHandle: 'gray.day', avatar: img('p-avatar-b'), image: img('p-look-zip'), wide: img('p-look-zip'), feed: img('p-look-zip'), title: '그레이 후드 집업 원마일웨어', hashtags: ['#원마일웨어', '#그레이'], styleTags: ['casual', 'sporty'], likeCount: 530, commentCount: 9, timeLabel: '2일 전', featured: false },
  { id: 'sample-puffer', authorHandle: 'winter.lee', avatar: img('p-avatar-c'), image: img('p-look-puffer'), wide: img('p-look-puffer'), feed: img('p-look-puffer'), title: '숏패딩 꺼낼 날씨 🧊', hashtags: ['#겨울코디', '#패딩'], styleTags: ['street', 'casual'], likeCount: 410, commentCount: 6, timeLabel: '2일 전', featured: false },
];

export function getSamplePost(id: string): SamplePost | undefined {
  return SAMPLE_POSTS.find((p) => p.id === id);
}

/** Showcase "날씨 상세 → 오늘의 코디 추천" example looks (full-body sample photos). */
export const SAMPLE_LOOKS: readonly { id: string; image: number | undefined; caption: string }[] = [
  { id: 'look-jacket', image: img('p-street-jacket'), caption: '블랙 재킷 + 와이드 팬츠' },
  { id: 'look-trench', image: img('p-look-trench'), caption: '트렌치 코트 + 데님' },
  { id: 'look-hoodie', image: img('p-look-hoodie'), caption: '후드티 + 블랙 팬츠' },
];
