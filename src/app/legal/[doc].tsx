import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText, ErrorState, ScreenScroll, spacing } from '@/design-system';
import { POLICIES, type PolicyId } from '@/features/legal/policies';

/** 개인정보 처리방침 / 커뮤니티 가이드라인 (static, bundled — readable offline). */
export default function PolicyScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const policy = POLICIES[doc as PolicyId];
  if (!policy) return <ErrorState title="문서를 찾을 수 없어요" message="잘못된 주소예요." />;
  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: policy.title }} />
      <AppText variant="caption" tone="tertiary">
        {policy.status}
      </AppText>
      {policy.sections.map((s) => (
        <View key={s.heading} style={{ gap: spacing.xs }}>
          <AppText variant="sectionTitle">{s.heading}</AppText>
          {s.body.map((line) => (
            <AppText key={line} variant="body" tone="secondary" selectable>
              {s.body.length > 1 ? `· ${line}` : line}
            </AppText>
          ))}
        </View>
      ))}
    </ScreenScroll>
  );
}
