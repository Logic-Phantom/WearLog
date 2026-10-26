import type { Occasion, StyleTag } from '@/domain/categories';
import type { SocialProviderId } from '@/features/auth/social-auth';

import type { ReportReason } from './moderation-policy';

/** Provider-agnostic boundary for the community backend (Supabase today). */

export type BackendStatus = 'not-configured' | 'ready';

export interface CommunitySession {
  userId: string;
  email: string | null;
}

export interface CommunityProfile {
  userId: string;
  handle: string;
  displayName: string | null;
  createdAt: string;
}

export type ModerationStatus = 'pending' | 'visible' | 'hidden' | 'removed';

/** Server snapshot of a shared outfit. Never carries local outfit/garment ids or canvas JSON. */
export interface FeedPost {
  id: string;
  authorId: string;
  authorHandle: string;
  imageUrl: string;
  thumbUrl: string;
  imagePath: string;
  thumbnailPath: string;
  title: string | null;
  styleTags: StyleTag[];
  occasion: Occasion | null;
  weatherSummary: string | null;
  /** Set by operators for "오늘의 베스트 착장" — curation, not a popularity rank. */
  featuredOn: string | null;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  moderationStatus: ModerationStatus;
}

export type FeedKind = 'best' | 'latest';

export interface FeedQuery {
  kind: FeedKind;
  styleTag?: StyleTag | null;
  before?: string | null;
  limit: number;
}

export interface NewPostInput {
  image: { bytes: Uint8Array; width: number; height: number };
  thumb: { bytes: Uint8Array; width: number; height: number };
  title: string | null;
  styleTags: StyleTag[];
  occasion: Occasion | null;
  weatherSummary: string | null;
}

export interface BlockedUser {
  userId: string;
  handle: string | null;
  createdAt: string;
}

export interface CommunityRepository {
  status(): BackendStatus;
  getSession(): Promise<CommunitySession | null>;
  onSessionChange(cb: (s: CommunitySession | null) => void): () => void;
  sendEmailCode(email: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<CommunitySession>;
  listSocialProviders(): Promise<SocialProviderId[]>;
  /** Opens the provider's sign-in in the system browser. Resolves null if the user cancelled. */
  signInWithProvider(provider: SocialProviderId): Promise<CommunitySession | null>;
  completeOAuthRedirect(url: string): Promise<CommunitySession | null>;
  signOut(): Promise<void>;
  /** Deletes storage images, posts, hearts, blocks, profile and the auth user. */
  deleteAccount(): Promise<void>;

  getMyProfile(): Promise<CommunityProfile | null>;
  upsertMyProfile(handle: string, displayName: string | null): Promise<CommunityProfile>;

  listFeed(q: FeedQuery): Promise<FeedPost[]>;
  getPost(id: string): Promise<FeedPost | null>;
  listMyPosts(): Promise<FeedPost[]>;
  createPost(input: NewPostInput): Promise<FeedPost>;
  /** Removes storage objects first, then the row. Safe to retry. */
  deleteMyPost(post: Pick<FeedPost, 'id' | 'imagePath' | 'thumbnailPath'>): Promise<void>;

  heart(postId: string): Promise<void>;
  unheart(postId: string): Promise<void>;

  reportPost(postId: string, reason: ReportReason): Promise<void>;
  reportUser(userId: string, reason: ReportReason): Promise<void>;

  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  listBlocked(): Promise<BlockedUser[]>;
}
