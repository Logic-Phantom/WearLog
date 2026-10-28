/**
 * Community rules as data (prompt §3.10, CutPick pattern). Controlled vocabularies only — no
 * comments, no DMs, no dislikes, no appearance scores, no rankings of people.
 * Server-side equivalents: supabase/migrations (CHECK constraints + triggers).
 */
import { OCCASIONS, STYLE_TAGS, type Occasion, type StyleTag } from '@/domain/categories';

export const REPORT_REASONS = [
  { id: 'spam', label: '스팸·광고' },
  { id: 'harassment', label: '괴롭힘·혐오' },
  { id: 'sexual', label: '성적·노출 콘텐츠' },
  { id: 'impersonation', label: '사칭' },
  { id: 'copyright', label: '저작권 침해' },
  { id: 'privacy', label: '개인정보 노출' },
  { id: 'other', label: '기타' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['id'];

export const COMMUNITY_LIMITS = {
  maxStyleTags: 3,
  maxTitleLength: 40,
  /** Long side of the uploaded share derivative. */
  imageMaxSide: 1440,
  imageQuality: 0.82,
  thumbMaxSide: 480,
  thumbQuality: 0.75,
  /** Client-side guard; the bucket enforces its own file_size_limit. */
  maxUploadBytes: 2 * 1024 * 1024,
  feedPageSize: 20,
} as const;

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '';
/** Person or business named as 개인정보 보호책임자 in the privacy policy (required before public release). */
export const OPERATOR_NAME = process.env.EXPO_PUBLIC_OPERATOR_NAME || '';

const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;
const RESERVED = ['admin', 'wearlog', 'support', 'official', 'moderator', 'root'];

export function validateHandle(handle: string): string | null {
  const h = handle.trim().toLowerCase();
  if (!HANDLE_RE.test(h)) return '영문 소문자, 숫자, _ . 만 사용해 3~20자로 입력해 주세요.';
  if (h.startsWith('.') || h.endsWith('.') || h.includes('..')) return '마침표는 처음·끝이나 연속으로 쓸 수 없어요.';
  if (RESERVED.some((r) => h.includes(r))) return '사용할 수 없는 단어가 포함돼 있어요.';
  return null;
}

export function sanitizeStyleTags(tags: string[]): StyleTag[] {
  const allowed = new Set<string>(STYLE_TAGS.map((t) => t.id));
  return Array.from(new Set(tags.filter((t) => allowed.has(t)))).slice(0, COMMUNITY_LIMITS.maxStyleTags) as StyleTag[];
}

export function sanitizeOccasion(o: string | null | undefined): Occasion | null {
  return o && OCCASIONS.some((x) => x.id === o) ? (o as Occasion) : null;
}

export function sanitizeTitle(t: string | null | undefined): string | null {
  const v = (t ?? '').replace(/\s+/g, ' ').trim();
  return v ? v.slice(0, COMMUNITY_LIMITS.maxTitleLength) : null;
}

/**
 * Public weather summary: coarse words only (e.g. "비 오는 날 · 12°C"). Never a location below
 * 시/구, never coordinates. Only attached when the user ticks the box at publish time.
 */
export function publicWeatherSummary(tempC: number | null, rain: boolean): string | null {
  if (tempC == null && !rain) return null;
  const parts = [rain ? '비 오는 날' : null, tempC != null ? `${Math.round(tempC)}°C` : null].filter(Boolean);
  return parts.join(' · ');
}
