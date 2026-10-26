import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, BottomBar, GhostButton, PrimaryButton, ScreenScroll, contentMaxWidth, radius, spacing, tapFeedback, useColors } from '@/design-system';
import { GarmentVector } from '@/features/sample-wardrobe/components/GarmentVector';
import { getTemplate } from '@/features/sample-wardrobe/catalog';
import { STYLE_CARDS, TASTE_QUESTIONS } from '@/features/taste-onboarding/style-cards';
import { profileFromCards } from '@/features/taste-onboarding/taste-profile';
import { useAppState } from '@/hooks/app-state';

/**
 * Visual taste onboarding (prompt §3.1): one question per step, 2-column cards, multi-select,
 * skip/back, resumable. Only the picked cards shape the profile.
 */
export default function TasteOnboarding() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();
  const { taste, updateTaste } = useAppState();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>(taste.selectedStyleCardIds);
  const q = TASTE_QUESTIONS[step];
  const cards = STYLE_CARDS.filter((s) => s.questionId === q.id);
  const cardW = Math.floor((Math.min(width, contentMaxWidth) - spacing.md * 2 - spacing.xs) / 2);
  const last = step === TASTE_QUESTIONS.length - 1;

  const finish = async () => {
    await updateTaste({ ...profileFromCards(picked, taste), onboardingState: 'completed' });
    router.replace('/');
  };

  const toggle = (id: string) => {
    tapFeedback();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar="summary">
        <AppText variant="caption" tone="tertiary">
          {step + 1} / {TASTE_QUESTIONS.length}
        </AppText>
        <View style={{ gap: spacing.xxs }}>
          <AppText variant="title">{q.title}</AppText>
          <AppText variant="secondary" tone="secondary">{q.hint}</AppText>
        </View>
        <View style={styles.grid}>
          {cards.map((card) => {
            const sel = picked.includes(card.id);
            return (
              <Pressable
                key={card.id}
                onPress={() => toggle(card.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={card.label}
                style={[styles.card, { width: cardW, backgroundColor: c.photoBackdrop, borderColor: sel ? c.textPrimary : 'transparent' }]}>
                <View style={styles.preview}>
                  {card.preview.map((p, i) => {
                    const t = getTemplate(p.templateId);
                    return t ? <GarmentVector key={i} shapeId={t.shapeId} colorId={p.customization.colorId} fit={p.customization.fit} size={cardW * 0.46} /> : null;
                  })}
                </View>
                <View style={styles.cardFoot}>
                  <AppText variant="label">{card.label}</AppText>
                  <Ionicons name={sel ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={sel ? c.textPrimary : c.textTertiary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScreenScroll>
      <BottomBar summary={<AppText variant="caption" tone="secondary">{picked.filter((id) => cards.some((x) => x.id === id)).length}개 선택 · 나중에 프로필에서 바꿀 수 있어요</AppText>}>
        <GhostButton compact label={step === 0 ? '건너뛰기' : '이전'} onPress={() => (step === 0 ? updateTaste({ onboardingState: 'skipped' }).then(() => router.replace('/')) : setStep(step - 1))} />
        <PrimaryButton label={last ? '완료' : '다음'} onPress={() => (last ? finish() : setStep(step + 1))} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  card: { borderRadius: radius.tile, borderWidth: 2, overflow: 'hidden' },
  preview: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingTop: spacing.sm, aspectRatio: 1 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm },
});
