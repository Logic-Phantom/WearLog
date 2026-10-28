import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomBar, Checkbox, InlineMessage, MultiChips, PrimaryButton, ScreenScroll, SecondaryButton, TextField, radius, spacing, useColors } from '@/design-system';
import { STYLE_TAGS, type StyleTag } from '@/domain/categories';
import { toUserMessage } from '@/domain/errors';
import { COMMUNITY_LIMITS, publicWeatherSummary } from '@/features/community/moderation-policy';
import { consentComplete, prepareShareDerivative, publishOutfit, type PublishConsent } from '@/features/community/post-service';
import { pickGarmentPhoto, type PickedPhoto } from '@/features/wardrobe/garment-import';
import { resolveWeatherSignal } from '@/features/weather/weather-signal';
import { useAppState } from '@/hooks/app-state';

type Derivative = Awaited<ReturnType<typeof prepareShareDerivative>>;

/**
 * 게시 전 확인 (prompt §3.10): the user picks the image, sees the exact upload copy (EXIF/GPS removed,
 * resized), chooses tags and whether to add a coarse weather line, and ticks every consent box.
 */
export default function PublishScreen() {
  const router = useRouter();
  const c = useColors();
  const { weatherContext } = useAppState();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [derivative, setDerivative] = useState<Derivative | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<StyleTag[]>([]);
  const [withWeather, setWithWeather] = useState(false);
  const [consent, setConsent] = useState<PublishConsent>({ imageIsPublic: false, handleAndTagsArePublic: false, visibleUntilDeleted: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snap = weatherContext.kind === 'snapshot' ? weatherContext.snapshot : null;
  const weatherLine = snap ? publicWeatherSummary(snap.temperatureC, resolveWeatherSignal(weatherContext).rainLikely) : null;

  const choose = async () => {
    setError(null);
    try {
      const p = await pickGarmentPhoto('library');
      if (!p) return;
      setPhoto(p);
      setBusy(true);
      setDerivative(await prepareShareDerivative(p.uri, { width: p.width, height: p.height }));
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!derivative) return;
    setBusy(true);
    setError(null);
    try {
      await publishOutfit(derivative, { title: title || null, styleTags: tags, occasion: null, weatherSummary: withWeather ? weatherLine : null }, consent);
      router.back();
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenScroll withBottomBar>
        <View style={[styles.preview, { backgroundColor: c.photoBackdrop }]}>
          {derivative ? <Image source={{ uri: derivative.previewUri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel="업로드될 사본 미리보기" /> : <AppText variant="secondary" tone="tertiary">공유할 착장 사진을 골라 주세요</AppText>}
        </View>
        <SecondaryButton label={photo ? '다른 사진 고르기' : '사진 고르기'} icon="images-outline" onPress={choose} loading={busy && !derivative} />
        {derivative ? <InlineMessage tone="success" message={`업로드되는 사본은 위치·기기 정보(EXIF)가 제거되고 긴 변 ${COMMUNITY_LIMITS.imageMaxSide}px 이하로 줄어요. 원본은 그대로예요.`} /> : null}
        <TextField label="제목 (선택)" value={title} onChangeText={setTitle} maxLength={COMMUNITY_LIMITS.maxTitleLength} />
        <AppText variant="label">스타일 태그 (최대 3개)</AppText>
        <MultiChips options={STYLE_TAGS} values={tags} onChange={setTags} max={COMMUNITY_LIMITS.maxStyleTags} />
        {weatherLine ? <Checkbox checked={withWeather} label={`날씨 요약 함께 공개: "${weatherLine}" (지역은 공개하지 않아요)`} onPress={() => setWithWeather(!withWeather)} /> : null}
        <View style={{ gap: spacing.xxs }}>
          <AppText variant="label">공개 전 확인</AppText>
          <Checkbox checked={consent.imageIsPublic} label="이 사진이 누구에게나 공개돼요" onPress={() => setConsent({ ...consent, imageIsPublic: !consent.imageIsPublic })} />
          <Checkbox checked={consent.handleAndTagsArePublic} label="내 핸들과 선택한 태그가 함께 공개돼요" onPress={() => setConsent({ ...consent, handleAndTagsArePublic: !consent.handleAndTagsArePublic })} />
          <Checkbox checked={consent.visibleUntilDeleted} label="직접 삭제하기 전까지 공개될 수 있고, 운영 검토 후 노출돼요" onPress={() => setConsent({ ...consent, visibleUntilDeleted: !consent.visibleUntilDeleted })} />
          <SecondaryButton compact label="커뮤니티 가이드라인 보기" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'guidelines' } })} />
        </View>
        {error ? <InlineMessage tone="error" message={error} /> : null}
      </ScreenScroll>
      <BottomBar>
        <PrimaryButton label="공유하기" disabled={!derivative || !consentComplete(consent)} loading={busy && !!derivative} onPress={publish} style={{ flex: 1 }} />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { aspectRatio: 4 / 5, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
