import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, ChipRow, IconButton, InlineMessage, ScreenScroll, SourceBadge, contentMaxWidth, radius, spacing, successFeedback, tapFeedback, useColors } from '@/design-system';
import type { GarmentCategory } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import type { CanvasElement, GarmentItem, ItemRef, Outfit } from '@/domain/models';
import { GARMENT_COLORS, colorHex, type ColorId } from '@/domain/palette';
import { localDay } from '@/domain/wear';
import { ItemVisual } from '@/features/outfit-builder/components/ItemVisual';
import { autoLayout, canvasReducer, createCanvas, type CanvasAction } from '@/features/outfit-builder/canvas-state';
import { getOutfit, saveOutfit } from '@/features/outfit-builder/outfit-repository';
import { SAMPLE_TEMPLATES, getTemplate } from '@/features/sample-wardrobe/catalog';
import { listGarments } from '@/features/wardrobe/garment-repository';
import { ownedIdsOf, recordWear } from '@/features/wear-log/wear-repository';
import { useAppState } from '@/hooks/app-state';
import { useAsync } from '@/hooks/use-async';
import { newId } from '@/utils/id';

const STEP = 0.03;
type PickCat = Extract<GarmentCategory, 'top' | 'outer' | 'bottom' | 'shoes' | 'bag' | 'hat'>;
const PICK_CATS: { id: PickCat; label: string }[] = [
  { id: 'top', label: '상의' },
  { id: 'outer', label: '아우터' },
  { id: 'bottom', label: '하의' },
  { id: 'shoes', label: '신발' },
  { id: 'bag', label: '가방' },
  { id: 'hat', label: '모자' },
];

/**
 * 코디 빌더 (showcase): 캔버스 · 색상 점 · 카테고리별 아이템 줄 · 도구 줄 · 저장.
 * Items can be dragged; every manipulation also has a button (accessibility). Undo/redo; layout is
 * saved as normalized JSON.
 */
