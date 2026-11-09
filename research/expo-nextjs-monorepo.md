# Expo and Next.js monorepo sharing domain logic, types and a Supabase client

Researched 2026-11-09. Nothing here has been built or run: no project was scaffolded and no packages were installed. `[S#]` markers refer to the source table at the end. Claims marked **Inference** are my reasoning from the sources, not something a source states.

## Recommended setup

| Area | Recommendation |
| --- | --- |
| Workspace tooling | pnpm workspaces with the default isolated linker, pinned to pnpm 11. No Turborepo to start with. |
| Metro and Next.js config | Use Expo's default Metro config and no `transpilePackages`. Both tools handle workspace packages automatically at these versions. Shared packages export TypeScript source. |
| Supabase | Share the generated `Database` type and query functions that take a client as an argument. Each app builds its own client and owns its auth wiring. |
| Dropped connection | Store the in-progress Practice Session in `expo-sqlite`, mark it dirty on each change, and upload an idempotent snapshot when the connection returns. No sync engine. |

Proposed layout:

```text
apps/mobile        Expo: Practice Sessions, on-device store, upload
apps/web           Next.js: Round entry, stats, session review
packages/domain    Pure TypeScript: SG Category, Proficiency, Practice Session rules
packages/supabase  Generated Database type, query functions taking a client
```

### Versions checked

From the npm registry on 2026-11-09 [S5], the Expo SDK 58 version manifest [S6] and the Expo template [S7].

| Package | Latest on npm | Use | Why they differ |
| --- | --- | --- | --- |
| expo | 58.0.23 | ~58.0.23 | |
| react-native | 0.88.1 | 0.88.1 | Requires Node `^22.13.0 \|\| ^24.3.0 \|\| >=26.0.0` |
| react, react-dom | 19.3.1 | **19.3.0** | Expo SDK 58 pins exactly 19.3.0. Next.js accepts `^19.0.0`. |
| next | 16.4.5 | 16.4.5 | Requires Node `>=20.9.0` |
| @supabase/supabase-js | 2.119.0 | 2.119.0 | Requires Node `>=22.0.0` |
| @supabase/ssr | 0.12.7 | 0.12.7 | Peer: supabase-js `^2.114.0` |
| expo-sqlite | 58.0.15 | ~58.0.15 | |
| @react-native-async-storage/async-storage | 3.1.1 | 2.2.0 if used | Expo pins 2.2.0. The plan below does not need it. |
| typescript | 7.0.2 | ~6.0.3 | The SDK 58 template uses ~6.0.3. See "Not verified". |
| pnpm | 12.18.0 | 11.28.x | See area 1. |
| turbo | 2.11.10 | not used yet | |

## 1. Workspace tooling

**Recommendation: pnpm workspaces, default isolated linker, pinned to the latest pnpm 11, without Turborepo.** Expo lists pnpm among its first-class workspace managers [S1], and it is the manager Expo documents an explicit fallback for. Catalogs let `react`, `react-dom`, `typescript` and `supabase-js` be pinned once for both apps [S12], which directly targets the main monorepo risk: Expo states that duplicate React versions cause runtime errors and duplicate React Native versions are not supported [S1].

| Option | Status with Expo SDK 58 | Assessment |
| --- | --- | --- |
| **pnpm** | First-class. Isolated installs supported from SDK 54 [S1]. `isolated` is pnpm's default linker [S8]. | Chosen. Strict dependency access, catalogs, documented fallback. |
| Bun | First-class [S1]. New workspaces default to isolated [S15]. | Viable, and the margin is small. Its isolated-install docs do not mention Metro, Expo or React Native [S15], and Expo's documented isolated-install fallback is pnpm-specific [S1]. |
| npm | First-class, hoisted by default [S1]. | Most conventional layout. Version alignment is done with `overrides` [S1]. The sources disagree on `workspace:*`: Expo says npm accepts it [S1], Turborepo says to use `*` for npm [S18]. |
| Yarn | v1 and Berry are first-class [S1]. | Berry defaults to `nodeLinker: pnp` [S17]. Expo's guide does not address Plug'n'Play, so it would need `node-modules` set. No advantage here. |

Known incompatibilities and traps with pnpm:

