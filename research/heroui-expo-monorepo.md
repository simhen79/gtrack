# HeroUI on Expo and Next.js in the pnpm monorepo

Researched 2026-11-09. No app was built or run. A throwaway pnpm 11.28.2 workspace was installed with `--ignore-scripts` to read resolved peers and package source, and nothing was bundled. `[S#]` markers refer to the source table at the end. Claims marked **Inference** are my reasoning from the sources, not something a source states.

## Recommended setup

**Verdict: fits with caveats.** `heroui-native` officially supports the chosen Expo and React Native versions, and `@heroui/react` is very likely fine on Next.js 16.4. Neither forces `nodeLinker: hoisted` or public-hoist patterns in the code I read. The caveats are below.

| Area | Recommendation |
| --- | --- |
| Mobile UI | `heroui-native` 1.0.11 with Uniwind 1.13.2. Officially supports Expo SDK 58 and React Native 0.88 [S1]. |
| Web UI | `@heroui/react` and `@heroui/styles` 3.2.7. No Next.js peer range exists. HeroUI's own docs site runs Next.js 16.4.2 [S6]. |
| pnpm | Keep the default isolated linker. Keep `autoInstallPeers` and default hoisting on. |
| Metro | Add `withUniwindConfig` to `apps/mobile/metro.config.js`. This is required by Uniwind, but it is not monorepo config, so the "no monorepo-specific config" decision stands. No `watchFolders`, `nodeModulesPaths` or `extraNodeModules`. |
| Metro version | Add `metro`, `metro-cache` and `metro-transform-worker` at **0.87.1** to `apps/mobile`, so Uniwind patches the Metro copy Expo actually runs. See area 2. |
| Sharing | No shared UI package. Share keypad logic and formatting in `packages/domain`. The two libraries are not interchangeable. |
| First scaffold step | Run a dev build on `apps/mobile` under isolated installs before building screens. An unresolved report says Expo Router's entry can fail with Uniwind under pnpm isolated [S13]. |

### Versions checked

From the npm registry on 2026-11-09 [S2], the Expo SDK 58 version manifest [S3], and the resolved workspace [S4].

| Package | Latest on npm | Use | Notes |
| --- | --- | --- | --- |
| heroui-native | 1.0.11 | 1.0.11 | Peers: react `>=19.0.0`, react-native `>=0.81.0` |
| uniwind | 1.13.2 | 1.13.2 | Peers: metro `*`, metro-cache `*`, tailwindcss `>=4`. Depends on exactly `@tailwindcss/node` 4.3.3. |
| tailwindcss | 4.3.5 | **4.3.3** | Matches Uniwind's compiler. HeroUI's docs site also uses 4.3.3 [S6]. |
| @heroui/react | 3.2.7 | 3.2.7 | Peers: react and react-dom `>=19.0.0`, tailwindcss `>=4.0.0`, react-aria `^3.53.1`, react-aria-components `^1.22.1` |
| @heroui/styles | 3.2.7 | 3.2.7 | Peer: tailwindcss `>=4.0.0` |
| react-native-reanimated | 4.7.1 | 4.7.1 | Expo pins it exactly. Peer: react-native `0.86 - 0.88`, worklets `0.13.x`. |
| react-native-worklets | 0.13.1 | **0.13.0** | Expo pins 0.13.0 exactly. |
| react-native-gesture-handler | 3.5.0 | **~3.3.0** | Expo's version. HeroUI accepts `^2.28.0 \|\| ^3.0.0`. |
| react-native-safe-area-context | 5.11.1 | ~5.11.1 | HeroUI peer `^5.6.0`. |
| react-native-svg | 15.16.1 | **15.16.0** | Expo's version. HeroUI peer `^15.12.1`. |
| react-native-screens | 4.30.1 | ~4.30.1 | Optional peer, needed for Dialog, Select, Toast and others [S5]. |
| @gorhom/bottom-sheet | 5.2.14 | Only if used | Optional peer. Not in Expo's manifest. |
| tailwind-variants, tailwind-merge | | `^3.2.2`, `^3.6.0` | Required peers. Ranges from HeroUI's example app [S7]. |
| metro, metro-cache, metro-transform-worker | 0.87.3 | **0.87.1** | Exactly what `@expo/metro` 58.0.0 depends on [S4]. Bump when that changes. |

