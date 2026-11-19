# Setup: web (HeroUI v3 + Tailwind CSS v4)

The web app uses `@heroui/react` v3 with `@heroui/styles` on Tailwind CSS v4. HeroUI v3 has no provider and no JS theme object: every token is a CSS variable, so gtrack's whole theme is one CSS file loaded in the `theme` layer after HeroUI's defaults.

## 1. Install

```bash
npm i @heroui/react @heroui/styles tailwindcss @tailwindcss/vite
npm i @gravity-ui/icons
```

## 2. app.css

```css
@import "tailwindcss";
@import "@heroui/styles";
@import "./gtrack-theme.css";
```

Import it without `layer(theme)`: inside that layer its `@layer components` shape overrides become `theme.components`, which loses to HeroUI's own `components` layer, so buttons stay pills. Load Manrope and Instrument Serif with a `<link>` in the page head; Tailwind drops the `@import url(...)` at the top of the file.

## 3. Pick the theme on `<html>`

The golfer chooses System (default), Dark or Light in the avatar menu; the browser remembers it. Resolve System with `prefers-color-scheme` and follow its changes.

```html
<html data-theme="dark" class="dark">   <!-- Dark, or System on a dark device -->
<html data-theme="light">                <!-- Light, or System on a light device -->
```

`range` is phone-only, but it exists on the web too, so the read-only "Session in progress" page can show the live screen exactly.

## 4. Use HeroUI variants, not raw colours

| Need | HeroUI | Renders |
| --- | --- | --- |
| The one main action | `<Button variant="primary">` | `accent` orange, `accent-foreground` text |
| Secondary action | `<Button variant="secondary">` | `default` grey |
| Quiet action, ··· menus | `<Button variant="ghost">` / `variant="tertiary"` | outline `border` |
| Delete, Abandon | `<Button variant="danger">` | `danger` |
| Top nav | `<Tabs>` with the selected tab on `segment` | white pill, dark text |
| Selection that is not an action | utilities `bg-highlight text-highlight-foreground` | lime |
| SG number | `<span className={sgTone(n)}>{formatSG(n)}</span>` | mint / coral / muted |
| Category badge | `<Chip className="bg-cat-app text-cat-foreground">APP</Chip>` | 6px corners |

Recharts colours read the same variables: `stroke="var(--cat-app)"`, `fill="var(--chart-bar)"`, so charts follow the theme.

## gtrack-theme.css (generated from tokens.json)

```css
/* gtrack theme for HeroUI v3 (@heroui/react + @heroui/styles) on Tailwind CSS v4.
   Generated from tokens.json — edit tokens.json, not this file.
   Load order in app.css:
     @import "tailwindcss";
     @import "@heroui/styles";
     @import "./gtrack-theme.css" layer(theme);
   Switch theme on <html>: data-theme="dark" (default) | "light" | "range" (+ class="dark" for dark/range). */

@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif&display=swap");

@layer base {
  :root,
  .dark,
  [data-theme="dark"] {
    color-scheme: dark;
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
    --overlay-shadow: 0 16px 48px rgba(0,0,0,0.55);
    --surface-shadow: 0 0 0 0 transparent;
    --field-shadow: 0 0 0 0 transparent;
    --backdrop: rgba(0, 0, 0, 0.6);
    /* shape */
    --radius: 0.5rem;                           /* 8px  */
    --field-radius: calc(var(--radius) * 1.5);  /* 12px: buttons, inputs, nav */
    --border-width: 1px;
    --field-border-width: 1px;
    --disabled-opacity: 0.4;
  }

  .light,
  [data-theme="light"] {
    color-scheme: light;
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
    --overlay-shadow: 0 12px 32px rgba(22,22,22,0.14);
    --surface-shadow: 0 0 0 0 transparent;
    --field-shadow: 0 0 0 0 transparent;
    --backdrop: rgba(22, 22, 22, 0.4);
  }

  [data-theme="range"] {
    color-scheme: dark;
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
    --overlay-shadow: 0 0 0 1px #3A3A3A;
    --surface-shadow: 0 0 0 0 transparent;
    --field-shadow: 0 0 0 0 transparent;
    --backdrop: rgba(0, 0, 0, 0.6);
  }

  html { font-family: var(--font-sans); font-feature-settings: "tnum" 1; }
}

/* Expose gtrack-only tokens as Tailwind utilities: bg-highlight, text-sg-negative, bg-cat-app … */
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
  --font-sans: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: "Instrument Serif", Georgia, serif;
  --radius-badge: 6px;
  --radius-control: var(--field-radius);
  --radius-inner: 18px;
  --radius-card: 24px;
}

/* Shape overrides on HeroUI components.
   HeroUI v3 styles each component with BEM classes in @heroui/styles (e.g. .button, .card, .chip).
   Check the class names against node_modules/@heroui/styles/dist/components before relying on them;
   where a class differs, pass the same utilities through the component's className. */
@layer components {
  .button, .toggle-button, .input, .text-area, .select__trigger, .combo-box__input, .search-field__group,
  .number-field__group, .date-field__group, .input-otp__slot { border-radius: var(--field-radius); }
  .card, .modal__dialog, .alert-dialog__dialog, .drawer__dialog, .sheet__dialog { border-radius: 24px; }
  .card { border-width: 0; box-shadow: none; }
  .chip { border-radius: 6px; font-weight: 700; }
  .tabs__tab[data-selected], .toggle-button[data-selected] { color: var(--segment-foreground); }
}
```
