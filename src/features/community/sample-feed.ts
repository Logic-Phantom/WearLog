import type { StyleTag } from '@/domain/categories';
import { showcaseImage } from '@/features/sample-wardrobe/showcase-assets';

/**
 * Bundled example posts built from the showcase photos. Shown only while the community server is
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
  {
    id: 'sample-rainy-coat',
    authorHandle: 'j_min',
    avatar: img('p-avatar-jmin'),
    image: img('p-comm-detail'),
    wide: img('p-comm-best'),
    feed: img('p-comm-feed'),
    title: '비 오는 날, 분위기 있는 코디 🌧️',
    hashtags: ['#데일리룩', '#겨울', '#코트', '#모자'],
    styleTags: ['minimal', 'classic'],
    likeCount: 2400,
    commentCount: 128,
    timeLabel: '1시간 전',
    featured: true,
  },
  {
    id: 'sample-trench',
    authorHandle: 'style.daily',
    avatar: img('p-avatar-style'),
    image: img('p-home-best'),
    wide: img('p-home-best'),
    feed: img('p-home-best'),
    title: '가을비에 어울리는 감성 코디 🌧️',
    hashtags: ['#데일리룩', '#가을', '#코트'],
    styleTags: ['classic'],
    likeCount: 1200,
    commentCount: 42,
    timeLabel: '3시간 전',
    featured: true,
  },
  {
    id: 'sample-look-trench',
    authorHandle: 'mono.fit',
    avatar: undefined,
    image: img('p-look-2'),
    wide: img('p-look-2'),
    feed: img('p-look-2'),
    title: '트렌치 코트 + 와이드팬츠',
    hashtags: ['#출근룩', '#트렌치'],
    styleTags: ['classic', 'minimal'],
    likeCount: 860,
    commentCount: 17,
    timeLabel: '5시간 전',
    featured: true,
  },
  {
    id: 'sample-look-denim',
    authorHandle: 'weekend.k',
    avatar: undefined,
    image: img('p-look-1'),
    wide: img('p-look-1'),
    feed: img('p-look-1'),
    title: '가벼운 자켓 + 데님',
    hashtags: ['#캐주얼', '#데님'],
    styleTags: ['casual', 'street'],
    likeCount: 530,
    commentCount: 9,
    timeLabel: '어제',
    featured: false,
  },
  {
    id: 'sample-look-hoodie',
    authorHandle: 'gray.day',
    avatar: undefined,
    image: img('p-look-3'),
    wide: img('p-look-3'),
    feed: img('p-look-3'),
    title: '후드티 + 조거팬츠',
    hashtags: ['#원마일웨어', '#그레이'],
    styleTags: ['casual', 'sporty'],
    likeCount: 410,
    commentCount: 6,
    timeLabel: '어제',
    featured: false,
  },
];

export function getSamplePost(id: string): SamplePost | undefined {
  return SAMPLE_POSTS.find((p) => p.id === id);
}

/** Showcase "날씨 상세 → 오늘의 코디 추천" example looks (full-body sample photos). */
export const SAMPLE_LOOKS: readonly { id: string; image: number | undefined; caption: string }[] = [
  { id: 'look-1', image: img('p-look-1'), caption: '가벼운 자켓 + 데님' },
  { id: 'look-2', image: img('p-look-2'), caption: '트렌치 코트 + 와이드팬츠' },
  { id: 'look-3', image: img('p-look-3'), caption: '후드티 + 조거팬츠' },
];
