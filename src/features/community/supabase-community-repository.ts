import type { SupabaseClient } from '@supabase/supabase-js';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { AppError } from '@/domain/errors';
import { uuidv4 } from '@/utils/id';

import type {
  BackendStatus,
  BlockedUser,
  CommunityProfile,
  CommunityRepository,
  CommunitySession,
  FeedPost,
  FeedQuery,
  NewPostInput,
} from './community-repository';
import { AUTH_CALLBACK_PATH, enabledSocialProviders, expoGoCallbackUrl, parseAuthCallback, type SocialProviderId } from '@/features/auth/social-auth';
import { fetchAuthSettings, getSupabase } from '@/infrastructure/supabase/client';

import { COMMUNITY_LIMITS, sanitizeOccasion, sanitizeStyleTags, sanitizeTitle, validateHandle, type ReportReason } from './moderation-policy';

const BUCKET = 'outfit-images';

interface FeedRow {
  id: string;
  author_id: string;
  author_handle: string;
  image_path: string;
  thumbnail_path: string;
  title: string | null;
  style_tags: string[];
  occasion: string | null;
  weather_summary: string | null;
  featured_on: string | null;
  created_at: string;
  heart_count: number | string;
  hearted_by_me: boolean;
  moderation_status: FeedPost['moderationStatus'];
}

/** Maps backend/network failures to user-facing categories (quota/paused/network/auth). */
export function mapBackendError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const err = e as { message?: string; status?: number; code?: string; name?: string } | null;
  const msg = (err?.message ?? '').toLowerCase();
  if (msg.includes('rate_limited')) return new AppError('rate-limited', '하루 게시 한도에 도달했어요. 내일 다시 올려 주세요.');
  if (msg.includes('quota_exceeded') || msg.includes('uploads_disabled')) return new AppError('backend-quota');
  if (msg.includes('not_authenticated') || err?.status === 401) return new AppError('auth-required');
  if (msg.includes('row-level security') || err?.status === 403) return new AppError('auth-required', '권한이 없는 요청이에요.');
  if (err?.status === 402 || err?.status === 429) return new AppError('backend-quota');
  if (err?.status === 503 || err?.status === 540) return new AppError('backend-paused');
  if (msg.includes('network') || msg.includes('fetch') || err?.name === 'TypeError') return new AppError('network');
  return new AppError('unknown', undefined, e);
}

export class SupabaseCommunityRepository implements CommunityRepository {
  private get sb(): SupabaseClient {
    const c = getSupabase();
    if (!c) throw new AppError('backend-not-configured');
    return c;
  }

  status(): BackendStatus {
    return getSupabase() ? 'ready' : 'not-configured';
  }

