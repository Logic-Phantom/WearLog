import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, EmptyState, Row, ScreenScroll, Tag, compactCount, radius, spacing, tapFeedback, useColors } from '@/design-system';
import { getSamplePost } from '@/features/community/sample-feed';

/**
 * 커뮤니티 상세 (showcase). Today this renders bundled sample posts only; hearts here are local to
 * the screen. Comments are out of MVP scope (prompt §3.10: hearts only), so the input is disabled.
 */
export default function PostDetailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = getSamplePost(postId);
  const [liked, setLiked] = useState(false);

  if (!post) return <EmptyState icon="images-outline" title="게시물을 찾을 수 없어요" message="삭제되었거나 볼 수 없는 게시물이에요." />;
  const likes = post.likeCount + (liked ? 1 : 0);
  const toggle = () => (tapFeedback(), setLiked((v) => !v));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 120 + insets.bottom }}>
        <Row gap={spacing.xs}>
          <Avatar source={post.avatar} size={36} />
          <View style={{ flex: 1 }}>
            <AppText variant="label">{post.authorHandle}</AppText>
            <AppText variant="caption" tone="tertiary">
              {post.timeLabel} · 샘플 게시물
            </AppText>
          </View>
        </Row>
        <View style={[styles.photo, { backgroundColor: c.photoBackdrop }]}>
          <Image source={post.image} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={post.title} />
        </View>
        <AppText variant="bodyStrong">{post.title}</AppText>
        <Row wrap>
          {post.hashtags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </Row>
        <Row gap={spacing.md}>
          <Pressable onPress={toggle} hitSlop={8} accessibilityRole="button" accessibilityLabel={liked ? '하트 취소' : '하트'} accessibilityState={{ selected: liked }} style={styles.action}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={c.heart} />
            <AppText variant="caption">{compactCount(likes)}</AppText>
          </Pressable>
          <View style={styles.action} accessible accessibilityLabel={`댓글 ${post.commentCount}개`}>
            <Ionicons name="chatbubble-outline" size={20} color={c.textPrimary} />
            <AppText variant="caption">{post.commentCount}</AppText>
          </View>
          <Ionicons name="share-social-outline" size={20} color={c.textTertiary} accessibilityLabel="공유 준비 중" />
        </Row>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <Row gap={spacing.xs}>
          <Avatar size={28} />
          <View style={{ flex: 1 }}>
            <AppText variant="caption">너무 예뻐요! 어디서 구매하셨나요?</AppText>
            <AppText variant="caption" tone="tertiary" style={{ fontSize: 10 }}>
              샘플 댓글
            </AppText>
          </View>
        </Row>
      </ScreenScroll>
      <View style={[styles.inputBar, { backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <View style={[styles.input, { backgroundColor: c.surfaceSunken }]}>
          <AppText variant="secondary" tone="tertiary">
            댓글 기능은 준비 중이에요
          </AppText>
        </View>
        <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={liked ? '하트 취소' : '하트'} style={[styles.heartBtn, { backgroundColor: c.surfaceSunken }]}>
          <Ionicons name="heart" size={22} color={c.heart} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 0.94, borderRadius: radius.tile, overflow: 'hidden' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  inputBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  input: { flex: 1, minHeight: 44, borderRadius: 22, justifyContent: 'center', paddingHorizontal: spacing.md },
  heartBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