## 1. Version support

### heroui-native on Expo SDK 58 and React Native 0.88: officially supported

- The v1.0.11 release notes (2026-10-20) state "Expo SDK 58 and React Native 0.88 are supported" [S1].
- HeroUI's example app at tag `v1.0.11` runs `expo ~58.0.14`, `react-native 0.88.0`, React 19.3.0, Reanimated 4.7.1, worklets 0.13.0 and gesture handler ~3.3.0 [S7]. These match Expo's manifest, apart from the Expo and React Native patch level.
- A clean peer check: `pnpm peers check` reported "No peer dependency issues found" for Expo 58.0.23, React Native 0.88.1 and all Expo-pinned peers [S4].
- Open issues: 7 in total, none about SDK 58, React Native 0.88 or pnpm [S8]. One may touch this app: #542, a controlled `Switch` thumb staying at the off edge [S8]. No planned screen needs `Switch`.

**The SDK 56 and React Native 0.85 baseline is out of date.** It comes from the `create-heroui-native-app` CLI v1.0.0 release note of June 2026 [S9], and v1.0.4 upgraded the example app to the same versions [S10]. It describes a scaffold, not a limit.

**The quick start disagrees with npm on one range.** It lists `react-native-worklets ^0.5.1` [S5], while npm's peer range is `>=0.5.1` [S2]. Expo's 0.13.0 is outside the first and inside the second, and HeroUI's own example uses 0.13.0 [S7]. Follow npm and Expo.

Resolved problems that would have hit these versions:

- Input `ref` types under React Native's Strict TypeScript API, fixed in 1.0.11 [S1][S11]. Confirmed in the published declarations [S4].
- Uniwind missing `AssetRegistry`, which stopped apps starting on React Native 0.88 [S12]. Fixed in Uniwind 1.13.0, which now forwards every React Native export [S4][S14]. Do not use Uniwind older than 1.13.0.

### @heroui/react on Next.js 16.4 and React 19.3: likely to work

- The peer range is `react >=19.0.0`, which includes 19.3.0 [S2].
- There is **no Next.js peer range**, and the frameworks page does not name a Next.js version [S15].
- The strongest evidence is that HeroUI's docs site on the `v3` branch uses `next 16.4.2`, `react 19.3.1` and `tailwindcss 4.3.3` [S6]. **Inference:** that is close enough to 16.4.5 and 19.3.0 to treat as supported.
- No open GitHub issue mentions Next.js 16.4 or React 19.3 [S16].
- `@heroui/react` components ship with `"use client"` [S4].

Tooltip issue #6651, where 3.2.0 broke under hoisted installs because a copy of `react-aria` was bundled into `dist` [S17], does not affect 3.2.7. No `node_modules` directory exists in its `dist`, and the lockfile has one `react-aria` version [S4].

## 2. Uniwind and dependencies under Metro and pnpm isolated installs

**Recommendation: keep isolated. Add the Uniwind Metro wrapper and the Metro pin.** `pnpm peers check` passes with the isolated linker [S4]. Nothing in the installed code requires `nodeLinker: hoisted`.

Expo-bundled dependencies all sit inside HeroUI's ranges:

| Dependency | Expo SDK 58 | heroui-native peer | Result |
| --- | --- | --- | --- |
| react-native-reanimated | 4.7.1 | `^4.1.1` | OK |
| react-native-worklets | 0.13.0 | `>=0.5.1` | OK |
| react-native-gesture-handler | ~3.3.0 | `^2.28.0 \|\| ^3.0.0` | OK |
| react-native-safe-area-context | ~5.11.1 | `^5.6.0` | OK |
| react-native-svg | 15.16.0 | `^15.12.1` | OK |
| react-native-screens | ~4.30.1 | `>=4` (optional) | OK |
| expo-blur | ~58.0.5 | `>=14.0.0` (optional) | OK if used |
| @gorhom/bottom-sheet | Not in manifest | `^5.2.9` (optional) | Reanimated >= 4.6 logs warnings [S18]. Only needed for BottomSheet, or `presentation="bottom-sheet"` [S5]. |

