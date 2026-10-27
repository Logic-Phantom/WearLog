import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, radius, spacing, splashColors as S, touchTarget, typography, useColors } from '@/design-system';
import { showcaseImage } from '@/features/sample-wardrobe/showcase-assets';
import { useAppState } from '@/hooks/app-state';

/**
 * Splash/intro (showcase: 스플래시 & 온보딩). Hanger-rack photo from the user's showcase board,
 * WearLog wordmark, 시작하기 → 취향 설정, 로그인 → 로그인 화면. "둘러보기" skips without an account.
 */
export default function OnboardingIntro() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { updateTaste } = useAppState();

  return (
    <View style={[styles.root, { backgroundColor: S.wall }]}>
      <Image source={showcaseImage('p-splash')} style={styles.photo} contentFit="cover" contentPosition="bottom" accessibilityIgnoresInvertColors />
      <LinearGradient colors={[S.wall, S.wallClear]} style={styles.fadeTop} />
      <LinearGradient colors={[S.wallClear, S.wallFade]} style={styles.fadeBottom} />

      <View style={{ paddingTop: insets.top + 96, alignItems: 'center', gap: spacing.xs }} accessible accessibilityRole="header" accessibilityLabel="WearLog, Your Style, Your Log">
        <AppText style={[typography.brand, { fontSize: 40, lineHeight: 48, color: S.ink }]}>WearLog</AppText>
        <AppText variant="body" style={{ color: S.sub }}>
          Your Style, Your Log
        </AppText>
      </View>

      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
        <Pressable
          onPress={async () => {
            await updateTaste({ onboardingState: 'inProgress' });
            router.replace('/onboarding/taste');
          }}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
          style={({ pressed }) => [styles.outline, { backgroundColor: S.ink }, pressed && { opacity: 0.85 }]}>
          <AppText variant="bodyStrong" style={{ color: S.onInk }}>
            시작하기
          </AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/community/account')} accessibilityRole="button" accessibilityLabel="로그인" style={({ pressed }) => [styles.outline, pressed && { opacity: 0.7 }]}>
          <AppText variant="bodyStrong" style={{ color: S.ink }}>
            로그인
          </AppText>
        </Pressable>
        <Pressable
          onPress={async () => {
            await updateTaste({ onboardingState: 'skipped' });
            router.replace('/');
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={{ alignSelf: 'center', paddingVertical: spacing.xxs }}>
          <AppText variant="caption" style={{ color: c.textSecondary }}>
            로그인 없이 둘러보기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  photo: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '22%' },
  fadeTop: { position: 'absolute', left: 0, right: 0, top: '22%', height: 120 },
  fadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  outline: { minHeight: touchTarget + 4, borderRadius: radius.chip, borderWidth: 1, borderColor: S.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: S.glass },
});
