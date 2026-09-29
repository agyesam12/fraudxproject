import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { useFraudX } from '@/state/FraudXContext';
import { colors, type IconName } from '@/theme';

const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : name} color={color} size={size} />
  );

export default function TabsLayout() {
  const { stats } = useFraudX();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
        // Web has no safe-area inset to pad the bar, so give labels room explicitly.
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, ...Platform.select({ web: { height: 60, paddingBottom: 6 } }) },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Protection', tabBarIcon: icon('shield-outline', 'shield-checkmark') }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Messages',
          tabBarIcon: icon('chatbubbles-outline', 'chatbubbles'),
          tabBarBadge: stats.unresolved > 0 ? stats.unresolved : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11 },
        }}
      />
      <Tabs.Screen name="scan" options={{ title: 'Check SMS', tabBarIcon: icon('scan-outline', 'scan') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