`heroui-native` has no native code of its own, so it adds no autolinking beyond its peers [S4]. All peers with native code must be direct dependencies of `apps/mobile`.

### What the setup needs

```js
// apps/mobile/metro.config.js (illustrative)
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
});
```

```json
// apps/mobile/package.json, in addition to the HeroUI peers
"uniwind": "1.13.2",
"tailwindcss": "4.3.3",
"metro": "0.87.1",
"metro-cache": "0.87.1",
"metro-transform-worker": "0.87.1"
```

```css
/* apps/mobile/global.css */
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';
```

`withUniwindConfig` must be the outermost wrapper [S19]. No Babel preset is needed [S19]. Do not copy HeroUI's example `metro.config.js`: its `watchFolders` and `disableHierarchicalLookup` exist because the example consumes the library from outside the app [S7].

### Traps under isolated installs

- **Two copies of Metro (the main finding).** Uniwind patches `metro/private/DeltaBundler/Graph` from its own resolution of `metro` [S4]. Left alone, pnpm gives that peer **0.87.3**, while Expo's `@expo/metro` 58.0.0 depends on exactly **0.87.1** and Expo's CLI imports Metro through it [S4]. **Inference:** Uniwind then patches a `Graph` class Expo never uses, so CSS in lazy development bundles and uncached style updates would silently misbehave. I did not run this to see the symptom. Adding the three 0.87.1 dependencies to `apps/mobile` makes Uniwind's peers resolve to 0.87.1, confirmed in a re-resolved lockfile [S4]. Uniwind's own repository develops against metro 0.87.1 [S20]. After any Expo upgrade, check `pnpm why metro` and update the pin.
- **`heroui-native` imports `uniwind` but does not declare it** [S2][S4]. Isolated installs normally break this. Two things prevent it: Uniwind's Metro resolver re-pins every `uniwind` request to the project root [S4], and pnpm's default hoisting places `uniwind` in `node_modules/.pnpm/node_modules` [S4]. So `uniwind` must be a direct dependency of `apps/mobile`, and do not set `hoist: false`. The other undeclared-looking packages (`@expo/vector-icons`, `expo-linear-gradient`, `expo-image`, `react-native-keyboard-controller`) appear only in the shipped `.md` docs, not in code [S4].
- **The `@source` path is no longer needed.** The quick start still shows `@source './node_modules/heroui-native/lib'`, with a comment saying it is not required from 1.0.8 [S5]. The shipped stylesheet now has its own `@source ".."` [S4][S21], which fixes the old hard-coded-path problem in monorepos. Omit the line.
- **Class scanning starts at the folder holding `global.css`** [S19][S22]. Put `global.css` at the `apps/mobile` root. A shared package using `className` would need its own `@source` line [S22], another reason not to have one.
- **Start Metro from `apps/mobile`.** Uniwind resolves `cssEntryFile` against `process.cwd()` [S4]. `pnpm --filter mobile start` and EAS builds both satisfy this (**Inference**).
- **Earlier isolated-install bugs are fixed in 1.13.2.** The undeclared `metro-cache` import (#552, fixed by #561) [S23], the symlink misclassification (#598, fixed in 1.12.0) [S24][S4], and Metro failing to find `uniwind`'s main entry (#679, fixed in 1.12.1) [S14][S25].

### Unresolved: Expo Router entry under isolated installs

Issue #619 reports, on Uniwind 1.10.0 with Expo SDK 57 and pnpm isolated, `Unable to resolve module ./node_modules/expo-router/entry`, fixed by `node-linker=hoisted` [S13]. A bot closed it for not using the template, with no maintainer diagnosis or fix [S13]. It is the only report of its kind I found, and it predates later resolver fixes, so it may or may not still apply. The first dev build answers it.

### Web under isolated installs

- Install both `@heroui/react` and `@heroui/styles` as direct dependencies [S26].
- `@import "tailwindcss"` then `@import "@heroui/styles"`, in that order [S26]. No provider or plugin is needed [S26].
- Components use class names defined in `@heroui/styles`, so `packages/*` and `node_modules` do not need `@source` for HeroUI (**Inference** from the shipped CSS [S4]).
- `react-aria` and related peers are not in the install command [S26]. pnpm installs them because `autoInstallPeers` is on by default. Keep it on, or list them yourself.
- Uniwind and Metro are mobile-only. `apps/web` uses `@tailwindcss/postcss` at 4.3.3.
- Under the fallback below, 3.2.7 is not exposed to the #6651 bug [S17][S4].

**What would change this:**

- The first dev build fails with an #619-style entry error: set `nodeLinker: hoisted` in `pnpm-workspace.yaml`, keeping everything else. The monorepo research already names this as the fallback.
- An Expo patch moves `@expo/metro`: update the 0.87.1 pin to match.

## 3. Component mapping

Components were confirmed from the published packages [S4] and docs [S27][S28]. "Custom" means no HeroUI component does the job. Component names in the table are real, but layouts were not built or tested.

### What each library has

| Need | heroui-native 1.0.11 | @heroui/react 3.2.7 |
| --- | --- | --- |
| Text and number fields | TextField, Input, TextArea, InputGroup | TextField, Input, **NumberField** |
| Date | **None** | DateField, DatePicker, Calendar |
| Single and multi choice | Select, RadioGroup, Checkbox, TagGroup | Select, RadioGroup, CheckboxGroup, TagGroup, ToggleButtonGroup |
| Slider | Slider | Slider |
| Show or hide sections | Accordion | Accordion, Disclosure |
| Tabs | Tabs | Tabs |
| Overlays | Dialog, BottomSheet, Popover, Menu, Toast | Modal, AlertDialog, Drawer, Sheet, Popover, Toast |
| Containers | Card, Surface, ListGroup, Separator | Card, Surface, Separator |
| Status | Chip, Alert, Spinner, Skeleton | Chip, Badge, Alert, Spinner, Skeleton, ProgressBar, Meter |
| Tables | **None** | Table, Pagination |
| Charts | **None** in the open-source package | **None** [S4] |
| Press wrapper | PressableFeedback | Button, ToggleButton |

### Screens

| Screen part | Use | Custom? |
| --- | --- | --- |
| **Round entry, mobile** | | |
| Course, tees, score, Handicap Index, Course Handicap | TextField with Input | No |
| Date | `@react-native-community/datetimepicker` 9.2.1 (in Expo's manifest [S3]) or a text field | **Custom**, no HeroUI date picker |
| Holes played, Baseline | TagGroup, `selectionMode="single"` | No |
| Strokes Gained keypad: ±, Next, two decimals | Grid of `Pressable` | **Custom** |
| Strokes Gained value cells | Pressable, opens the keypad | **Custom** |
| Advanced stats section | Accordion | No |
| Approach miss cross | Layout custom, fields TextField | **Custom layout** |
| Strokes Gained by distance band | Grid of cells wired to the keypad | **Custom** |
| Save, saved confirmation | Button, Toast or Dialog | No |
| **Round entry, web** | | |
| Fields | TextField, NumberField, DatePicker | No |
| Holes played, Baseline | TagGroup or ToggleButtonGroup | No |
| Strokes Gained keypad | Grid of `Button`, sharing key logic with mobile | **Custom** |
| Approach miss cross, distance bands | CSS grid with NumberField | **Custom layout** |
| Advanced stats section | Disclosure or Accordion | No |
| **Weekly Plan** | | |
| Strip of seven days, one open | Tabs, using the render function on `Tabs.Trigger` for day, date and marker | Partly. Fall back to a row of PressableFeedback if seven triggers do not fit. |
| Practice Ground, minutes, Facilities | TagGroup | No |
| Drills and Games for the day | Card, ListGroup, Chip | No |
| **Unplanned Session setup** | | |
| Time | Slider (`minValue`, `maxValue`, `step`, `onChange`) | No |
| Practice Ground, Facilities | TagGroup, single and multiple | No |
| Live split preview bar | Proportional Views | **Custom**, no native progress component |
| Skipped SG Category notes | Alert | No |
| Swap, Regenerate | Button | No |
| **Live Practice Session (mobile)** | | |
| Black high-contrast screen | Plain Views with explicit classes, optionally Uniwind `ScopedTheme` [S4] | **Custom** |
| One item at a time | Screen state | **Custom** |
| Rules behind a button | Button plus Dialog | No |
| Tap-anywhere counter | Full-screen `Pressable` | **Custom** |
| −1, Finish Game | Large `Pressable` or Button | Mostly custom for size |
| Large pad adding up a total, Undo | Grid of `Pressable` | **Custom** |
| Connection status | Chip driven by `expo-network` | Partly |
| End Practice Session confirmation | Dialog | No |
| **Web stats and past Practice Sessions** | | |
| Lists | Table, Pagination | No |
| Filters | Select, DateRangePicker, Tabs | No |
| Practice Session detail | Drawer or Modal, Disclosure | No |
| Summary numbers, Strokes Gained bars | Card, Meter or ProgressBar | No |
| Trend charts | Separate chart library, not researched | **Custom** |

**Use `Dialog`, not `BottomSheet`, for Rules and confirmations on mobile.** It avoids the optional `@gorhom/bottom-sheet` dependency and its warnings under Reanimated >= 4.6 [S18]. Dialog still needs `react-native-screens` [S5].

**Use a plain `Pressable` for repeated taps on the Live Practice Session.** **Inference:** PressableFeedback adds Reanimated animations that a tap-anywhere counter does not need.

### API differences that limit sharing

The two packages have different foundations: native is React Native, Reanimated and Uniwind, and web is React Aria Components and the DOM [S4]. The names look similar but the props often do not match.

| Component | heroui-native | @heroui/react |
| --- | --- | --- |
| Tabs | `value`, `onValueChange` | `selectedKey`, `onSelectionChange` |
| Tabs parts | `Tabs.Trigger`, `Tabs.Label`, `Tabs.Content` | `Tab`, `TabList`, `TabIndicator`, `TabPanel` |
| Accordion | `value`, `onValueChange`, `selectionMode` | Built on Disclosure Group, `expandedKeys` |
| Select | `value` and `onValueChange`, `presentation` | React Aria `Select`, key-based |
| Slider | `value`, `onChange`, `onChangeEnd`, `minValue`, `maxValue`, `step` | Same shape, inherited from React Aria |
| TagGroup | `selectionMode`, `selectedKeys`, `onSelectionChange` | Same names |

**Recommendation: no `packages/ui`.** Build each screen twice, and share the logic beneath it in `packages/domain`: keypad key handling, two-decimal formatting, and split and Round validation. This also keeps `packages/domain` free of React and bundler concerns, as the monorepo research recommends.

**What would change this:**

- Most mobile screens end up custom anyway: drop `heroui-native` and use Uniwind alone.
- Trend charts become central on the web: research a chart library, as HeroUI has none in its open-source package.

## Not verified

- **No build or run.** Metro bundling, dev builds, EAS builds, Next.js builds, and all rendering were not tested. Issue #619 [S13] remains open in practice until the first dev build.
- **The symptom of the Metro split.** The two-copies fact is verified [S4], but the effect of the unapplied patches is **Inference**.
- **`expo-doctor` and the direct `metro` dependencies.** It may warn about them.
- **TypeScript 6.0.3** against HeroUI's and Uniwind's types.
- **Which packages need `allowBuilds` entries.** I installed with `--ignore-scripts` and `strictDepBuilds` off. pnpm will prompt.
- **`@heroui/react` with Turbopack under pnpm isolated.** Inferred from the peer resolution and the docs site, not tested. The docs site's own workspace is pnpm, but I did not confirm how it hoists.
- **Whether seven `Tabs.Trigger` items fit a phone width,** or how `Tabs.Content` mounts.
- **`ScopedTheme` with HeroUI components** on the black Live Practice Session screen.
- **Paid HeroUI Pro** was not evaluated, including its chart components.
- **Issue counts** are from GitHub search on 2026-11-09 and can miss issues phrased differently.

## Sources

Registry and repository data retrieved 2026-11-09.

| # | Source | Applies to |
| --- | --- | --- |
| S1 | [HeroUI Native v1.0.11 release notes](https://github.com/heroui-inc/heroui/blob/v3/apps/docs/content/docs/en/native/releases/v1-0-11.mdx), [GitHub release](https://github.com/heroui-inc/heroui-native/releases/tag/v1.0.11) | 2026-10-20 |
| S2 | [npm registry](https://www.npmjs.com/), `npm view` | 2026-11-09 |
| S3 | [Expo bundledNativeModules.json](https://cdn.jsdelivr.net/npm/expo@58.0.23/bundledNativeModules.json) | expo 58.0.23 |
| S4 | Throwaway pnpm 11.28.2 workspace: `pnpm-lock.yaml`, `pnpm peers check`, and package source of heroui-native 1.0.11, uniwind 1.13.2, @heroui/react 3.2.7, @heroui/styles 3.2.7, @expo/metro 58.0.0, @expo/cli, react-native 0.88.1 | 2026-11-09 |
| S5 | [HeroUI Native quick start](https://heroui.com/docs/native/getting-started/quick-start) | Current docs |
| S6 | [HeroUI `v3` branch, apps/docs/package.json](https://github.com/heroui-inc/heroui/blob/v3/apps/docs/package.json) | 2026-11-09 |
| S7 | [heroui-native example app at v1.0.11](https://github.com/heroui-inc/heroui-native/tree/v1.0.11/example) (package.json, metro.config.js) | v1.0.11 |
| S8 | [heroui-native open issues](https://github.com/heroui-inc/heroui-native/issues), including [#542](https://github.com/heroui-inc/heroui-native/issues/542) | 2026-11-09 |
| S9 | [create-heroui-native-app CLI v1.0.0](https://heroui.com/docs/native/releases/cli-v1-0-0) | 2026-06-04 |
| S10 | [HeroUI Native releases](https://heroui.com/docs/native/releases) | Current docs |
| S11 | [heroui-native #497](https://github.com/heroui-inc/heroui-native/issues/497) | Closed 2026-09-21 |
| S12 | [uniwind #732](https://github.com/uni-stack/uniwind/issues/732) | Closed 2026-10-16 |
| S13 | [uniwind #619](https://github.com/uni-stack/uniwind/issues/619) | Closed by bot 2026-07-28 |
| S14 | [Uniwind releases](https://github.com/uni-stack/uniwind/releases) (1.12.1, 1.13.0, 1.13.2) | 2026-11-09 |
| S15 | [HeroUI frameworks doc](https://github.com/heroui-inc/heroui/blob/v3/apps/docs/content/docs/en/react/getting-started/(overview)/frameworks.mdx) | `v3` branch |
| S16 | [heroui issues search](https://github.com/heroui-inc/heroui/issues) for Next.js 16.4 and React 19.3 | 2026-11-09 |
| S17 | [heroui #6651](https://github.com/heroui-inc/heroui/issues/6651) | Closed 2026-06-17 |
| S18 | [react-native-bottom-sheet #2785](https://github.com/gorhom/react-native-bottom-sheet/issues/2785) | Open, 2026-10-19 |
| S19 | [Uniwind quickstart](https://docs.uniwind.dev/quickstart) | Current docs |
| S20 | [uniwind packages/uniwind/package.json](https://github.com/uni-stack/uniwind/blob/main/packages/uniwind/package.json) | 2026-11-09 |
| S21 | [heroui-native #454](https://github.com/heroui-inc/heroui-native/issues/454) | Closed 2026-07-31 |
| S22 | [Uniwind: Monorepos and @source](https://docs.uniwind.dev/monorepos) | Current docs |
| S23 | [uniwind #552](https://github.com/uni-stack/uniwind/issues/552), [PR #561](https://github.com/uni-stack/uniwind/pull/561) | Merged 2026-06-01 |
| S24 | [uniwind #598](https://github.com/uni-stack/uniwind/issues/598) | Closed 2026-09-04 |
| S25 | [uniwind #679](https://github.com/uni-stack/uniwind/issues/679) | Closed 2026-09-18 |
| S26 | [HeroUI React quick start](https://heroui.com/docs/react/getting-started/quick-start) | Current docs |
| S27 | [HeroUI Native components](https://heroui.com/docs/native/components) and component docs shipped in the package | 1.0.11 |
| S28 | `@heroui/react` 3.2.7 `dist/components` and type declarations | 3.2.7 |
