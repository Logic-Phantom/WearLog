import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, BottomBar, Card, ColorSwatchRow, IconButton, InlineMessage, PrimaryButton, Row, ScreenScroll, SecondaryButton, SourceBadge, contentMaxWidth, radius, spacing, successFeedback, useColors } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import type { GarmentItem, ItemRef, Outfit } from '@/domain/models';
import { GARMENT_COLORS, type ColorId } from '@/domain/palette';
import { localDay } from '@/domain/wear';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { autoLayout, canvasReducer, createCanvas } from '@/features/outfit-builder/canvas-state';
import { getOutfit, saveOutfit } from '@/features/outfit-builder/outfit-repository';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { ownedIdsOf, recordWear } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';
import { newId } from '@/utils/id';

const STEP = 0.03;

/**
 * 코디 빌더 (prompt §3.6). Every manipulation has a button (no drag-only control); undo/redo;
 * layout saved as normalized JSON. Drag/pinch gestures are a follow-up POC (docs/ROADMAP.md).
 */
export default function BuilderScreen() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();
  const { bumpData } = useAppState();
  const params = useLocalSearchParams<{ outfitId: string; refs?: string }>();
  const isNew = params.outfitId === 'new';
  const [outfitId] = useState(() => (isNew ? newId('of_') : params.outfitId));
  const [state, dispatch] = useReducer(canvasReducer, outfitId, (id) => createCanvas(id));
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const owned = useAsync(() => listGarments(), []);
  const ownedMap = useMemo(() => new Map<string, GarmentItem>((owned.data ?? []).map((g) => [g.id, g])), [owned.data]);

  // Seed from route params (preset / recommendation) or from a saved outfit.
  useEffect(() => {
    if (initialized) return;
    (async () => {
      if (isNew) {
        const refs = params.refs ? (JSON.parse(params.refs) as { itemRef: ItemRef; category: string }[]) : [];
        dispatch({ type: 'load', elements: autoLayout(outfitId, refs).layout.elements });
      } else {
        const saved = await getOutfit(outfitId);
        dispatch({ type: 'load', elements: saved?.layout?.elements ?? [] });
      }
      setInitialized(true);
    })().catch((e) => setMessage({ tone: 'error', text: toUserMessage(e) }));
  }, [initialized, isNew, outfitId, params.refs]);

  const side = Math.min(width, contentMaxWidth) - spacing.md * 2;
  const canvasH = side / state.layout.aspect;
  const sel = state.layout.elements.find((e) => e.id === state.selectedId) ?? null;
  const selTemplate = sel?.itemRef.kind === 'sampleTemplate' ? getTemplate(sel.itemRef.templateId) : null;
  const refs = state.layout.elements.map((e) => e.itemRef);
  const onlySamples = refs.length > 0 && ownedIdsOf(refs).length === 0;

  const save = async (): Promise<Outfit> => {
    const now = new Date().toISOString();
    const outfit: Outfit = {
      id: outfitId,
      title: onlySamples ? '샘플 코디' : '내 코디',
      itemRefs: refs,
      styleTags: [],
      occasion: null,
      source: onlySamples ? 'samplePreset' : 'manual',
      thumbnailUri: null,
      createdAt: now,
      updatedAt: now,
    };
    await saveOutfit(outfit, state.layout);
    bumpData();
    return outfit;
  };

  const wearToday = async () => {
    try {
      const o = await save();
      const ev = await recordWear(localDay(), o.id, o.itemRefs);
      successFeedback();
      setMessage(ev ? { tone: 'success', text: `오늘 착용으로 기록했어요 (내 옷 ${ev.garmentItemIds.length}벌). 같은 날 다시 눌러도 한 번만 기록돼요.` } : { tone: 'info', text: '샘플 아이템은 착용 기록에 포함되지 않아요. 내 옷을 넣으면 기록돼요.' });
      bumpData();
    } catch (e) {
      setMessage({ tone: 'error', text: toUserMessage(e) });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Row gap={0}>
              <IconButton icon="arrow-undo" label="실행 취소" disabled={!state.past.length} onPress={() => dispatch({ type: 'undo' })} />
              <IconButton icon="arrow-redo" label="다시 실행" disabled={!state.future.length} onPress={() => dispatch({ type: 'redo' })} />
            </Row>
          ),
        }}
      />
      <ScreenScroll withBottomBar>
        {message ? <InlineMessage tone={message.tone} message={message.text} /> : null}
        <Pressable onPress={() => dispatch({ type: 'select', id: null })} accessibilityLabel="캔버스" style={[styles.canvas, { width: side, height: canvasH, backgroundColor: c.photoBackdrop }]}>
          {[...state.layout.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((e) => {
              const selected = e.id === state.selectedId;
              const name = e.itemRef.kind === 'sampleTemplate' ? getTemplate(e.itemRef.templateId)?.nameKo : ownedMap.get(e.itemRef.garmentItemId)?.name;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => dispatch({ type: 'select', id: e.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${name ?? '아이템'}${e.itemRef.kind === 'sampleTemplate' ? ', 샘플' : ', 내 옷'}`}
                  style={{
                    position: 'absolute',
                    left: e.x * side,
                    top: e.y * canvasH,
                    width: e.width * side,
                    height: e.height * side,
                    opacity: e.opacity,
                    transform: [{ rotate: `${e.rotation}deg` }, { scaleX: e.flipX ? -1 : 1 }],
                    borderWidth: selected ? 1.5 : 0,
                    borderColor: c.textPrimary,
                    borderStyle: 'dashed',
                    borderRadius: 6,
                  }}>
                  <ItemVisual itemRef={e.itemRef} owned={e.itemRef.kind === 'ownedGarment' ? ownedMap.get(e.itemRef.garmentItemId) : null} size={e.width * side} />
                </Pressable>
              );
            })}
        </Pressable>

        {sel ? (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Row>
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  {selTemplate?.nameKo ?? (sel.itemRef.kind === 'ownedGarment' ? ownedMap.get(sel.itemRef.garmentItemId)?.name : '')}
                </AppText>
                <SourceBadge source={sel.itemRef.kind === 'ownedGarment' ? 'owned' : 'sample'} />
              </Row>
              <Row wrap gap={0}>
                <IconButton icon="arrow-up" label="위로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: 0, dy: -STEP })} />
                <IconButton icon="arrow-down" label="아래로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: 0, dy: STEP })} />
                <IconButton icon="arrow-back" label="왼쪽으로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: -STEP, dy: 0 })} />
                <IconButton icon="arrow-forward" label="오른쪽으로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: STEP, dy: 0 })} />
                <IconButton icon="add-circle-outline" label="크게" onPress={() => dispatch({ type: 'scale', id: sel.id, factor: 1.1 })} />
                <IconButton icon="remove-circle-outline" label="작게" onPress={() => dispatch({ type: 'scale', id: sel.id, factor: 1 / 1.1 })} />
                <IconButton icon="refresh" label="15도 회전" onPress={() => dispatch({ type: 'rotate', id: sel.id, degrees: 15 })} />
                <IconButton icon="swap-horizontal" label="좌우 반전" onPress={() => dispatch({ type: 'flip', id: sel.id })} />
                <IconButton icon="layers-outline" label="앞으로" onPress={() => dispatch({ type: 'bringForward', id: sel.id })} />
                <IconButton icon="layers" label="뒤로" onPress={() => dispatch({ type: 'sendBackward', id: sel.id })} />
                <IconButton icon="copy-outline" label="복제" onPress={() => dispatch({ type: 'duplicate', id: sel.id })} />
                <IconButton icon="trash-outline" label="삭제" onPress={() => dispatch({ type: 'remove', id: sel.id })} />
              </Row>
              {selTemplate && sel.itemRef.kind === 'sampleTemplate' ? (
                <ColorSwatchRow
                  options={GARMENT_COLORS.filter((g) => selTemplate.supportedColorIds.includes(g.id)).map((g) => ({ ...g, isLight: g.luminanceGroup === 2 }))}
                  value={sel.itemRef.customization.colorId}
                  onChange={(id) => dispatch({ type: 'customize', id: sel.id, customization: { colorId: id as ColorId } })}
                />
              ) : null}
            </View>
          </Card>
        ) : (
          <AppText variant="secondary" tone="secondary" align="center">
            아이템을 눌러 선택하면 위치·크기·색상을 바꿀 수 있어요
          </AppText>
        )}
        <SecondaryButton label="샘플 아이템 더 담기" icon="add" onPress={() => router.push('/sample-wardrobe')} />
      </ScreenScroll>
      <BottomBar>
        <SecondaryButton compact label="오늘 착용함" disabled={!refs.length} onPress={() => (onlySamples ? Alert.alert('샘플만 있는 코디예요', '샘플 아이템은 착용 기록·CPW에 포함되지 않아요.', [{ text: '확인' }]) : wearToday())} />
        <PrimaryButton
          label="코디 저장하기"
          disabled={!refs.length}
          onPress={() =>
            save()
              .then(() => (successFeedback(), setMessage({ tone: 'success', text: '코디를 저장했어요.' })))
              .catch((e) => setMessage({ tone: 'error', text: toUserMessage(e) }))
          }
          style={{ flex: 1 }}
        />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { borderRadius: radius.tile, overflow: 'hidden', alignSelf: 'center' },
});
