import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton, Wordmark, spacing, useColors } from '@/design-system';
import { GarmentVector } from '@/features/sample-wardrobe/components/GarmentVector';
import { useAppState } from '@/hooks/app-state';

/**
 * Splash/intro (showcase: 스플래시 & 온보딩). The hero is drawn from our own garment vectors —
 * no stock or brand photos. 시작하기 → 취향 설정; 건너뛰기 → app, no account needed.
 */
export default function OnboardingIntro() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { updateTaste } = useAppState();

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}>
      <Wordmark tagline="Your Style, Your Log" />
      <View style={[styles.hero, { backgroundColor: c.photoBackdrop }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <GarmentVector shapeId="coat" colorId="beige" size={150} />
        <GarmentVector shapeId="knit" colorId="cream" size={120} />
        <GarmentVector shapeId="pants" colorId="charcoal" fit="wide" size={120} />
      </View>
      <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
        <PrimaryButton
          label="시작하기"
          onPress={async () => {
            await updateTaste({ onboardingState: 'inProgress' });
            router.replace('/onboarding/taste');
          }}
        />
        <GhostButton
          label="건너뛰고 둘러보기"
          onPress={async () => {
            await updateTaste({ onboardingState: 'skipped' });
            router.replace('/');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  hero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', borderRadius: 28, padding: spacing.lg, gap: -spacing.md, alignSelf: 'stretch' },
});
