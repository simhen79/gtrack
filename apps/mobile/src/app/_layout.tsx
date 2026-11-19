import '../../global.css';

import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSession } from '@/lib/session';
import { fonts, loadThemeChoice } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Screens() {
  const { me } = useSession();
  const [fontsLoaded] = useFonts({
    [fonts.body]: Manrope_500Medium,
    [fonts.bold]: Manrope_700Bold,
    [fonts.extraBold]: Manrope_800ExtraBold,
    [fonts.serif]: InstrumentSerif_400Regular,
  });
  const [themeLoaded, setThemeLoaded] = useState(false);
  const ready = me !== undefined && fontsLoaded && themeLoaded;

  useEffect(() => {
    loadThemeChoice().finally(() => setThemeLoaded(true));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={me !== null}>
        <Stack.Screen name="(tabs)" />
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
