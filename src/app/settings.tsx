import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { AppSwitch, AppText, Card, DangerButton, Divider, ListRow, ScreenScroll, spacing } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import { defaultTasteProfile } from '@/features/taste-onboarding/taste-profile';
import { wipeAllTables } from '@/infrastructure/database/database';
import { deleteAllAppFiles } from '@/infrastructure/file-storage/app-files';
import { useAppState } from '@/hooks/app-state';

/** 설정: 개인화, 날씨, 데이터 삭제. Export/backup: docs/ROADMAP.md Phase 2. */
export default function SettingsScreen() {
  const router = useRouter();
  const { taste, updateTaste, bumpData } = useAppState();

  const wipe = () =>
    Alert.alert('기기 안의 모든 WearLog 데이터를 삭제할까요?', '내 옷·코디·착용 기록·취향과 앱이 만든 사진 사본이 삭제돼요. 사진첩 원본과 커뮤니티 게시물은 그대로예요(커뮤니티는 계정 화면에서 삭제).', [
      { text: '취소', style: 'cancel' },
      {
        text: '전체 삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await wipeAllTables();
            deleteAllAppFiles();
            await updateTaste(defaultTasteProfile());
            bumpData();
            router.replace('/onboarding');
          } catch (e) {
            Alert.alert('삭제하지 못했어요', toUserMessage(e));
          }
        },
      },
    ]);

  return (
    <ScreenScroll>
      <Card padded={false}>
        <ListRow label="취향 반영 추천" right={<AppSwitch accessibilityLabel="취향 반영 추천" value={taste.personalizationEnabled} onValueChange={(v) => updateTaste({ personalizationEnabled: v })} />} />
        <Divider />
        <ListRow label="취향 다시 설정" onPress={() => router.push('/onboarding/taste')} />
        <Divider />
        <ListRow label="날씨 설정" onPress={() => router.push('/weather')} />
        <Divider />
        <ListRow label="커뮤니티 계정" onPress={() => router.push('/community/account')} />
      </Card>
      <AppText variant="caption" tone="tertiary" style={{ paddingHorizontal: spacing.xs }}>
        옷장·사진·기록·취향은 이 기기에만 저장돼요. 로그인해도 자동으로 업로드되지 않아요.
      </AppText>
      <DangerButton label="기기 데이터 전체 삭제" icon="trash-outline" onPress={wipe} />
    </ScreenScroll>
  );
}
