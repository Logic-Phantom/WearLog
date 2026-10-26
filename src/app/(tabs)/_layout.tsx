import { NativeTabs } from 'expo-router/native-tabs';

import { fonts, useColors } from '@/design-system';

/** Tab order follows the showcase: 홈 · 커뮤니티 · 코디추천 · 옷장 · 프로필 (D-005). */
export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs backgroundColor={c.surface} tintColor={c.accent} labelVisibilityMode="labeled" labelStyle={{ default: { fontFamily: fonts.medium }, selected: { color: c.accent, fontFamily: fonts.semibold } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Label>커뮤니티</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recommend">
        <NativeTabs.Trigger.Label>코디추천</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} md="auto_awesome" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wardrobe">
        <NativeTabs.Trigger.Label>옷장</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'cabinet', selected: 'cabinet.fill' }} md="checkroom" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Label>프로필</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
