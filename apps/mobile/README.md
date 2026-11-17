# gtrack mobile

The phone app: Expo SDK 58, Expo Router, `heroui-native` and Uniwind. It talks only to the Laravel API in `api/`.

## Setup

From the repo root (pnpm comes from Corepack, pinned in the root `package.json`):

```sh
corepack enable pnpm
pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local   # set EXPO_PUBLIC_API_URL to your Mac's LAN IP
```

Run the API so the phone can reach it over the LAN:

```sh
cd api && php artisan serve --host=0.0.0.0 --port=8000
```

## Running on a device

Builds are local. There's no EAS, App Store or Play account.

```sh
cd apps/mobile
pnpm ios       # expo run:ios, with the iPhone connected
pnpm android   # expo run:android, with the Android phone connected over USB
```

**An iOS build signed with a free Apple ID expires after 7 days on the device.** Rebuild with `pnpm ios` when it stops opening.

Start Metro from `apps/mobile` (`pnpm start`): Uniwind resolves `global.css` against the working directory.

## Checks

```sh
pnpm typecheck
pnpm test
```

## Setup notes

- `metro`, `metro-cache` and `metro-transform-worker` are pinned to the Metro version `@expo/metro` depends on (0.87.1), so Uniwind patches the copy Expo actually runs. Move the pin whenever Expo is upgraded. They're excluded from `expo install --check`, whose manifest lags behind.
- `tailwindcss` is pinned to Uniwind's compiler (4.3.3). Uniwind must stay 1.13.0 or later.
- Uniwind only adds `className` to React Native's own components. Wrap any other component with `withUniwind` before styling it with classes, as `src/components/safe-area-view.tsx` does for `SafeAreaView`. Otherwise its classes are silently ignored.
- `uniwind-types.d.ts` is written by Metro and committed so CI can type-check without starting Metro.
- Types for API responses come from `@gtrack/types`, generated from the Laravel data objects. Don't edit them by hand: run `php artisan typescript:transform` in `api/`.
