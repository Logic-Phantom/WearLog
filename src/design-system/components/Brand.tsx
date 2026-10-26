import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useColors } from '../theme';
import { brandButtons, radius, spacing, touchTarget, typography } from '../tokens';
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

/**
 * Kakao / Google sign-in buttons. Colors follow each provider's brand guideline; the label stays a
 * full sentence for screen readers. Disabled (with a reason) when the provider is not configured.
 */
export function SocialSignInButton({ provider, onPress, disabled, loading }: { provider: SocialProviderKind; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const kakao = provider === 'kakao';
  const style = kakao ? brandButtons.kakao : brandButtons.google;
  const label = kakao ? '카카오로 시작하기' : 'Google로 시작하기';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.social,
        { backgroundColor: style.background, borderColor: kakao ? style.background : brandButtons.google.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      <Ionicons name={kakao ? 'chatbubble' : 'logo-google'} size={18} color={style.text} />
      <AppText variant="bodyStrong" style={{ color: style.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  social: {
    minHeight: touchTarget + 4,
    borderRadius: radius.chip,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
