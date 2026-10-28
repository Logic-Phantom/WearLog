import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText, ErrorState, ScreenScroll, spacing } from '@/design-system';
import { LEGAL_DOCS, type LegalDocId } from '@/features/legal/documents';

/** 개인정보 처리방침 · 이용약관 · 가이드라인 · 오픈소스 라이선스 · 출처 (bundled — readable offline). */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = LEGAL_DOCS[doc as LegalDocId];
  if (!d) return <ErrorState title="문서를 찾을 수 없어요" message="잘못된 주소예요." />;
  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: d.title }} />
      <AppText variant="caption" tone="tertiary">
        시행일 {d.updatedAt}
      </AppText>
      {d.sections.map((s, i) => (
        <View key={`${i}-${s.heading}`} style={{ gap: spacing.xxs }}>
          <AppText variant="bodyStrong">{s.heading}</AppText>
          <AppText variant="secondary" tone="secondary" selectable>
            {s.body}
          </AppText>
        </View>
      ))}
    </ScreenScroll>
  );
}
