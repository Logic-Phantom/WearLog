import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon, fonts, tabBarHeight, useColors, type TabIconName } from '@/design-system';

const icon = (name: TabIconName, cutout: string) =>
  function Icon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <TabIcon name={name} color={String(color)} focused={focused} cutout={cutout} />;
  };

/**
 * Tab order follows the showcase: 홈 · 커뮤니티 · 코디추천 · 옷장 · 프로필 (D-005).
 * JS tabs with self-drawn line icons on every platform so Android/iOS match the showcase bar (D-014).
 */
export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.textPrimary,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: tabBarHeight + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: c.background },
      }}>
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('home', c.surface) }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티', tabBarIcon: icon('community', c.surface) }} />
      <Tabs.Screen name="recommend" options={{ title: '코디추천', tabBarIcon: icon('recommend', c.surface) }} />
      <Tabs.Screen name="wardrobe" options={{ title: '옷장', tabBarIcon: icon('wardrobe', c.surface) }} />
      <Tabs.Screen name="me" options={{ title: '프로필', tabBarIcon: icon('profile', c.surface) }} />
    </Tabs>
  );
}
