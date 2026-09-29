import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ThreatAlert } from '@/components/ThreatAlert';
import { FraudXProvider, useFraudX } from '@/state/FraudXContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { hydrated } = useFraudX();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="message/[id]" options={{ title: 'Risk report', headerBackTitle: 'Back' }} />
      </Stack>
      <ThreatAlert />
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <FraudXProvider>
      <RootNavigator />
    </FraudXProvider>
  );
}
