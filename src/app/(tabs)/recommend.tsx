import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Card, ChipRow, EmptyState, IconButton, InlineMessage, PrimaryButton, Row, ScreenScroll, SecondaryButton, SegmentedControl, spacing } from '@/design-system';
import { GARMENT_CATEGORIES, OCCASIONS, labelOf, type Occasion } from '@/domain/categories';
import { OutfitBoard } from '@/features/outfit-builder/components/OutfitBoard';
import { useRecommendations, type RecommendMode } from '@/features/recommendations/use-recommendations';

type OccasionFilter = Occasion | 'any';
const OCCASION_OPTIONS: { id: OccasionFilter; label: string }[] = [{ id: 'any', label: '전체' }, ...OCCASIONS];

/**
 * 코디추천: 내 옷만(기본) / 샘플 포함(명시적 선택). Each card shows the reasons that actually
 * changed its score, plus 고정·제외 controls (prompt §3.5).
 */
export default function RecommendScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<RecommendMode>('ownedOnly');
  const [occasion, setOccasion] = useState<OccasionFilter>('any');
  const [excluded, setExcluded] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const { result, ownedMap, loading, error } = useRecommendations({ mode, occasion: occasion === 'any' ? null : occasion, excludedKeys: excluded, pinnedKeys: pinned });

  const toggle = (list: string[], set: (v: string[]) => void, key: string) => set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  return (
    <ScreenScroll topInset>
      <AppText variant="screenTitle">오늘의 추천 코디</AppText>
      <SegmentedControl
        options={[
          { id: 'ownedOnly', label: '내 옷만' },
          { id: 'withSamples', label: '샘플 포함' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <ChipRow options={OCCASION_OPTIONS} value={occasion} onChange={setOccasion} />
      {excluded.length || pinned.length ? (
        <Row>
          <SecondaryButton compact label="고정·제외 초기화" onPress={() => (setExcluded([]), setPinned([]))} />
        </Row>
      ) : null}

      {error ? <InlineMessage tone="error" message={error} /> : null}
      {loading || !result ? null : result.kind === 'notEnoughItems' ? (
        <EmptyState
          icon="shirt-outline"
          title="추천할 옷이 부족해요"
          message={`${result.missing.map((m) => labelOf(GARMENT_CATEGORIES, m)).join('·')}을(를) 등록하면 내 옷으로 추천해 드려요. 지금은 샘플로 먼저 조합해 볼 수 있어요.`}
          actionLabel="샘플로 먼저 조합해 보기"
          onAction={() => setMode('withSamples')}
          secondaryLabel="내 옷 등록하기"
          onSecondary={() => router.push('/wardrobe/add')}
        />
      ) : (
        result.results.map((rec, idx) => (
          <Card key={rec.signature}>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="sectionTitle">추천 {idx + 1}</AppText>
              <OutfitBoard refs={rec.items.map((i) => i.ref)} owned={ownedMap} height={200} />
              <View style={{ gap: 2 }}>
                <AppText variant="label">추천 이유</AppText>
                {rec.reasons.length ? (
                  rec.reasons.map((r) => (
                    <AppText key={r.code + r.text} variant="secondary" tone="secondary">
                      · {r.text}
                    </AppText>
                  ))
                ) : (
                  <AppText variant="secondary" tone="secondary">· 기본 조합 규칙(상의·하의·신발)으로 만든 코디예요</AppText>
                )}
                {rec.gaps.map((g) => (
                  <AppText key={g} variant="secondary" tone="warning">
                    · {g}
                  </AppText>
                ))}
              </View>
              <View style={{ gap: 2 }}>
                {rec.items.map((it) => (
                  <Row key={it.key} gap={0}>
                    <AppText variant="secondary" style={{ flex: 1 }} numberOfLines={1}>
                      {it.name}
                      {it.ref.kind === 'sampleTemplate' ? ' (샘플)' : ''}
                    </AppText>
                    <IconButton icon={pinned.includes(it.key) ? 'pin' : 'pin-outline'} active={pinned.includes(it.key)} label={`${it.name} 고정`} onPress={() => toggle(pinned, setPinned, it.key)} />
                    <IconButton icon="close-circle-outline" label={`${it.name} 제외`} onPress={() => toggle(excluded, setExcluded, it.key)} />
                  </Row>
                ))}
              </View>
              <PrimaryButton
                label="코디 빌더에서 편집·저장"
                onPress={() => router.push({ pathname: '/builder/[outfitId]', params: { outfitId: 'new', refs: JSON.stringify(rec.items.map((i) => ({ itemRef: i.ref, category: i.category }))) } })}
              />
            </View>
          </Card>
        ))
      )}
    </ScreenScroll>
  );
}