export default function BuilderScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { bumpData } = useAppState();
  const params = useLocalSearchParams<{ outfitId: string; refs?: string }>();
  const isNew = params.outfitId === 'new';
  const [outfitId] = useState(() => (isNew ? newId('of_') : params.outfitId));
  const [state, dispatch] = useReducer(canvasReducer, outfitId, (id) => createCanvas(id));
  const [initialized, setInitialized] = useState(false);
  const [pickCat, setPickCat] = useState<PickCat>('top');
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const owned = useAsync(() => listGarments(), []);
  const ownedMap = useMemo(() => new Map<string, GarmentItem>((owned.data ?? []).map((g) => [g.id, g])), [owned.data]);

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
  const colorDots = selTemplate && selTemplate.supportedColorIds.length > 1 ? GARMENT_COLORS.filter((g) => selTemplate.supportedColorIds.includes(g.id)).slice(0, 8) : [];

  const pickables = useMemo(() => {
    const mine = (owned.data ?? []).filter((g) => g.category === pickCat).map((g) => ({ key: `o:${g.id}`, ref: { kind: 'ownedGarment', garmentItemId: g.id } as ItemRef, name: g.name, sample: false }));
    const samples = SAMPLE_TEMPLATES.filter((t) => t.category === pickCat && t.photo).map((t) => ({ key: `s:${t.id}`, ref: { kind: 'sampleTemplate', templateId: t.id, customization: { colorId: t.defaultColorId } } as ItemRef, name: t.nameKo, sample: true }));
    return [...mine, ...samples];
  }, [owned.data, pickCat]);

  const save = async (): Promise<Outfit> => {
    const now = new Date().toISOString();
    const outfit: Outfit = { id: outfitId, title: onlySamples ? '샘플 코디' : '내 코디', itemRefs: refs, styleTags: [], occasion: null, source: onlySamples ? 'samplePreset' : 'manual', thumbnailUri: null, createdAt: now, updatedAt: now };
    await saveOutfit(outfit, state.layout);
    bumpData();
    return outfit;
  };
  const saveWithMessage = () =>
    save()
      .then(() => (successFeedback(), setMessage({ tone: 'success', text: '코디를 저장했어요.' })))
      .catch((e) => setMessage({ tone: 'error', text: toUserMessage(e) }));

  const wearToday = async () => {
    if (onlySamples) return Alert.alert('샘플만 있는 코디예요', '샘플 아이템은 착용 기록·CPW에 포함되지 않아요.', [{ text: '확인' }]);
    try {
      const o = await save();
      const ev = await recordWear(localDay(), o.id, o.itemRefs);
      successFeedback();
      setMessage(ev ? { tone: 'success', text: `오늘 착용으로 기록했어요 (내 옷 ${ev.garmentItemIds.length}벌). 같은 날 다시 눌러도 한 번만 기록돼요.` } : { tone: 'info', text: '샘플 아이템은 착용 기록에 포함되지 않아요.' });
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
            <Pressable onPress={saveWithMessage} disabled={!refs.length} accessibilityRole="button" accessibilityLabel="코디 저장" style={[styles.savePill, { backgroundColor: c.surfaceSunken, opacity: refs.length ? 1 : 0.4 }]}>
              <AppText variant="label">저장</AppText>
            </Pressable>
          ),
        }}
      />
      <ScreenScroll contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 }}>
        <Pressable onPress={() => dispatch({ type: 'select', id: null })} accessibilityLabel="캔버스" style={[styles.canvas, { width: side, height: canvasH, backgroundColor: c.surface }]}>
          {[...state.layout.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((e) => (
              <CanvasItem key={e.id} element={e} side={side} canvasH={canvasH} selected={e.id === state.selectedId} owned={e.itemRef.kind === 'ownedGarment' ? ownedMap.get(e.itemRef.garmentItemId) : null} dispatch={dispatch} />
            ))}
          {colorDots.length && sel && sel.itemRef.kind === 'sampleTemplate' ? (
            <View style={styles.dots} accessibilityRole="radiogroup" accessibilityLabel="색상">
              {colorDots.map((g) => {
                const on = sel.itemRef.kind === 'sampleTemplate' && sel.itemRef.customization.colorId === g.id;
                return (
                  <Pressable key={g.id} onPress={() => dispatch({ type: 'customize', id: sel.id, customization: { colorId: g.id as ColorId } })} accessibilityRole="radio" accessibilityLabel={g.nameKo} accessibilityState={{ checked: on }} hitSlop={6} style={[styles.dot, { backgroundColor: colorHex(g.id), borderColor: on ? c.textPrimary : c.border, borderWidth: on ? 2 : 1 }]} />
                );
              })}
            </View>
          ) : null}
          {!refs.length ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <AppText variant="secondary" tone="tertiary" align="center" style={{ marginTop: canvasH / 2 - 10 }}>
                아래에서 아이템을 눌러 담아 보세요
              </AppText>
            </View>
          ) : null}
        </Pressable>

        {message ? <InlineMessage tone={message.tone} message={message.text} /> : null}

        <ChipRow options={PICK_CATS} value={pickCat} onChange={setPickCat} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {pickables.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => {
                tapFeedback();
                dispatch({ type: 'add', itemRef: p.ref });
              }}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}${p.sample ? ', 샘플' : ', 내 옷'} 담기`}
              style={[styles.thumb, { backgroundColor: c.photoBackdrop }]}>
              <ItemVisual itemRef={p.ref} owned={p.ref.kind === 'ownedGarment' ? ownedMap.get(p.ref.garmentItemId) : null} size={64} variant="tile" />
              {p.sample ? null : (
                <View style={{ position: 'absolute', top: 3, left: 3 }}>
                  <SourceBadge source="owned" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.tools, { backgroundColor: c.surface }]}>
          <IconButton icon="arrow-undo-outline" label="실행 취소" disabled={!state.past.length} onPress={() => dispatch({ type: 'undo' })} />
          <IconButton icon="arrow-redo-outline" label="다시 실행" disabled={!state.future.length} onPress={() => dispatch({ type: 'redo' })} />
          <IconButton icon="add-circle-outline" label="크게" disabled={!sel} onPress={() => sel && dispatch({ type: 'scale', id: sel.id, factor: 1.1 })} />
          <IconButton icon="remove-circle-outline" label="작게" disabled={!sel} onPress={() => sel && dispatch({ type: 'scale', id: sel.id, factor: 1 / 1.1 })} />
          <IconButton icon="refresh" label="15도 회전" disabled={!sel} onPress={() => sel && dispatch({ type: 'rotate', id: sel.id, degrees: 15 })} />
          <IconButton icon="layers-outline" label="앞으로" disabled={!sel} onPress={() => sel && dispatch({ type: 'bringForward', id: sel.id })} />
          <IconButton icon="trash-outline" label="삭제" disabled={!sel} onPress={() => sel && dispatch({ type: 'remove', id: sel.id })} />
        </View>
        {sel ? (
          <View style={[styles.tools, { backgroundColor: c.surface }]}>
            <IconButton icon="arrow-up" label="위로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: 0, dy: -STEP })} />
            <IconButton icon="arrow-down" label="아래로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: 0, dy: STEP })} />
            <IconButton icon="arrow-back" label="왼쪽으로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: -STEP, dy: 0 })} />
            <IconButton icon="arrow-forward" label="오른쪽으로" onPress={() => dispatch({ type: 'move', id: sel.id, dx: STEP, dy: 0 })} />
            <IconButton icon="swap-horizontal" label="좌우 반전" onPress={() => dispatch({ type: 'flip', id: sel.id })} />
            <IconButton icon="layers" label="뒤로" onPress={() => dispatch({ type: 'sendBackward', id: sel.id })} />
            <IconButton icon="copy-outline" label="복제" onPress={() => dispatch({ type: 'duplicate', id: sel.id })} />
          </View>
        ) : null}
        <Pressable onPress={wearToday} disabled={!refs.length} accessibilityRole="button" style={[styles.wear, { borderColor: c.border, opacity: refs.length ? 1 : 0.4 }]}>
          <AppText variant="label">오늘 착용함</AppText>
        </Pressable>
      </ScreenScroll>
    </View>
  );
}

/** One draggable canvas element. Drag = live offset, committed as one `move` on release (one undo step). */
function CanvasItem({ element: e, side, canvasH, selected, owned, dispatch }: { element: CanvasElement; side: number; canvasH: number; selected: boolean; owned: GarmentItem | null | undefined; dispatch: (a: CanvasAction) => void }) {
  const c = useColors();
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const id = e.id;
  const pan = useMemo(
    () =>
      PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => dispatch({ type: 'select', id }),
      onPanResponderMove: (_, g) => setDrag({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, g) => {
        setDrag({ x: 0, y: 0 });
        if (Math.abs(g.dx) + Math.abs(g.dy) > 4) dispatch({ type: 'move', id, dx: g.dx / side, dy: g.dy / canvasH });
      },
      onPanResponderTerminate: () => setDrag({ x: 0, y: 0 }),
    }),
    [id, side, canvasH, dispatch],
  );
  const name = e.itemRef.kind === 'sampleTemplate' ? getTemplate(e.itemRef.templateId)?.nameKo : owned?.name;
  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name ?? '아이템'}${e.itemRef.kind === 'sampleTemplate' ? ', 샘플' : ', 내 옷'}`}
      accessibilityHint="끌어서 옮기거나 아래 버튼으로 조정해요"
      style={{
        position: 'absolute',
        left: e.x * side + drag.x,
        top: e.y * canvasH + drag.y,
        width: e.width * side,
        height: e.height * side,
        opacity: e.opacity,
        transform: [{ rotate: `${e.rotation}deg` }, { scaleX: e.flipX ? -1 : 1 }],
        borderWidth: selected ? 1.5 : 0,
        borderColor: c.textPrimary,
        borderStyle: 'dashed',
        borderRadius: 6,
      }}>
      <ItemVisual itemRef={e.itemRef} owned={owned} size={e.width * side} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { borderRadius: radius.tile, overflow: 'hidden', alignSelf: 'center' },
  dots: { position: 'absolute', right: spacing.sm, top: spacing.md, gap: spacing.sm, alignItems: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9 },
  thumb: { width: 64, height: 72, borderRadius: radius.photo, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: radius.tile, paddingVertical: 2 },
  savePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  wear: { alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: 999, borderWidth: 1 },
});
