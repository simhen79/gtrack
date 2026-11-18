# Setup: phone (HeroUI Native + Uniwind)

The phone app uses `heroui-native` styled with Uniwind (Tailwind v4 for React Native). It reads the same variable names as the web, so the values below are the same tokens. Themes are Uniwind variants: gtrack overrides `dark` and `light` and adds `range`, which must be registered in Metro.

## 1. Install

```bash
npx expo install heroui-native uniwind tailwindcss react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg
npx expo install @expo-google-fonts/manrope @expo-google-fonts/instrument-serif expo-font
```

## 2. metro.config.js

```js
// metro.config.js — HeroUI Native + Uniwind, with gtrack's extra "range" theme
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind.d.ts",
  extraThemes: ["range"],
});
```

## 3. App root

```tsx
// app/_layout.tsx — fonts, provider and theme for the phone app
import "../global.css";
import { useFonts, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { Uniwind } from "uniwind";
import { Stack } from "expo-router";

Uniwind.setTheme("system"); // then the golfer's saved choice: "system" (default), "dark" or "light"; "range" only during a live session

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
```

## 4. Live session = Range

Enter the Range theme when a Practice Session starts and leave it when the session ends. Do not tie it to the system dark mode. Use `Uniwind.setTheme("range")` in the live screen's effect, as above.

## 5. Shared helpers

```ts
// sg.ts — shared by web and phone (put it in a shared package or copy it)
export const SG_CATEGORIES = [
  { key: "ott", code: "OTT", name: "Off the Tee", color: "cat-ott" },
  { key: "app", code: "APP", name: "Approach", color: "cat-app" },
  { key: "shg", code: "SHG", name: "Short Game", color: "cat-shg" },
  { key: "put", code: "PUT", name: "Putting", color: "cat-put" },
] as const;

export const formatSG = (n: number) =>
  Math.abs(n) < 0.005 ? "0.00" : (n > 0 ? "+" : "\u2212") + Math.abs(n).toFixed(2);

export const sgTone = (n: number) =>
  Math.abs(n) < 0.005 ? "text-sg-zero" : n > 0 ? "text-sg-positive" : "text-sg-negative";

export const parseSG = (s: string) => {
  const n = parseFloat(s.replace("\u2212", "-").replace("+", ""));
  return Number.isFinite(n) ? n : null;
};
```

## global.css (generated from tokens.json)

