import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText, DangerButton, GhostButton, InlineMessage, PrimaryButton, Row, ScreenScroll, SecondaryButton, SocialSignInButton, TextField, Wordmark, spacing } from '@/design-system';
import { toUserMessage } from '@/domain/errors';
import type { SocialProviderId } from '@/features/auth/social-auth';
import { validateHandle } from '@/features/community/moderation-policy';
import { communityRepository } from '@/features/community/supabase-community-repository';
import { useAsync } from '@/hooks/use-async';
import { useCommunitySession } from '@/hooks/use-community-session';

/**
 * 로그인 (showcase: 카카오 · Google · 이메일). Shown only when entering community features — never at
 * first launch. Providers not enabled in Supabase are disabled with a reason, not hidden silently.
 */
export default function AccountScreen() {
  const router = useRouter();
  const { configured, session } = useCommunitySession();
  const providers = useAsync(() => (configured ? communityRepository.listSocialProviders() : Promise.resolve([])), [configured]);
  const profile = useAsync(() => (session ? communityRepository.getMyProfile() : Promise.resolve(null)), [session?.userId]);
  const [busy, setBusy] = useState<SocialProviderId | 'email' | 'handle' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [handle, setHandle] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);

  const run = async (kind: typeof busy, fn: () => Promise<unknown>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (session) {
    if (!profile.loading && !profile.data) {
      const invalid = handle ? validateHandle(handle) : null;
      return (
        <ScreenScroll>
          <AppText variant="title">공개 핸들 만들기</AppText>
          <AppText variant="secondary" tone="secondary">커뮤니티에는 핸들만 보여요. 이메일·실명은 공개되지 않아요.</AppText>
          <TextField label="핸들" value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} placeholder="style.daily" error={invalid} />
          {error ? <InlineMessage tone="error" message={error} /> : null}
          <PrimaryButton label="완료" disabled={!handle || !!invalid} loading={busy === 'handle'} onPress={() => run('handle', () => communityRepository.upsertMyProfile(handle, null).then(() => router.replace('/community')))} />
        </ScreenScroll>
      );
    }
    return (
      <ScreenScroll>
        <AppText variant="title">@{profile.data?.handle ?? ''}</AppText>
        <SecondaryButton label="로그아웃" onPress={() => run(null, () => communityRepository.signOut())} />
        <DangerButton
          label="커뮤니티 계정 삭제"
          onPress={() =>
            Alert.alert('계정을 삭제할까요?', '내 게시물·하트·프로필과 업로드한 이미지가 삭제돼요. 기기 안의 옷장·기록은 그대로예요.', [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => run(null, () => communityRepository.deleteAccount()) },
            ])
          }
        />
        {error ? <InlineMessage tone="error" message={error} /> : null}
      </ScreenScroll>
    );
  }

  const enabled = providers.data ?? [];
  return (
    <ScreenScroll contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingTop: spacing.xxl * 2, paddingBottom: spacing.xxl }}>
      <View style={{ paddingBottom: spacing.xxl, gap: spacing.xs }}>
        <Wordmark />
        <AppText variant="secondary" tone="secondary" align="center">
          {'로그인하고 더 많은 기능을\n이용해보세요'}
        </AppText>
      </View>
      {(['kakao', 'google'] as const).map((p) => (
        <SocialSignInButton key={p} provider={p} disabled={!configured || !enabled.includes(p)} loading={busy === p} onPress={() => run(p, () => communityRepository.signInWithProvider(p))} />
      ))}
      <SecondaryButton label="이메일로 시작하기" onPress={() => setEmailOpen((v) => !v)} disabled={!configured} />
      {!configured ? (
        <AppText variant="caption" tone="tertiary" align="center">
          커뮤니티 서버가 아직 연결되지 않아 로그인할 수 없어요. 옷장·코디·기록은 로그인 없이 그대로 쓸 수 있어요.
        </AppText>
      ) : !providers.loading && enabled.length < 2 ? (
        <AppText variant="caption" tone="tertiary" align="center">비활성화된 버튼은 서버에서 아직 설정되지 않은 로그인 방식이에요.</AppText>
      ) : null}

      {emailOpen && configured ? (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <TextField label="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          {codeSent ? <TextField label="인증 코드" value={code} onChangeText={setCode} keyboardType="number-pad" /> : null}
          <PrimaryButton
            label={codeSent ? '코드 확인' : '인증 코드 받기'}
            loading={busy === 'email'}
            disabled={!email.includes('@') || (codeSent && code.length < 6)}
            onPress={() => run('email', () => (codeSent ? communityRepository.verifyEmailCode(email, code) : communityRepository.sendEmailCode(email).then(() => setCodeSent(true))))}
          />
        </View>
      ) : null}
      {error ? <InlineMessage tone="error" message={error} /> : null}
      <Row style={{ justifyContent: 'center', marginTop: spacing.lg }} gap={6}>
        <AppText variant="caption" tone="tertiary">계정이 없으신가요?</AppText>
        <Pressable onPress={() => setEmailOpen(true)} disabled={!configured} hitSlop={8} accessibilityRole="button">
          <AppText variant="caption" style={{ textDecorationLine: 'underline' }}>회원가입</AppText>
        </Pressable>
      </Row>
      <GhostButton label="로그인 없이 계속 쓰기" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </ScreenScroll>
  );
}