- **Isolated `node_modules` with Metro.** The old advice to always hoist is out of date. SDK 53 should disable isolated installs, but SDK 54 and later support them, although "some React Native libraries may cause build or resolution errors" [S1]. The fix is `nodeLinker: hoisted` in `pnpm-workspace.yaml` [S1].
- **That setting no longer belongs in `.npmrc`.** pnpm now reads `nodeLinker` only from `pnpm-workspace.yaml` [S9], so older `.npmrc` recipes (`node-linker=hoisted`) do not apply.
- **Native module duplicates.** From SDK 55, Metro is automatically aligned with autolinked native modules in monorepo apps [S1]. Check with `pnpm why --depth=10 react-native` [S1].
- **Build scripts fail the install.** `strictDepBuilds` defaults to `true`, so unreviewed dependency build scripts stop the install until they are set in `allowBuilds` [S10].
- **New releases are held back a day.** `minimumReleaseAge` defaults to 1440 minutes from pnpm 11 [S11]. Expect this when installing a same-day Expo patch.
- **Leave the global virtual store off.** It is experimental and off by default for projects [S14]. Next.js points to its experimental `turbopackAdditionalRoots` for packages linked from a global virtual store [S4], so enabling it would likely add config.
- **EAS Build ships pnpm 11.** The SDK 58 images have pnpm 11.27.0 (Android) and 11.28.2 (iOS) [S20]. pnpm 12 is a Rust rewrite that keeps the pnpm 11 lockfile format but changes some behaviour [S13]. Pinning pnpm 11 locally keeps local and cloud builds the same, and `eas.json` has a `pnpm` field for setting the build version explicitly [S21].
- **The Android `latest` EAS image points at the SDK 57 image** [S20]. Do not set `image: latest` for Android.
- **EAS commands run from `apps/mobile`,** and `eas.json` lives there too [S22].

Minimal root config (illustrative):

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
catalog:
  react: 19.3.0
  react-dom: 19.3.0
  typescript: ~6.0.3
  '@supabase/supabase-js': 2.119.0
