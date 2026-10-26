import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { fonts, useColors } from '@/design-system';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (outline: IconName, filled: IconName) =>
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} color={color as string} size={size} />;
  };

/** Web (dev preview only): JS bottom tabs. iOS/Android use native tabs (_layout.tsx). */
export default function TabsLayoutWeb() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontFamily: fonts.semibold },
      }}>
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티', tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="recommend" options={{ title: '코디추천', tabBarIcon: icon('sparkles-outline', 'sparkles') }} />
      <Tabs.Screen name="wardrobe" options={{ title: '옷장', tabBarIcon: icon('shirt-outline', 'shirt') }} />
      <Tabs.Screen name="me" options={{ title: '프로필', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
