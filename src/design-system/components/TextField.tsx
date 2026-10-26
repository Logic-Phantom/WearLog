import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useColors } from '../theme';
import { fonts, radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';

/** Labeled text input; label is always visible (not placeholder-only) for accessibility. */
export function TextField({ label, error, hint, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: spacing.xxs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textTertiary}
        style={[styles.input, { color: c.textPrimary, backgroundColor: c.surface, borderColor: error ? c.error : c.border }]}
        maxFontSizeMultiplier={2}
        {...rest}
      />
      {error ? <AppText variant="caption" tone="error">{error}</AppText> : hint ? <AppText variant="caption" tone="tertiary">{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: touchTarget + 4, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: spacing.sm, fontFamily: fonts.regular, fontSize: 15 },
});