```

**Why no Turborepo yet.** The shared packages have no build step, and Turborepo states that such packages cannot be cached by it [S18]. Only lint, type-check and test would benefit, across two apps and two small packages. `pnpm --filter` covers running tasks per package [S16]. Turborepo can be added later without restructuring the repo [S19]. An Expo staff example does pair pnpm and Turborepo [S23], but its purpose is CI speed on a larger template.

**What would change this:**

- A library fails under isolated installs: switch to `nodeLinker: hoisted`, keep everything else.
- CI time becomes a real cost, or packages gain build steps: add Turborepo.
- EAS images move to pnpm 12: move with them.

## 2. Metro and Next.js configuration

**Recommendation: no monorepo-specific bundler config in either app.**

**Expo auto-configures this.** From SDK 52, `expo/metro-config` configures Metro for monorepos, and manual `watchFolders`, `resolver.nodeModulesPaths`, `resolver.extraNodeModules` and `resolver.disableHierarchicalLookup` should be removed [S1]. Many older blog posts still show those settings. Run `npx expo start --clear` once if migrating [S1]. Metro reads `package.json` `exports` on all platforms from SDK 53 [S2]. On-demand filesystem access is on by default and allows symlinks to resolve outside the monorepo root [S2].

**Next.js also handles it.** "Turbopack transpiles workspace packages (npm, pnpm, or Yarn workspaces) in your monorepo automatically under both routers", and webpack does the same for the App Router [S3]. `transpilePackages` is only needed for raw TypeScript from `node_modules` or Pages Router webpack cases [S3]. Next.js detects the Turbopack root from the lockfile, including `pnpm-lock.yaml` [S4]. With one lockfile at the repo root, no `turbopack.root` is needed. Files outside the root do not resolve [S4], so a stray lockfile in `apps/web` would break imports from `packages/*` (**Inference**).

**Shared packages export TypeScript source** with no build step, a pattern Turborepo calls Just-in-Time packages [S18]:

```json
{
  "name": "@golf/domain",
  "private": true,
  "exports": { ".": "./src/index.ts" },
  "scripts": { "check-types": "tsc --noEmit" }
}
```

Apps depend on it with `"@golf/domain": "workspace:*"` [S1]. Constraints:

- No `compilerOptions.paths` inside a shared package [S18]. Use relative imports.
- Type errors in a shared package surface in whatever depends on it [S18].
- `packages/domain` should have no `react`, `react-native`, `expo-*` or `next` imports. This keeps the package bundler-neutral and also keeps it clear of the duplicate-React risk (**Inference**).

**Caveat.** Expo's guide uses a plain `index.js` as its package example and does not explicitly document TypeScript-source packages [S1]. An Expo staff example uses `"main": "./src/index.ts"`, but at SDK 54 [S23]. It should work, and the first scaffold step should prove it: import one TypeScript function from `packages/domain` in both apps. If Metro fails on it, compile the package and point `exports` at the output, which is the supported fallback [S3].

## 3. Supabase auth and session storage

**Recommendation: share everything above the client, and nothing that constructs it.**

| Concern | Expo | Next.js | Shared? |
| --- | --- | --- | --- |
| Package | `@supabase/supabase-js` [S24] | `@supabase/ssr` plus `@supabase/supabase-js` [S29] | Only the supabase-js version |
| Client creation | `createClient` | `createBrowserClient`, and a per-request `createServerClient` [S29] | No |
| Session store | `localStorage` from `expo-sqlite/localStorage/install` [S24] | Cookies via `getAll`/`setAll` [S29] | No |
| Token refresh | `autoRefreshToken` plus `AppState` start/stop [S24][S31] | `proxy.ts` calling `getClaims()` [S29] | No |
| `detectSessionInUrl` | `false` [S24] | Not applicable | No |
| Env vars | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` [S24] | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` [S29] | No |
| `Database` type | `createClient<Database>` [S33] | Same type | **Yes** |
| Queries, e.g. list Rounds | Function taking `SupabaseClient<Database>` | Same function | **Yes** |
| Domain logic, e.g. Proficiency | Pure function | Same function | **Yes** |

So the query layer and types are fully shareable, and the auth wiring (roughly one client file per environment plus sign-in screens) is not. Do not put `@supabase/ssr`, `next/headers` or `expo-*` in `packages/supabase`, because Metro would then have to resolve web-only code and Next.js native-only code (**Inference**).

**Pass the URL and key in; do not read env vars in shared code.** Expo only inlines exact `process.env.EXPO_PUBLIC_X` references, and "Code inside **node_modules** is not affected" [S25]. Its docs do not say how workspace packages are treated [S25]. Reading env vars in `apps/*` avoids the question.

**Expo session storage.** Use Expo's current guide: `expo-sqlite/localStorage/install`, with `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false` [S24]. `expo-sqlite` is needed anyway for area 4. Supabase's own quickstart uses AsyncStorage and `react-native-url-polyfill` [S30], but Expo says Expo projects do not need the polyfill [S24].

- **Caveat: this store is not encrypted by default (Inference from S27).** Encrypting the database requires SQLCipher, a config plugin option that needs a development build and does not work in Expo Go [S27]. Without the binary support, `PRAGMA key` silently does nothing [S27]. Supabase's alternative is `LargeSecureStore`: AES-encrypted session in AsyncStorage, key in SecureStore [S32]. For a single-user app holding practice scores, the plain store is a reasonable trade. If the app is distributed more widely, adopt `LargeSecureStore` or SQLCipher.
- **Do not put the whole session in SecureStore.** Supabase cites a 2048-byte limit [S32]. Expo's docs now soften this to "some iOS releases refused values above roughly 2048 bytes", with no enforced limit [S26]. It stays unreliable either way.

**Deep links are only needed for some sign-in methods.** OAuth and magic links need a custom `scheme`, a wildcard entry in the Supabase redirect allow list, `makeRedirectUri`, and handling of the returned URL with `setSession` [S34]. Supabase recommends universal links for the best experience, at the cost of more setup [S34]. `signInWithPassword` needs no deep link [S30], and an OTP email is sent when the template uses `{{ .Token }}` [S35]. For a single user, **email and password avoids all of it**. If Google or Apple sign-in is wanted later, add this then.

**Next.js rules that are easy to get wrong** [S29]:

- On Next.js 16 the file is `proxy.ts`. A `middleware.ts` recipe is for 15 and earlier, and the reverse mismatch silently stops session refresh.
- `setAll` receives a second `headers` argument with cache headers, which the proxy must apply so CDNs do not cache `Set-Cookie`.
- Protect pages with `getClaims()`. Never trust `getSession()` in server code.
- Let the proxy do the refreshing. Refresh tokens are single-use [S28], so refreshing in several places can sign the user out.

**What would change this:** adding OAuth brings in deep links, and wider distribution brings in encryption at rest.

## 4. Surviving a dropped connection during a Practice Session

**Recommendation: `expo-sqlite` as the source of truth during the Practice Session, a dirty flag, and an idempotent snapshot upload. No sync engine.**

The shape of the problem makes this safe. Live Practice Sessions run only on mobile, and the web only reviews them. So each Practice Session has one writer, and there are no concurrent edits to reconcile (**Inference**). Merging concurrent edits is the main thing a sync engine would add.

| Option | New moving parts | Fit |
| --- | --- | --- |
| **SQLite plus dirty-flag snapshot** | About two local tables and one upload function | **Chosen.** Ordering problems disappear because each upload sends current state. |
| SQLite plus operation queue | Same, plus ordering and per-operation replay | Only better if individual changes must be replayed. Not needed here. |
| TanStack Query persisted mutations | Persister, `setMutationDefaults` registered at startup or resume fails with `No mutationFn found` [S36], `onlineManager` wiring [S39] | Workable, but persisted state older than `maxAge` (default 24 hours) is discarded [S37], and async persistence is throttled by 1000 ms by default [S38], so the latest change could be lost if the app is killed (**Inference**). |
| Legend-State with Supabase | `created_at`, `updated_at`, `deleted` columns and a trigger [S40] | Supabase support is in v3, documented as Beta [S40]. npm `latest` is still 2.1.15 [S5]. |
| PowerSync | Replication role, Postgres publication, Sync Streams, hosted or self-hosted service, `uploadData` connector [S41][S42] | Full bidirectional sync for a one-direction need. `op-sqlite` native adapter does not run in Expo Go [S41]. Free tier deactivates on inactivity (the pricing page says both 1 and 2 weeks) [S43], a real risk for one user with gaps between range visits. |

Expo's local-first guide is consistent with starting small. It advises writing actions to the local database first, and says of tools in this space "you might want to wait for the tools to mature" [S44].

**Sketch:**

1. When a Practice Session starts, copy its Drills and Games into SQLite. Generate UUIDs on the device for the Practice Session and its results, so a retried upload cannot create duplicates (**Inference**).
2. On each Game score or completed Drill, update local state and set `dirty = 1` in one transaction. SQLite data persists across restarts [S27]. Use `withExclusiveTransactionAsync`, since `withTransactionAsync` is not isolated from other async queries [S27].
3. Attempt an upload at app start, on `AppState` becoming active, on network regain via `expo-network` [S45], and after each change. Allow only one upload at a time.
4. Upload the Practice Session row, then its results array, with `upsert` on the primary key [S46]. Each PostgREST request is its own transaction [S47], so if the web must never see half a Practice Session, use a single RPC taking the whole snapshot, or set a `completed` status last.
5. Clear `dirty` only if the row was not changed during the upload.

**Failure handling, verified in the client source:**

- Network failures do not throw by default. They come back as `error` with `status: 0` [S49], so upload code must check for that and stop until the next trigger.
- Do not treat a failed refresh during an outage as a sign-out. Retryable network errors leave the stored session intact; only non-retryable refresh failures remove it [S48]. However, `getSession()` returns `session: null` with an error once the access token has expired and refresh fails [S48].
- **Trap:** with no session, supabase-js falls back to sending the publishable key as the bearer token [S50]. A request sent at that moment would run without the user's identity and be rejected by owner-based RLS (**Inference**). Before uploading, require a non-null session from `getSession()`, and treat 401 or RLS errors as "try later", never as a reason to discard data. Access tokens default to one hour [S28], so a long range visit will hit this.
- Keep a Practice Session that cannot be uploaded, and show it as failed. Never wipe local data on sign-out while it is dirty.
- Do not route to the sign-in screen on `session: null` if `error` is a retryable network error, or an outage mid-session would look like a sign-out.
- A first sign-in needs a connection. Only an existing session carries through an outage.

**Do not rely on background upload.** Background tasks have a 15-minute minimum interval, run when the system chooses, and stop if the user kills the app [S51]. Uploading when the app is next opened meets the need.

Deletes need one decision: `upsert` will not remove a result that was deleted locally. Either make results append-only with a soft-delete column, or use the RPC to replace the set.

**What would change this:**

- **Starting a new Practice Session with no signal** (likely at a range). The snapshot above assumes it was created online. To create one offline, also cache the Drill and Game catalogue, Facilities and Proficiency inputs on the device when online. `packages/domain` can then run the selection logic locally. This is still far short of a sync engine, but it is added scope that needs a product decision.
- **Editing the same Practice Session on two devices, or from the web while mobile has unsent changes.** There would then be two writers, needing at least `updated_at` conflict rules. If this becomes common, re-evaluate PowerSync.
- **Needing full history offline on the phone.** A read-side sync problem, which is what sync engines solve.

## Not verified

- **No end-to-end build.** The combination of Expo SDK 58, Next.js 16.4 and pnpm 11 sharing a TypeScript-source package was not run. The source-level statements above are per-tool. The first scaffold step should prove it.
- **Which SDK 58 dependencies need `allowBuilds` entries.** pnpm prompts for these at install.
- **Which React Native libraries fail under isolated installs.** Expo gives no list [S1].
- **TypeScript version alignment.** The Expo template uses ~6.0.3 [S7] and `create-next-app` 16.4.5 uses `^5` [S6b]. Next.js does not declare a TypeScript peer [S5]. I could not confirm Next.js 16.4 against TypeScript 6 from documentation, and TypeScript 7.0.2 compatibility with either tool is unknown. If a single catalog version causes trouble, TypeScript can differ per workspace.
- **Whether `eas.json` accepts pnpm 12.** The field exists [S21], but accepted versions are not documented on that page. I also did not confirm which image EAS selects by default for SDK 58.
- **Whether `EXPO_PUBLIC_` references inline in workspace packages** [S25]. Avoided by design.
- **`getClaims()` when offline on mobile.** The quickstart uses it [S30]. It verifies against cached public keys on asymmetric projects [S29], but I did not confirm behaviour with no network and no cache, so offline gating here relies on the stored session.
- **PKCE on mobile.** Supabase's deep-linking page does not mention it [S34]. Only relevant if OAuth or magic links are adopted.
- **Supabase client source was read from `master`,** not the 2.119.0 tag [S48][S49][S50]. Behaviour may differ slightly from the published release.
- **Other sync tools** (WatermelonDB, ElectricSQL, Turso offline sync, RxDB, LiveStore) were not evaluated, since the single-writer argument applies equally to them.

## Sources

Registry and manifest data retrieved 2026-11-09. Pages without a version number are labelled with what the page shows.

| # | Source | Applies to |
| --- | --- | --- |
| S1 | [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/) ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/monorepos.mdx)) | Examples target SDK 58, notes for SDK 52 to 55 |
| S2 | [Expo: Metro bundler reference](https://docs.expo.dev/versions/latest/config/metro/) | v58.0.0 |
| S3 | [Next.js: transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages) | Updated 2026-05-27, Next.js 16 docs |
| S4 | [Next.js: turbopack config](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) | Updated 2026-09-24, history through 16.4.0 |
| S5 | [npm registry](https://www.npmjs.com/), `npm view` | 2026-11-09 |
| S6 | [Expo bundledNativeModules.json](https://cdn.jsdelivr.net/npm/expo@58.0.23/bundledNativeModules.json) | expo 58.0.23 |
| S6b | [create-next-app dist](https://cdn.jsdelivr.net/npm/create-next-app@16.4.5/dist/index.js) | 16.4.5 |
| S7 | [expo-template-default](https://www.npmjs.com/package/expo-template-default) | `sdk-58` tag |
| S8 | [pnpm: node_modules settings](https://pnpm.io/settings/node-modules) | Current docs, pnpm 12.x |
| S9 | [pnpm: settings](https://pnpm.io/settings) | Current docs, pnpm 12.x |
| S10 | [pnpm: build settings](https://pnpm.io/settings/build) | Current docs, pnpm 12.x |
| S11 | [pnpm 11.0 release](https://pnpm.io/blog/releases/11.0) | 11.0, via search result text |
| S12 | [pnpm: catalogs](https://pnpm.io/catalogs) | Current docs |
| S13 | [pnpm 12.0 release](https://pnpm.io/blog/releases/12.0) | 12.0, via search result text |
| S14 | [pnpm: global virtual store](https://pnpm.io/global-virtual-store) | Current docs |
| S15 | [Bun: isolated installs](https://bun.com/docs/pm/isolated-installs) | Current docs, `configVersion` 1 |
| S16 | [pnpm: filtering](https://pnpm.io/filtering) | Current docs |
| S17 | [Yarn: yarnrc](https://yarnpkg.com/configuration/yarnrc) | Current docs (Berry) |
| S18 | [Turborepo: internal packages](https://turborepo.dev/docs/core-concepts/internal-packages), [Next.js guide](https://turborepo.dev/docs/guides/frameworks/nextjs) | Current docs, turbo 2.x |
| S19 | [Turborepo: add to existing repo](https://turborepo.dev/docs/getting-started/add-to-existing-repository) | Current docs, turbo 2.x |
| S20 | [EAS: build infrastructure](https://docs.expo.dev/build-reference/infrastructure/) | Images listed 2026-11-09 |
| S21 | [EAS: eas.json reference](https://docs.expo.dev/eas/json/) | Current docs |
| S22 | [EAS: build from a monorepo](https://docs.expo.dev/build-reference/build-with-monorepos/) | Current docs |
| S23 | [byCedric/expo-monorepo-example](https://github.com/byCedric/expo-monorepo-example) | Expo SDK 54. Staff example, not official docs. |
| S24 | [Expo: Using Supabase](https://docs.expo.dev/guides/using-supabase/) ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-supabase.mdx)) | Current docs, SDK 58 era |
| S25 | [Expo: environment variables](https://docs.expo.dev/guides/environment-variables/) | Current docs |
| S26 | [Expo: SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) | v58.0.0 |
| S27 | [Expo: SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/sqlite.mdx)) | v58.0.0 |
| S28 | [Supabase: user sessions](https://supabase.com/docs/guides/auth/sessions) | Current docs |
| S29 | [Supabase: creating a server-side client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) ([source](https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/auth/server-side/creating-a-client.mdx)) | Current docs, Next.js 16 `proxy.ts`, @supabase/ssr 0.12.x |
| S30 | [Supabase: React Native quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native) ([client](https://raw.githubusercontent.com/supabase/supabase/master/examples/auth/quickstarts/react-native/lib/supabase.ts), [sign-in](https://raw.githubusercontent.com/supabase/supabase/master/examples/auth/quickstarts/react-native/components/Auth.tsx)) | `master`, 2026-11-09 |
| S31 | [Supabase: startAutoRefresh](https://supabase.com/docs/reference/javascript/auth-startautorefresh) | supabase-js v2 |
| S32 | [Supabase: Expo tutorial, LargeSecureStore](https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/getting-started/tutorials/with-expo-react-native.mdx) | `master`, 2026-11-09 |
| S33 | [Supabase: generating types](https://supabase.com/docs/guides/api/rest/generating-types) | Current docs |
| S34 | [Supabase: native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) | Current docs |
| S35 | [Supabase: signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp) | supabase-js v2 |
| S36 | [TanStack Query: mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) | v5 |
| S37 | [TanStack Query: persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) | v5 |
| S38 | [TanStack Query: createAsyncStoragePersister](https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister) | v5 |
| S39 | [TanStack Query: React Native](https://tanstack.com/query/latest/docs/framework/react/react-native) | v5 |
| S40 | [Legend-State: Supabase plugin](https://legendapp.com/open-source/state/v3/sync/supabase/) | v3 (Beta) |
| S41 | [PowerSync: React Native and Expo SDK](https://docs.powersync.com/client-sdk-references/react-native-and-expo) | Current docs, @powersync/react-native 2.4.0 on npm |
| S42 | [PowerSync: Supabase integration](https://docs.powersync.com/integration-guides/supabase-+-powersync) | Current docs |
| S43 | [PowerSync: pricing](https://www.powersync.com/pricing) | 2026-11-09 |
| S44 | [Expo: local-first](https://docs.expo.dev/guides/local-first/) | Modified 2026-08-27 |
| S45 | [Expo: Network](https://docs.expo.dev/versions/latest/sdk/network/) | v58.0.0 |
| S46 | [Supabase: upsert](https://supabase.com/docs/reference/javascript/upsert) | supabase-js v2 |
| S47 | [PostgREST: transactions](https://docs.postgrest.org/en/stable/references/transactions.html) | `stable` docs |
| S48 | [auth-js GoTrueClient.ts](https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/src/GoTrueClient.ts) | `master`, 2026-11-09 |
| S49 | [postgrest-js PostgrestBuilder.ts](https://github.com/supabase/supabase-js/blob/master/packages/core/postgrest-js/src/PostgrestBuilder.ts) | `master`, 2026-11-09 |
| S50 | [supabase-js SupabaseClient.ts](https://github.com/supabase/supabase-js/blob/master/packages/core/supabase-js/src/SupabaseClient.ts) | `master`, 2026-11-09 |
| S51 | [Expo: BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/) | v58.0.0 |
