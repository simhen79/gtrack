import '../../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

function Screens() {
  const { me } = useSession();

  useEffect(() => {
    if (me !== undefined) SplashScreen.hideAsync();
  }, [me]);

  if (me === undefined) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={me !== null}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={me === null}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <SessionProvider>
          <Screens />
        </SessionProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
