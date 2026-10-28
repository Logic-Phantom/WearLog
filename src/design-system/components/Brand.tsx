import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useColors } from '../theme';
import { brandButtons, spacing, touchTarget, typography } from '../tokens';
import { AppText } from './AppText';

/** "WearLog" wordmark + optional tagline (splash, login). */
export function Wordmark({ tagline, onDark }: { tagline?: string; onDark?: boolean }) {
  const c = useColors();
  const color = onDark ? '#FFFFFF' : c.textPrimary;
  return (
    <View style={{ alignItems: 'center', gap: spacing.xxs }} accessible accessibilityRole="header" accessibilityLabel={tagline ? `WearLog, ${tagline}` : 'WearLog'}>
      <AppText style={[typography.brand, { color }]}>WearLog</AppText>
      {tagline ? <AppText variant="secondary" style={{ color: onDark ? 'rgba(255,255,255,0.85)' : c.textSecondary }}>{tagline}</AppText> : null}
    </View>
  );
}

export type SocialProviderKind = 'kakao' | 'google';

/** Standard 4-color Google "G" (branding guideline: never monochrome, never recolored). */
function GoogleG({ size = 18 }: { size?: number }) {
  const g = brandButtons.google.g;
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill={g.red} d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill={g.blue} d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill={g.yellow} d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill={g.green} d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
    </View>
  );
}

/**
 * Kakao / Google sign-in buttons following each provider's guide (tokens.brandButtons): Kakao
 * "카카오 로그인" on #FEE500, radius 12; Google "Google로 로그인" on white with a 1px #747775 border
 * and the standard color "G". Disabled (with a reason) when the provider is not configured.
 * RELEASE BLOCKER: the Kakao guide requires its official speech-bubble symbol asset — the Ionicons
 * bubble below is a stand-in until the official resource (developers.kakao.com/tool/resource/login)
 * is added (docs/RELEASE_CHECKLIST.md).
 */
export function SocialSignInButton({ provider, onPress, disabled, loading }: { provider: SocialProviderKind; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const kakao = provider === 'kakao';
  const label = kakao ? '카카오 로그인' : 'Google로 로그인';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.social,
        kakao
          ? { backgroundColor: brandButtons.kakao.background, borderColor: brandButtons.kakao.background, borderRadius: brandButtons.kakao.radius }
          : { backgroundColor: brandButtons.google.background, borderColor: brandButtons.google.border, borderRadius: brandButtons.google.radius },
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      {kakao ? <Ionicons name="chatbubble" size={18} color={brandButtons.kakao.symbol} /> : <GoogleG />}
      <AppText variant="bodyStrong" style={{ color: kakao ? brandButtons.kakao.text : brandButtons.google.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  social: {
    minHeight: touchTarget + 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
