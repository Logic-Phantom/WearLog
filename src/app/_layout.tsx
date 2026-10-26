import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkColors, fonts, lightColors } from '@/design-system';
import { needsOnboarding } from '@/features/taste-onboarding/taste-profile';
import { AppStateProvider, useAppState } from '@/hooks/app-state';

SplashScreen.preventAutoHideAsync().catch(() => {});

const FONT_FILES = {
  [fonts.regular]: require('@/assets/fonts/Pretendard-Regular.otf'),
  [fonts.medium]: require('@/assets/fonts/Pretendard-Medium.otf'),
  [fonts.semibold]: require('@/assets/fonts/Pretendard-SemiBold.otf'),
  [fonts.bold]: require('@/assets/fonts/Pretendard-Bold.otf'),
};

/** First run → splash/onboarding. Skippable; never requires an account (prompt §3.1). */
function OnboardingGate() {
  const { ready, taste } = useAppState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    const inOnboarding = segments[0] === 'onboarding';
    // OAuth deep links must land even before onboarding is done.
    const inAuth = segments[0] === 'auth';
    if (needsOnboarding(taste) && !inOnboarding && !inAuth) router.replace('/onboarding');
  }, [ready, taste, segments, router]);

  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  // A font that fails to load falls back to the system font; never block the app on it.
  if (!fontsLoaded && !fontError) return null;

  const c = scheme === 'dark' ? darkColors : lightColors;
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: c.background, card: c.surface, text: c.textPrimary, primary: c.accent, border: c.border } }}>
          <AppStateProvider>
            <OnboardingGate />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerBackButtonDisplayMode: 'minimal',
                headerStyle: { backgroundColor: c.background },
                headerTintColor: c.textPrimary,
                headerTitleStyle: { fontFamily: fonts.bold },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: c.background },
              }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '홈' }} />
              <Stack.Screen name="onboarding/index" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="onboarding/taste" options={{ title: '취향 설정' }} />
              <Stack.Screen name="weather" options={{ title: '날씨' }} />
              <Stack.Screen name="sample-wardrobe" options={{ title: '샘플 옷장' }} />
              <Stack.Screen name="wardrobe/add" options={{ title: '옷 등록', presentation: 'modal' }} />
              <Stack.Screen name="wardrobe/[itemId]" options={{ title: '옷 상세' }} />
              <Stack.Screen name="builder/[outfitId]" options={{ title: '코디 빌더' }} />
              <Stack.Screen name="wear-log" options={{ title: '착용 기록' }} />
              <Stack.Screen name="community/account" options={{ title: '로그인' }} />
              <Stack.Screen name="community/publish" options={{ title: '베스트 착장에 공유', presentation: 'modal' }} />
              <Stack.Screen name="auth/callback" options={{ title: '로그인 중', headerBackVisible: false }} />
              <Stack.Screen name="settings" options={{ title: '설정' }} />
            </Stack>
          </AppStateProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
