// app/_layout.tsx — fonts, provider and theme for the phone app
import "../global.css";
import { useFonts, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { Uniwind } from "uniwind";
import { Stack } from "expo-router";

Uniwind.setTheme("dark"); // follow the system with Appearance if you prefer; "range" only during a live session

export default function RootLayout() {
  const [loaded] = useFonts({ Manrope: Manrope_500Medium, "Manrope-Bold": Manrope_700Bold,
    "Manrope-ExtraBold": Manrope_800ExtraBold, InstrumentSerif: InstrumentSerif_400Regular });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

// In the live session screen:
//   useEffect(() => { Uniwind.setTheme("range"); return () => Uniwind.setTheme("dark"); }, []);