```css
/* gtrack theme for HeroUI Native (heroui-native) via Uniwind (Tailwind v4 for React Native).
   Generated from tokens.json — edit tokens.json, not this file.
   global.css — imported once in App/_layout. Register "range" in metro.config.js extraThemes. */
@import "tailwindcss";
@import "uniwind";
@import "heroui-native/styles";
@source "./node_modules/heroui-native/lib";

@layer theme {
  :root {
    @variant dark {
      --background: #161616;
      --foreground: #FFFFFF;
      --surface: #262626;
      --surface-foreground: #FFFFFF;
      --surface-secondary: #2E2E2E;
      --surface-secondary-foreground: #FFFFFF;
      --surface-tertiary: #333333;
      --surface-tertiary-foreground: #FFFFFF;
      --overlay: #2A2A2A;
      --overlay-foreground: #FFFFFF;
      --muted: #A3A3A3;
      --border: #3D3D3D;
      --separator: #333333;
      --default: #333333;
      --default-foreground: #FFFFFF;
      --accent: #EE7B47;
      --accent-foreground: #161616;
      --accent-soft: #3A271E;
      --accent-soft-foreground: #FFB08A;
      --highlight: #B4CB45;
      --highlight-foreground: #161616;
      --segment: #FFFFFF;
      --segment-foreground: #161616;
      --focus: #B4CB45;
      --link: #FFFFFF;
      --success: #5ED3A0;
      --success-foreground: #161616;
      --warning: #F4B13E;
      --warning-foreground: #161616;
      --danger: #FF7A66;
      --danger-foreground: #161616;
      --field-background: #2E2E2E;
      --field-foreground: #FFFFFF;
      --field-placeholder: #9A9A9A;
      --field-border: #4A4A4A;
      --scrollbar: #4A4A4A;
      --sg-positive: #5ED3A0;
      --sg-negative: #FF7A66;
      --sg-zero: #A3A3A3;
      --cat-ott: #F4B13E;
      --cat-app: #EE7B47;
      --cat-shg: #B4CB45;
      --cat-put: #3EC1B0;
      --cat-foreground: #161616;
      --chart-bar: #4A4A4A;
      --backdrop: rgba(0, 0, 0, 0.6);
      --overlay-shadow: 0 16px 48px rgba(0,0,0,0.55);
      --surface-shadow: 0 0 0 0 transparent;
      --field-shadow: 0 0 0 0 transparent;
      --radius: 8px;
      --field-radius: 12px;
      --field-border-width: 1px;
    }
    @variant light {
      --background: #E4E8D8;
      --foreground: #161616;
      --surface: #F4F4EE;
      --surface-foreground: #161616;
      --surface-secondary: #FFFFFF;
      --surface-secondary-foreground: #161616;
      --surface-tertiary: #ECEDE4;
      --surface-tertiary-foreground: #161616;
      --overlay: #FFFFFF;
      --overlay-foreground: #161616;
      --muted: #5A5A55;
      --border: #D3D6C8;
      --separator: #DDE0D3;
      --default: #E6E8DE;
      --default-foreground: #161616;
      --accent: #B84C1A;
      --accent-foreground: #FFFFFF;
      --accent-soft: #F6DCCD;
      --accent-soft-foreground: #8A3510;
      --highlight: #C9DC6B;
      --highlight-foreground: #161616;
      --segment: #161616;
      --segment-foreground: #FFFFFF;
      --focus: #5F6F12;
      --link: #161616;
      --success: #167049;
      --success-foreground: #FFFFFF;
      --warning: #8F5E08;
      --warning-foreground: #FFFFFF;
      --danger: #C2412D;
      --danger-foreground: #FFFFFF;
      --field-background: #FFFFFF;
      --field-foreground: #161616;
      --field-placeholder: #6B6B66;
      --field-border: #C9CCBD;
      --scrollbar: #C9CCBD;
      --sg-positive: #167049;
      --sg-negative: #C2412D;
      --sg-zero: #5A5A55;
      --cat-ott: #8F5E08;
      --cat-app: #B84C1A;
      --cat-shg: #5F6F12;
      --cat-put: #16806F;
      --cat-foreground: #FFFFFF;
      --chart-bar: #C9CCBD;
      --backdrop: rgba(22, 22, 22, 0.4);
      --overlay-shadow: 0 12px 32px rgba(22,22,22,0.14);
      --surface-shadow: 0 0 0 0 transparent;
      --field-shadow: 0 0 0 0 transparent;
      --radius: 8px;
      --field-radius: 12px;
      --field-border-width: 1px;
    }
    @variant range {
      --background: #000000;
      --foreground: #FFFFFF;
      --surface: #141414;
      --surface-foreground: #FFFFFF;
      --surface-secondary: #1E1E1E;
      --surface-secondary-foreground: #FFFFFF;
      --surface-tertiary: #262626;
      --surface-tertiary-foreground: #FFFFFF;
      --overlay: #141414;
      --overlay-foreground: #FFFFFF;
      --muted: #C7C7C7;
      --border: #3A3A3A;
      --separator: #262626;
      --default: #1E1E1E;
      --default-foreground: #FFFFFF;
      --accent: #C8E04B;
      --accent-foreground: #000000;
      --accent-soft: #262C0E;
      --accent-soft-foreground: #E2F08F;
      --highlight: #EE7B47;
      --highlight-foreground: #000000;
      --segment: #FFFFFF;
      --segment-foreground: #000000;
      --focus: #C8E04B;
      --link: #FFFFFF;
      --success: #5ED3A0;
      --success-foreground: #000000;
      --warning: #FFB27A;
      --warning-foreground: #000000;
      --danger: #FF8A75;
      --danger-foreground: #000000;
      --field-background: #1E1E1E;
      --field-foreground: #FFFFFF;
      --field-placeholder: #B0B0B0;
      --field-border: #3A3A3A;
      --scrollbar: #3A3A3A;
      --sg-positive: #5ED3A0;
      --sg-negative: #FF8A75;
      --sg-zero: #C7C7C7;
      --cat-ott: #F4B13E;
      --cat-app: #EE7B47;
      --cat-shg: #B4CB45;
      --cat-put: #3EC1B0;
      --cat-foreground: #000000;
      --chart-bar: #3A3A3A;
      --backdrop: rgba(0, 0, 0, 0.6);
      --overlay-shadow: 0 0 0 1px #3A3A3A;
      --surface-shadow: 0 0 0 0 transparent;
      --field-shadow: 0 0 0 0 transparent;
      --radius: 8px;
      --field-radius: 12px;
      --field-border-width: 1px;
    }
  }
}

@theme inline {
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-segment-foreground: var(--segment-foreground);
  --color-sg-positive: var(--sg-positive);
  --color-sg-negative: var(--sg-negative);
  --color-sg-zero: var(--sg-zero);
  --color-cat-ott: var(--cat-ott);
  --color-cat-app: var(--cat-app);
  --color-cat-shg: var(--cat-shg);
  --color-cat-put: var(--cat-put);
  --color-cat-foreground: var(--cat-foreground);
  --color-chart-bar: var(--chart-bar);
  --font-sans: "Manrope";
  --font-serif: "InstrumentSerif";
  --radius-badge: 6px;
  --radius-control: 12px;
  --radius-inner: 18px;
  --radius-card: 24px;
}
```