  private publicUrl(path: string): string {
    return this.sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  private toPost(r: FeedRow): FeedPost {
    return {
      id: r.id,
      authorId: r.author_id,
      authorHandle: r.author_handle,
      imagePath: r.image_path,
      thumbnailPath: r.thumbnail_path,
      imageUrl: this.publicUrl(r.image_path),
      thumbUrl: this.publicUrl(r.thumbnail_path),
      title: sanitizeTitle(r.title),
      styleTags: sanitizeStyleTags(r.style_tags ?? []),
      occasion: sanitizeOccasion(r.occasion),
      weatherSummary: r.weather_summary,
      featuredOn: r.featured_on,
      createdAt: r.created_at,
      likeCount: Number(r.heart_count) || 0,
      likedByMe: !!r.hearted_by_me,
      moderationStatus: r.moderation_status,
    };
  }

  async getSession(): Promise<CommunitySession | null> {
    if (!getSupabase()) return null;
    const { data } = await this.sb.auth.getSession();
    const u = data.session?.user;
    return u ? { userId: u.id, email: u.email ?? null } : null;
  }

  onSessionChange(cb: (s: CommunitySession | null) => void): () => void {
    const c = getSupabase();
    if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_evt, session) => {
      cb(session?.user ? { userId: session.user.id, email: session.user.email ?? null } : null);
    });
    return () => data.subscription.unsubscribe();
  }

  async sendEmailCode(email: string): Promise<void> {
    const { error } = await this.sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) throw mapBackendError(error);
  }

  async verifyEmailCode(email: string, code: string): Promise<CommunitySession> {
    const { data, error } = await this.sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error || !data.user) throw new AppError('auth-failed', undefined, error);
    return { userId: data.user.id, email: data.user.email ?? null };
  }

  async listSocialProviders(): Promise<SocialProviderId[]> {
    try {
      return enabledSocialProviders(await fetchAuthSettings());
    } catch {
      return []; // offline: email sign-in stays available
    }
  }

  async signInWithProvider(provider: SocialProviderId): Promise<CommunitySession | null> {
    const hostUri = isRunningInExpoGo() ? Constants.expoConfig?.hostUri : undefined;
    const redirectTo = hostUri ? expoGoCallbackUrl(hostUri) : Linking.createURL(AUTH_CALLBACK_PATH);
    const { data, error } = await this.sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data.url) throw mapBackendError(error ?? new Error('no oauth url'));
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return null; // cancelled or dismissed
    return this.completeOAuthRedirect(res.url);
  }

  /** One exchange per code: on Android the redirect can reach both the auth session and the router. */
  private exchanges = new Map<string, Promise<CommunitySession>>();

  async completeOAuthRedirect(url: string): Promise<CommunitySession | null> {
    const { code, error } = parseAuthCallback(url);
    if (error) throw new AppError('auth-failed', `로그인하지 못했어요: ${error}`);
    if (!code) return null;
    let pending = this.exchanges.get(code);
    if (!pending) {
      pending = this.sb.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
        if (exchangeError || !data.user) throw new AppError('auth-failed', '로그인을 마치지 못했어요. 다시 시도해 주세요.', exchangeError);
        return { userId: data.user.id, email: data.user.email ?? null };
      });
      this.exchanges.set(code, pending);
    }
    return pending;
  }

  async signOut(): Promise<void> {
    await this.sb.auth.signOut();
  }

  async deleteAccount(): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new AppError('auth-required');
    // 1) Remove every storage object in the user's folder (storage rows can't be deleted via SQL safely).
    const { data: files, error: listErr } = await this.sb.storage.from(BUCKET).list(session.userId, { limit: 1000 });
    if (listErr) throw mapBackendError(listErr);
    if (files?.length) {
      const { error } = await this.sb.storage.from(BUCKET).remove(files.map((f) => `${session.userId}/${f.name}`));
      if (error) throw mapBackendError(error);
    }
    // 2) Delete rows + auth user server-side.
    const { error } = await this.sb.rpc('delete_my_account');
    if (error) throw mapBackendError(error);
    await this.sb.auth.signOut();
  }

  async getMyProfile(): Promise<CommunityProfile | null> {
    const s = await this.getSession();
    if (!s) return null;
    const { data, error } = await this.sb.from('profiles').select('id, handle, display_name, created_at').eq('id', s.userId).maybeSingle();
    if (error) throw mapBackendError(error);
    return data ? { userId: data.id, handle: data.handle, displayName: data.display_name, createdAt: data.created_at } : null;
  }

  async upsertMyProfile(handle: string, displayName: string | null): Promise<CommunityProfile> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    const invalid = validateHandle(handle);
    if (invalid) throw new AppError('validation', invalid);
    const { data, error } = await this.sb
      .from('profiles')
      .upsert({ id: s.userId, handle: handle.trim().toLowerCase(), display_name: displayName?.trim() || null })
      .select('id, handle, display_name, created_at')
      .single();
    if (error) {
      if (error.code === '23505') throw new AppError('validation', '이미 사용 중인 핸들이에요.');
      throw mapBackendError(error);
    }
    return { userId: data.id, handle: data.handle, displayName: data.display_name, createdAt: data.created_at };
  }

  private async rpcFeed(args: Record<string, unknown>): Promise<FeedPost[]> {
    const { data, error } = await this.sb.rpc('get_feed', args);
    if (error) throw mapBackendError(error);
    return ((data ?? []) as FeedRow[]).map((r) => this.toPost(r));
  }

  listFeed(q: FeedQuery): Promise<FeedPost[]> {
    return this.rpcFeed({ p_featured: q.kind === 'best', p_style: q.styleTag ?? null, p_before: q.before ?? null, p_limit: q.limit });
  }

  async getPost(id: string): Promise<FeedPost | null> {
    const list = await this.rpcFeed({ p_post_id: id, p_limit: 1 });
    if (list[0]) return list[0];
    const mine = await this.rpcFeed({ p_post_id: id, p_limit: 1, p_mine: true });
    return mine[0] ?? null;
  }

  listMyPosts(): Promise<FeedPost[]> {
    return this.rpcFeed({ p_mine: true, p_limit: 50 });
  }

  async createPost(input: NewPostInput): Promise<FeedPost> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    if (input.image.bytes.byteLength > COMMUNITY_LIMITS.maxUploadBytes) throw new AppError('validation', '이미지가 너무 커요.');
    const id = uuidv4();
    const imagePath = `${s.userId}/${id}.jpg`;
    const thumbPath = `${s.userId}/${id}_t.jpg`;
    const bucket = this.sb.storage.from(BUCKET);
    // upsert:false makes a retried upload with the same path fail instead of duplicating.
    const up1 = await bucket.upload(imagePath, input.image.bytes, { contentType: 'image/jpeg', upsert: false });
    if (up1.error) throw mapBackendError(up1.error);
    const up2 = await bucket.upload(thumbPath, input.thumb.bytes, { contentType: 'image/jpeg', upsert: false });
    if (up2.error) {
      await bucket.remove([imagePath]);
      throw mapBackendError(up2.error);
    }
    const { error } = await this.sb.from('posts').insert({
      id,
      author_id: s.userId,
      image_path: imagePath,
      thumbnail_path: thumbPath,
      title: sanitizeTitle(input.title),
      style_tags: sanitizeStyleTags(input.styleTags),
      occasion: sanitizeOccasion(input.occasion),
      weather_summary: input.weatherSummary,
    });
    if (error) {
      await bucket.remove([imagePath, thumbPath]); // avoid orphaned files
      throw mapBackendError(error);
    }
    const created = await this.getPost(id);
    if (!created) throw new AppError('unknown');
    return created;
  }

  async deleteMyPost(post: Pick<FeedPost, 'id' | 'imagePath' | 'thumbnailPath'>): Promise<void> {
    const { error: sErr } = await this.sb.storage.from(BUCKET).remove([post.imagePath, post.thumbnailPath]);
    if (sErr) throw mapBackendError(sErr);
    const { error } = await this.sb.from('posts').delete().eq('id', post.id);
    if (error) throw mapBackendError(error);
  }

  async heart(postId: string): Promise<void> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    // Idempotent: duplicate hearts are ignored thanks to the (post_id, user_id) primary key.
    const { error } = await this.sb.from('hearts').upsert({ post_id: postId, user_id: s.userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    if (error) throw mapBackendError(error);
  }

  async unheart(postId: string): Promise<void> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    const { error } = await this.sb.from('hearts').delete().eq('post_id', postId).eq('user_id', s.userId);
    if (error) throw mapBackendError(error);
  }

  private async insertReport(row: Record<string, unknown>): Promise<void> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    const { error } = await this.sb.from('reports').insert({ ...row, reporter_id: s.userId });
    // 23505 = already reported by this user → treat as success.
    if (error && error.code !== '23505') throw mapBackendError(error);
  }

  reportPost(postId: string, reason: ReportReason): Promise<void> {
    return this.insertReport({ post_id: postId, reason_code: reason });
  }

  reportUser(userId: string, reason: ReportReason): Promise<void> {
    return this.insertReport({ reported_user_id: userId, reason_code: reason });
  }

  async block(userId: string): Promise<void> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    if (s.userId === userId) throw new AppError('validation', '자기 자신은 차단할 수 없어요.');
    const { error } = await this.sb.from('blocks').upsert({ blocker_id: s.userId, blocked_id: userId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
    if (error) throw mapBackendError(error);
  }

  async unblock(userId: string): Promise<void> {
    const s = await this.getSession();
    if (!s) throw new AppError('auth-required');
    const { error } = await this.sb.from('blocks').delete().eq('blocker_id', s.userId).eq('blocked_id', userId);
    if (error) throw mapBackendError(error);
  }

  async listBlocked(): Promise<BlockedUser[]> {
    const { data, error } = await this.sb.rpc('get_my_blocks');
    if (error) throw mapBackendError(error);
    return ((data ?? []) as { blocked_id: string; handle: string | null; created_at: string }[]).map((r) => ({ userId: r.blocked_id, handle: r.handle, createdAt: r.created_at }));
  }
}

export const communityRepository: CommunityRepository = new SupabaseCommunityRepository();
