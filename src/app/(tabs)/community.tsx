import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, EmptyState, ErrorState, HeartPill, IconButton, InlineMessage, PrimaryButton, Row, ScreenScroll, SectionTitle, Tag, UnderlineTabs, compactCount, radius, spacing, useColors } from '@/design-system';
import { STYLE_TAGS, labelOf } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import type { FeedKind, FeedPost } from '@/features/community/community-repository';
import { COMMUNITY_LIMITS, REPORT_REASONS, type ReportReason } from '@/features/community/moderation-policy';
import { SAMPLE_POSTS, type SamplePost } from '@/features/community/sample-feed';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { useAsync } from '@/hooks/use-async';
import { useCommunitySession } from '@/hooks/use-community-session';

/**
 * 커뮤니티: "오늘의 베스트 착장" (operator curation, by time — never a popularity rank) + 최신.
 * Hearts only; report/block on every post. Browsing works signed out; acting needs sign-in.
 */
export default function CommunityScreen() {
  const router = useRouter();
  const { configured, session } = useCommunitySession();
  const [tab, setTab] = useState<FeedKind | 'following'>('best');
  const kind: FeedKind = tab === 'latest' ? 'latest' : 'best';
  const feed = useAsync(() => (configured && tab !== 'following' ? communityRepository.listFeed({ kind, limit: COMMUNITY_LIMITS.feedPageSize }) : Promise.resolve([])), [configured, kind, tab, session?.userId]);
  const [overrides, setOverrides] = useState<Record<string, Pick<FeedPost, 'likedByMe' | 'likeCount'>>>({});

  const requireSession = useCallback(() => {
    if (session) return true;
    router.push('/community/account');
    return false;
  }, [session, router]);

  const toggleHeart = async (p: FeedPost) => {
    if (!requireSession()) return;
    const cur = overrides[p.id] ?? p;
    const next = { likedByMe: !cur.likedByMe, likeCount: cur.likeCount + (cur.likedByMe ? -1 : 1) };
    setOverrides((o) => ({ ...o, [p.id]: next })); // optimistic
    try {
      await (cur.likedByMe ? communityRepository.unheart(p.id) : communityRepository.heart(p.id));
    } catch (e) {
      setOverrides((o) => ({ ...o, [p.id]: cur })); // rollback
      Alert.alert('하트를 반영하지 못했어요', toUserMessage(e));
    }
  };

  const moreActions = (p: FeedPost) => {
    if (!requireSession()) return;
    const report = (reason: ReportReason) =>
      communityRepository
        .reportPost(p.id, reason)
        .then(() => Alert.alert('신고했어요', '운영자가 확인할게요.'))
        .catch((e) => Alert.alert('신고하지 못했어요', toUserMessage(e)));
    const block = () =>
      communityRepository
        .block(p.authorId)
        .then(feed.reload)
        .catch((e) => Alert.alert('차단하지 못했어요', toUserMessage(e)));
    const pickReason = () => Alert.alert('신고 사유', undefined, [...REPORT_REASONS.map((r) => ({ text: r.label, onPress: () => report(r.id) })), { text: '취소', style: 'cancel' as const }]);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['게시물 신고', `@${p.authorHandle} 차단`, '취소'], cancelButtonIndex: 2, destructiveButtonIndex: 1 }, (i) => (i === 0 ? pickReason() : i === 1 ? block() : undefined));
    } else {
      Alert.alert('게시물', undefined, [
        { text: '게시물 신고', onPress: pickReason },
        { text: `@${p.authorHandle} 차단`, style: 'destructive', onPress: block },
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  const tabs = (
    <UnderlineTabs
      align="start"
      options={[
        { id: 'best', label: '추천' },
        { id: 'latest', label: '최신순' },
        { id: 'following', label: '팔로잉' },
      ]}
      value={tab}
      onChange={setTab}
    />
  );

  if (tab === 'following') {
    return (
      <ScreenScroll topInset>
        {tabs}
        <EmptyState icon="people-outline" title="팔로잉은 준비 중이에요" message="지금은 추천·최신순에서 다른 사람들의 착장을 볼 수 있어요." />
      </ScreenScroll>
    );
  }

  if (!configured) {
    // No server: the showcase layout with bundled sample posts, clearly labeled — never fake users.
    const posts = tab === 'best' ? SAMPLE_POSTS : [...SAMPLE_POSTS].reverse();
    const open = (p: SamplePost) => router.push({ pathname: '/community/post/[postId]', params: { postId: p.id } });
    return (
      <ScreenScroll topInset>
        {tabs}
        <InlineMessage message="샘플 게시물이에요. 커뮤니티 서버를 연결하면 실제 착장이 보여요." />
        {tab === 'best' ? <BestBanner post={SAMPLE_POSTS[0]} onPress={() => open(SAMPLE_POSTS[0])} /> : null}
        {posts.slice(tab === 'best' ? 1 : 0).map((p) => (
          <SampleFeedCard key={p.id} post={p} onPress={() => open(p)} />
        ))}
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll topInset>
      {tabs}
      <PrimaryButton label="내 착장 공유하기" icon="share-outline" onPress={() => requireSession() && router.push('/community/publish')} />
      {feed.error ? (
        <ErrorState message={feed.error} onRetry={feed.reload} />
      ) : feed.data && feed.data.length === 0 ? (
        <EmptyState icon="images-outline" title={kind === 'best' ? '오늘 선정된 착장이 아직 없어요' : '아직 게시물이 없어요'} message="최신순에서 다른 사람들의 착장을 볼 수 있어요." />
      ) : (
        (feed.data ?? []).map((p) => <PostCard key={p.id} post={{ ...p, ...overrides[p.id] }} onHeart={() => toggleHeart(p)} onMore={() => moreActions(p)} />)
      )}
    </ScreenScroll>
  );
}

function PostCard({ post, onHeart, onMore }: { post: FeedPost; onHeart: () => void; onMore: () => void }) {
  const c = useColors();
  return (
    <Card padded={false}>
      <Image source={{ uri: post.imageUrl }} placeholder={{ uri: post.thumbUrl }} style={[styles.photo, { backgroundColor: c.photoBackdrop }]} contentFit="cover" accessibilityLabel={post.title ?? `@${post.authorHandle}의 착장`} />
      <View style={{ padding: spacing.sm, gap: spacing.xxs }}>
        <Row>
          <AppText variant="label" style={{ flex: 1 }}>@{post.authorHandle}</AppText>
          <IconButton icon={post.likedByMe ? 'heart' : 'heart-outline'} tone="heart" active={post.likedByMe} label={post.likedByMe ? '하트 취소' : '하트'} onPress={onHeart} />
          <AppText variant="caption" tone="secondary" accessibilityLabel={`하트 ${post.likeCount}개`}>
            {post.likeCount}
          </AppText>
          <IconButton icon="ellipsis-horizontal" label="신고·차단" onPress={onMore} />
        </Row>
        {post.title ? <AppText variant="body">{post.title}</AppText> : null}
        <Row wrap>
          {post.styleTags.map((t) => (
            <Tag key={t} label={`#${labelOf(STYLE_TAGS, t)}`} />
          ))}
          {post.weatherSummary ? <Tag label={post.weatherSummary} /> : null}
        </Row>
      </View>
    </Card>
  );
}

/** "오늘의 베스트 착장 더보기 ›" banner card (showcase community home). */
function BestBanner({ post, onPress }: { post: SamplePost; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`오늘의 베스트 착장, 샘플 게시물 ${post.title}`} style={[styles.banner, { backgroundColor: c.surface }]}>
      <View style={[styles.bannerHead, { backgroundColor: c.surfaceSunken }]}>
        <SectionTitle title="오늘의 베스트 착장" onMore={onPress} />
      </View>
      <View style={[styles.wide, { backgroundColor: c.photoBackdrop }]}>
        <Image source={post.wide} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.heartPos}>
          <HeartPill count={post.likeCount} />
        </View>
      </View>
      <View style={{ padding: spacing.sm, gap: spacing.xxs }}>
        <AppText variant="bodyStrong">{post.title}</AppText>
        <AppText variant="caption" tone="tertiary">
          {post.hashtags.join('   ')}
        </AppText>
      </View>
    </Pressable>
  );
}

function SampleFeedCard({ post, onPress }: { post: SamplePost; onPress: () => void }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <Row gap={spacing.xs}>
        <Avatar source={post.avatar} size={34} />
        <View style={{ flex: 1 }}>
          <AppText variant="label">{post.authorHandle}</AppText>
          <AppText variant="caption" tone="tertiary">
            {post.timeLabel} · 샘플
          </AppText>
        </View>
        <AppText variant="caption" tone="secondary">
          ♥ {compactCount(post.likeCount)}
        </AppText>
      </Row>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`샘플 게시물, ${post.title}`} style={[styles.feedPhoto, { backgroundColor: c.photoBackdrop }]}>
        <Image source={post.feed} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Pressable>
      <AppText variant="secondary">{post.title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.tile, overflow: 'hidden' },
  bannerHead: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  wide: { width: '100%', aspectRatio: 1.5 },
  heartPos: { position: 'absolute', right: spacing.xs, bottom: spacing.xs },
  feedPhoto: { width: '100%', aspectRatio: 0.8, borderRadius: radius.tile, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 5, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
});
