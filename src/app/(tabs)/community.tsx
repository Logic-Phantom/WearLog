import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, ErrorState, IconButton, PrimaryButton, Row, ScreenScroll, SegmentedControl, Tag, radius, spacing, useColors } from '@/design-system';
import { STYLE_TAGS, labelOf } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import type { FeedKind, FeedPost } from '@/features/community/community-repository';
import { COMMUNITY_LIMITS, REPORT_REASONS, type ReportReason } from '@/features/community/moderation-policy';
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
  const [kind, setKind] = useState<FeedKind>('best');
  const feed = useAsync(() => (configured ? communityRepository.listFeed({ kind, limit: COMMUNITY_LIMITS.feedPageSize }) : Promise.resolve([])), [configured, kind, session?.userId]);
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

  if (!configured) {
    return (
      <ScreenScroll topInset>
        <EmptyState icon="cloud-offline-outline" title="커뮤니티 서버 미설정" message="커뮤니티는 선택 기능이에요. 옷장·코디·착용 기록은 로그인 없이 계속 사용할 수 있어요." />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll topInset>
      <SegmentedControl
        options={[
          { id: 'best', label: '오늘의 베스트' },
          { id: 'latest', label: '최신순' },
        ]}
        value={kind}
        onChange={setKind}
      />
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

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 5, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
});
