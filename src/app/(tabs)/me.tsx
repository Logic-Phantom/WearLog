import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Row, ScreenScroll, SecondaryButton, spacing, useColors, type IconName } from '@/design-system';
import { listOutfits } from '@/features/outfit-builder/outfit-repository';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';
import { useCommunitySession } from '@/hooks/use-community-session';

/**
 * 프로필 / 설정 (showcase). Stats are real local counts (내 옷 · 코디 · 착용) — no follower numbers
 * until a follow graph exists. Community identity only when signed in.
 */
export default function MeScreen() {
  const router = useRouter();
  const c = useColors();
  const { dataVersion } = useAppState();
  const { session } = useCommunitySession();
  const profile = useAsync(() => (session ? communityRepository.getMyProfile() : Promise.resolve(null)), [session?.userId]);
  const counts = useAsync(async () => ({ garments: (await listGarments()).length, outfits: (await listOutfits(500)).length }), [dataVersion]);

  return (
    <ScreenScroll topInset>
      <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
        <Avatar size={72} label="프로필 사진" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title">{profile.data?.handle ?? '나의 WearLog'}</AppText>
          <AppText variant="caption" tone="secondary">
            오늘도 좋은 옷, 좋은 하루 🌿
          </AppText>
        </View>
      </Row>

      <Row style={{ justifyContent: 'space-around' }}>
        <Stat label="내 옷" value={counts.data?.garments ?? 0} />
        <Stat label="저장한 코디" value={counts.data?.outfits ?? 0} />
        <Stat label="게시물" value={0} />
      </Row>

      <SecondaryButton compact label="편집" onPress={() => router.push('/onboarding/taste')} accessibilityHint="취향을 다시 설정해요" />

      <View>
        <MenuRow icon="file-tray-outline" label="내 옷장" onPress={() => router.push('/wardrobe')} />
        <MenuRow icon="time-outline" label="착용 기록" onPress={() => router.push('/wear-log')} />
        <MenuRow icon="heart-outline" label="베스트 착장" onPress={() => router.push('/community')} />
        <MenuRow icon="create-outline" label="내가 쓴 글" onPress={() => router.push(session ? '/community' : '/community/account')} />
        <MenuRow icon="settings-outline" label="설정" onPress={() => router.push('/settings')} />
      </View>

      {session ? (
        <SecondaryButton label="로그아웃" onPress={() => communityRepository.signOut()} style={{ backgroundColor: c.surfaceSunken, borderColor: c.surfaceSunken }} />
      ) : (
        <SecondaryButton label="로그인" onPress={() => router.push('/community/account')} style={{ backgroundColor: c.surfaceSunken, borderColor: c.surfaceSunken }} />
      )}
    </ScreenScroll>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 72 }} accessible accessibilityLabel={`${label} ${value}`}>
      <AppText variant="numeric">{value}</AppText>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.menu, { borderBottomColor: c.border }, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={c.textPrimary} />
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
});
