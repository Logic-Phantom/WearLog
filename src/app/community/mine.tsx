import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, ErrorState, GhostButton, InlineMessage, ListRow, Divider, ScreenScroll, SecondaryButton, radius, spacing, useColors } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import type { FeedPost, ModerationStatus } from '@/features/community/community-repository';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { useAsync } from '@/hooks/use-async';
import { useCommunitySession } from '@/hooks/use-community-session';

const STATUS_LABEL: Record<ModerationStatus, string> = {
  pending: '검토 대기 · 아직 다른 사람에게 보이지 않아요',
  visible: '공개 중',
  hidden: '신고로 숨겨짐 · 운영자 확인 중',
  removed: '운영 정책에 따라 내려간 게시물',
};

/**
 * 내 게시물 + 차단 목록 (출시 전 필수, docs/COMMUNITY_SAFETY.md). Server-only data; without a
 * configured backend or a session it explains why instead of showing an empty list.
 */
export default function MyCommunityScreen() {
  const router = useRouter();
  const c = useColors();
  const { configured, session, loading } = useCommunitySession();
  const posts = useAsync(() => (session ? communityRepository.listMyPosts() : Promise.resolve([])), [session?.userId]);
  const blocked = useAsync(() => (session ? communityRepository.listBlocked() : Promise.resolve([])), [session?.userId]);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return <EmptyState icon="cloud-offline-outline" title="커뮤니티 서버가 아직 연결되지 않았어요" message="서버가 연결되면 내 게시물과 차단 목록을 여기서 관리할 수 있어요. 옷장·코디·기록은 지금도 기기에서 그대로 쓸 수 있어요." />;
  }
  if (loading) return null;
  if (!session) {
    return <EmptyState icon="person-circle-outline" title="로그인이 필요해요" message="내 게시물과 차단 목록은 로그인한 계정에만 있어요." actionLabel="로그인" onAction={() => router.push('/community/account')} />;
  }
  if (posts.error) return <ErrorState message={posts.error} onRetry={posts.reload} />;

  const remove = (p: FeedPost) =>
    Alert.alert('이 게시물을 삭제할까요?', '업로드한 이미지와 하트 기록이 함께 삭제돼요. 기기 안의 코디는 그대로예요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          communityRepository
            .deleteMyPost(p)
            .then(posts.reload)
            .catch((e) => setError(toUserMessage(e))),
      },
    ]);

  const unblock = (userId: string, handle: string | null) =>
    Alert.alert(`${handle ? `@${handle}` : '이 사용자'} 차단을 해제할까요?`, '서로의 게시물이 다시 보여요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        onPress: () =>
          communityRepository
            .unblock(userId)
            .then(blocked.reload)
            .catch((e) => setError(toUserMessage(e))),
      },
    ]);

  return (
    <ScreenScroll>
      {error ? <InlineMessage tone="error" message={error} /> : null}
      <AppText variant="sectionTitle">내 게시물</AppText>
      {posts.data && posts.data.length === 0 ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="secondary" tone="tertiary">
            아직 공유한 코디가 없어요
          </AppText>
          <SecondaryButton label="코디 공유하러 가기" onPress={() => router.push('/community/publish')} />
        </View>
      ) : (
        (posts.data ?? []).map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <View style={[styles.thumb, { backgroundColor: c.photoBackdrop }]}>
                <Image source={{ uri: p.thumbUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={p.title ?? '내 게시물'} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {p.title ?? '제목 없음'}
                </AppText>
                <AppText variant="caption" tone={p.moderationStatus === 'visible' ? 'secondary' : 'warning'}>
                  {STATUS_LABEL[p.moderationStatus]}
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {p.createdAt.slice(0, 10)} · 하트 {p.likeCount}
                </AppText>
              </View>
            </View>
            <GhostButton label="삭제" icon="trash-outline" onPress={() => remove(p)} />
          </Card>
        ))
      )}

      <AppText variant="sectionTitle" style={{ marginTop: spacing.md }}>
        차단한 사용자
      </AppText>
      {blocked.error ? (
        <InlineMessage tone="error" message={blocked.error} />
      ) : blocked.data && blocked.data.length === 0 ? (
        <AppText variant="secondary" tone="tertiary">
          차단한 사용자가 없어요
        </AppText>
      ) : (
        <Card padded={false}>
          {(blocked.data ?? []).map((b, i) => (
            <View key={b.userId}>
              {i > 0 ? <Divider /> : null}
              <ListRow label={b.handle ? `@${b.handle}` : '탈퇴했거나 핸들이 없는 사용자'} detail={`${b.createdAt.slice(0, 10)} 차단`} right={<GhostButton label="해제" onPress={() => unblock(b.userId, b.handle)} />} />
            </View>
          ))}
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 64, height: 80, borderRadius: radius.photo, overflow: 'hidden' },
});
