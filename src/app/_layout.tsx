import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ShareIntentProvider } from 'expo-share-intent';
import { useEffect } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkColors, fonts, lightColors } from '@/design-system';
import { ShareIntentRouter } from '@/features/share-import/ShareIntentRouter';
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
    // OAuth deep links (and the splash's 로그인 button) must land even before onboarding is done.
    // A garment shared from another app (공유 → WearLog) opens 옷 등록 directly, onboarding or not.
    const inAuth = segments[0] === 'auth' || segments[0] === 'community' || segments[0] === 'wardrobe';
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
    // Share intents must be read before any other provider (expo-share-intent requirement).
    <ShareIntentProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: c.background, card: c.surface, text: c.textPrimary, primary: c.accent, border: c.border } }}>
            <AppStateProvider>
              <OnboardingGate />
              <ShareIntentRouter />
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <Stack
                screenOptions={({ navigation }) => ({
                  headerBackButtonDisplayMode: 'minimal',
                  headerStyle: { backgroundColor: c.background },
                  headerTintColor: c.textPrimary,
                  headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                  headerTitleAlign: 'left',
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: c.background },
                  // Showcase: "‹ 옷 등록" — thin chevron + left-aligned title.
                  headerLeft: ({ canGoBack }) =>
                    canGoBack ? (
                      <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로" style={{ paddingRight: 8 }}>
                        <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
                      </Pressable>
                    ) : undefined,
                })}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '홈' }} />
                <Stack.Screen name="onboarding/index" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="onboarding/taste" options={{ title: '취향 설정' }} />
                <Stack.Screen name="weather" options={{ title: '날씨 상세' }} />
                <Stack.Screen name="sample-wardrobe" options={{ title: '샘플 옷장' }} />
                <Stack.Screen name="wardrobe/add" options={{ title: '옷 등록' }} />
                <Stack.Screen name="wardrobe/[itemId]" options={{ title: '옷 상세' }} />
                <Stack.Screen name="builder/[outfitId]" options={{ title: '코디 빌더' }} />
                <Stack.Screen name="wear-log" options={{ title: '착용 기록' }} />
                <Stack.Screen name="community/account" options={{ title: '' }} />
                <Stack.Screen name="community/publish" options={{ title: '베스트 착장에 공유', presentation: 'modal' }} />
                <Stack.Screen name="community/post/[postId]" options={{ title: '' }} />
                <Stack.Screen name="auth/callback" options={{ title: '로그인 중', headerBackVisible: false }} />
                <Stack.Screen name="settings" options={{ title: '설정' }} />
              </Stack>
            </AppStateProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}
