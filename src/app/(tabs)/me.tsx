import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Divider, ListRow, Row, ScreenScroll, SecondaryButton, spacing, useColors } from '@/design-system';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';
import { useCommunitySession } from '@/hooks/use-community-session';

/** 프로필: local stats always; community identity only when signed in. */
export default function MeScreen() {
  const router = useRouter();
  const c = useColors();
  const { dataVersion } = useAppState();
  const { session } = useCommunitySession();
  const profile = useAsync(() => (session ? communityRepository.getMyProfile() : Promise.resolve(null)), [session?.userId]);
  const garments = useAsync(() => listGarments(), [dataVersion]);

  return (
    <ScreenScroll topInset>
      <Row gap={spacing.sm}>
        <View style={[styles.avatar, { backgroundColor: c.surfaceSunken }]}>
          <Ionicons name="person" size={30} color={c.textTertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{profile.data?.handle ?? '나의 WearLog'}</AppText>
          <AppText variant="secondary" tone="secondary">{session ? '커뮤니티에 로그인됨' : '로그인 없이 사용 중'}</AppText>
        </View>
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-around' }}>
          <Stat label="내 옷" value={garments.data?.length ?? 0} />
        </Row>
      </Card>

      <Card padded={false}>
        <ListRow icon="shirt-outline" label="내 옷장" onPress={() => router.push('/wardrobe')} />
        <Divider />
        <ListRow icon="calendar-outline" label="착용 기록" detail="CPW" onPress={() => router.push('/wear-log')} />
        <Divider />
        <ListRow icon="color-palette-outline" label="샘플 옷장" onPress={() => router.push('/sample-wardrobe')} />
        <Divider />
        <ListRow icon="heart-outline" label="취향 다시 설정" onPress={() => router.push('/onboarding/taste')} />
        <Divider />
        <ListRow icon="settings-outline" label="설정" onPress={() => router.push('/settings')} />
      </Card>

      {session ? (
        <SecondaryButton label="로그아웃" onPress={() => communityRepository.signOut()} />
      ) : (
        <SecondaryButton label="커뮤니티 로그인" icon="log-in-outline" onPress={() => router.push('/community/account')} />
      )}
    </ScreenScroll>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${label} ${value}개`}>
      <AppText variant="numeric">{value}</AppText>
      <AppText variant="caption" tone="secondary">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
