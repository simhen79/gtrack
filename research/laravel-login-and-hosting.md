# Laravel login, session lifetime, App Store account deletion, and hosting near Frankfurt

Researched 2026-11-10. I did not build or run anything for this note. `[S#]` markers point to the source table at the end. Claims marked **Inference** are my own reasoning from the sources; no source states them. Prices are list prices shown on the provider pages on 2026-11-10, excluding VAT.

Context: a Laravel 13 app (Inertia + React web, plus a JSON API for an Expo app) on Postgres. Accounts are invite-only, sign-in is by a one-time email code, and Google and Apple sign-in come later through Socialite. The database queue driver runs about 3 workers, with jobs of up to 240 s and `retry_after` set to 300 s. There are single-digit users, and the target region is Frankfurt.

Versions checked: `laravel/framework` v13.40.0 (2026-11-03) and `laravel/sanctum` v4.3.3 (2026-07-21), which requires `illuminate/* ^11|^12|^13` [S1][S2].

## Summary

| # | Question | Answer | Recommendation |
| --- | --- | --- | --- |
| 1 | Is Sanctum token expiry sliding? | No. Both checks are absolute. `sanctum.expiration` counts from `created_at`, and `expires_at` is a fixed timestamp. | Leave `expiration` null and add an idle check with `Sanctum::authenticateAccessTokensUsing` on `last_used_at`. Add your own prune task. |
| 2 | Is `SESSION_LIFETIME` idle-based? | Yes. The database handler expires a session by `last_activity`, and the cookie expiry is reset to now + lifetime on every response. | Set `SESSION_LIFETIME=129600` (90 days) and `expire_on_close=false`. Don't use remember-me, because it adds a separate 400-day cookie. |
| 3 | Is email OTP login first-party? | No. Fortify and the starter kits have password, TOTP 2FA and passkeys, but no email code login. Only the WorkOS variant has "Magic Auth". | Build it with `spatie/laravel-one-time-passwords` (1.1.2, supports Laravel 13). Write your own controllers for Inertia and the API. |
| 4 | Does Apple 5.1.1(v) apply to invite-only accounts? | The wording applies to apps that "support account creation". Apple's FAQ doesn't cover accounts created by an admin. Sign in with Apple apps "should" revoke tokens. | Ship an in-app "Delete account" action anyway. It's cheap and removes the review risk. Revoke the Apple token when the account is deleted, once Apple sign-in exists. |
| 5 | Where to host near Frankfurt with 240 s jobs? | Laravel Cloud Flex managed queues stop at 90 s. Pro managed queues (Growth plan) and self-managed `queue:work` on an always-on cluster have no stated limit. | Forge Hobby + Hetzner CX23 (Nuremberg/Falkenstein), with Postgres on the same server, at about $12 + €5.99 a month. Next choice: Laravel Cloud Starter at about $30 a month. |

## 1. Sanctum mobile tokens: absolute expiry, and how to make it sliding

### What Sanctum does

- The docs say: "By default, Sanctum tokens never expire". The `expiration` config "defines the number of minutes until an issued token will be considered expired". A per-token expiry can instead be passed as the third argument of `createToken` [S3].
- The guard source (`Guard::isValidAccessToken`, 4.x) shows that both checks are absolute [S4]:

  ```php
  $isValid =
      (! $this->expiration || $accessToken->created_at->gt(now()->subMinutes($this->expiration)))
      && (! $accessToken->expires_at || ! $accessToken->expires_at->isPast())
      && $this->hasValidProvider($accessToken->tokenable);

  if (is_callable(Sanctum::$accessTokenAuthenticationCallback)) {
      $isValid = (bool) (Sanctum::$accessTokenAuthenticationCallback)($accessToken, $isValid);
  }
  ```

  The comment in the config file says `expiration` "will override any values set in the token's "expires_at" attribute" [S5]. In the code, both conditions must pass.
- `last_used_at` is written **after** validation, with `forceFill(['last_used_at' => now()])->save()`. The write happens on every token-authenticated request and is not throttled [S4]. The guard receives `config('sanctum.last_used_at', true)` as `trackLastUsedAt` [S6]. That config key isn't in the published config file or the docs [S3][S5], but setting it to `false` turns the write off.
- `sanctum:prune-expired` deletes rows only by `expires_at`, or by `created_at` + `sanctum.expiration` [S7]. It never looks at `last_used_at`.

### Getting "renew on use, expire after 90 days unused"

`Sanctum::authenticateAccessTokensUsing(callable $callback)` is public API. Its callback receives `($accessToken, $isValid)` [S4][S8]. Because `last_used_at` is updated after validation, the callback sees the previous use. That is the value an idle check needs.

```php
// config/sanctum.php: 'expiration' => null  (otherwise created_at caps the lifetime)

// AppServiceProvider::boot()
Sanctum::authenticateAccessTokensUsing(
    fn (PersonalAccessToken $token, bool $isValid) => $isValid
        && ($token->last_used_at ?? $token->created_at)->gt(now()->subDays(90))
);

// routes/console.php: Sanctum's prune command won't remove idle tokens
Schedule::call(fn () => PersonalAccessToken::query()
    ->whereRaw('coalesce(last_used_at, created_at) < ?', [now()->subDays(90)])
    ->delete())->daily();
```

Gotchas:

- If `sanctum.expiration` is set, it still applies first and makes the expiry absolute again. Keep it `null`.
- The callback isn't documented on the docs page [S3], but it is a public static method in `Sanctum.php` [S8] and the guard calls it [S4].
- Every API request writes `last_used_at`. For single-digit users this doesn't matter. **Inference:** if you want fewer writes, set `sanctum.last_used_at=false` and update the column yourself in a `TokenAuthenticated` listener, only when the stored value is more than a day old. The idle check then has a resolution of one day.
- Another approach is to listen for `TokenAuthenticated` and push `expires_at` forward to now + 90 days. That lets the built-in `sanctum:prune-expired` remove idle tokens, but it adds a second write on each request. **Inference:** the callback approach above is simpler.

## 2. Web session: `SESSION_LIFETIME` is idle-based

- The framework config comment says lifetime is "the number of minutes that you wish the session to be allowed to remain idle before it expires". The defaults are `'lifetime' => (int) env('SESSION_LIFETIME', 120)` and `'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false)` [S9].
- In the database driver, `DatabaseSessionHandler::expired()` compares `last_activity` with now minus lifetime. Each write stores `last_activity => currentTime()`, and `gc()` deletes rows where `last_activity <= now - lifetime` [S10]. The default lottery runs garbage collection on 2 of every 100 requests [S9].
- `StartSession` sets the cookie expiry to `now() + lifetime` on **each** response. If `expire_on_close` is true, the cookie expiry is `0`, which makes it a browser-session cookie [S11]. Server and cookie both slide, so `SESSION_LIFETIME=129600` (90 days) behaves as "90 days since the last visit".
- `expire_on_close` must stay `false`. Otherwise mobile browsers drop the cookie when the browser closes, whatever the lifetime is [S11].
- Remember-me: `SessionGuard::$rememberDuration` defaults to 576000 minutes (400 days). A guard can override it with `'remember' => <minutes>` in `config/auth.php` [S12][S13]. The recaller cookie is a separate cookie and silently logs the user back in after the session expires. **Inference:** with a sliding 90-day session, call `Auth::login($user)` without `remember: true`, so the 90-day rule is the only one in force.

## 3. Passwordless email one-time-code login

- **Fortify (Laravel 13 docs):** features are registration, password reset, email verification, password confirmation, two-factor authentication (TOTP from an authenticator app) and passkeys (`Features::passkeys()`) [S14]. There is no email code or magic-link feature.
- **Starter kits (React):** they use Fortify for "login, registration, password reset, email verification, and more" [S15]. Only the **WorkOS AuthKit** variant offers "Email based 'Magic Auth'". That needs a WorkOS account, which is free up to 1M monthly active users [S15]. It replaces Laravel's own user and password authentication with WorkOS, and the WorkOS integration covers the web side only. **Inference:** for a Sanctum-issued mobile token you would still write the code exchange yourself.
- **Packages** (Packagist, checked 2026-11-10):

| Package | Latest | Laravel 13 | Notes |
| --- | --- | --- | --- |
| `spatie/laravel-one-time-passwords` | 1.1.2 (2026-07-22) | Yes (`illuminate/contracts ^12.0\|^13.0`, PHP ^8.4) | About 979k installs. `$user->sendOneTimePassword()` and `$user->attemptLoginUsingOneTimePassword($code)` return a result with `isOk()` [S16][S17]. Config defaults: 2-minute expiry, one active code per user, `enforce_same_origin => true` (IP and user agent), and 5 attempts per user per 60 s [S18]. Ships a Livewire component, but the methods work from any controller. |
| `benbjurstrom/otpz` | v0.7.0 (2026-04-15) | Yes | Pre-1.0. |
| `cesargb/laravel-magiclink` | v2.29.0 (2026-09-28) | Yes | Sends magic links, not codes. |

Recommendation: use the Spatie package from two thin controllers, one for the Inertia login (`Auth::login`) and one for the API (`createToken`).

- Admin-only users fit naturally: send a code only when a user with that email exists, and always return the same response so the endpoint doesn't reveal which emails exist. **Inference:** this is how I'd handle the invite-only case; Spatie's docs don't cover it.
- The defaults have two catches:
  - **Inference:** `enforce_same_origin` binds the code to the IP and user agent that requested it. A phone moving between Wi-Fi and mobile data between the two calls would then fail. Consider setting `origin_enforcer` to `DoNotEnforceOrigin` [S18].
  - **Inference:** the 2-minute expiry is short for checking email. 10 minutes is a common choice (`default_expires_in_minutes`).
- Add your own `RateLimiter` on the "send code" endpoint. **Inference:** the package's rate limit only covers *consuming* a code [S18].

## 4. Apple: account deletion (5.1.1(v)) and Sign in with Apple revocation

Guideline 5.1.1(v), verbatim [S19]:

> **(v) Account Sign-In:** If your app doesn't include significant account-based features, let people use it without a login. If your app supports account creation, you must also offer account deletion within the app. …

From Apple's "Offering account deletion in your app" page [S20]:

- "Apps submitted to the App Store that support account creation must also let people initiate deletion of their account within the app."
- "Everyone should be able to delete their accounts, regardless of where they're located."
- FAQ: creating an account by linking out to a browser still requires in-app deletion. Accounts created automatically ("guest") must also be deletable.
- The page has **no** FAQ about accounts created by an organization or an admin. Deletion "may take time" if the person is told how long. A website step is allowed if the app "include[s] a link directly to the page on your website". Outside highly regulated industries, apps "should not require people to make a phone call, send an email" or go through other support flows.
- Sign in with Apple: "Apps that support Sign in with Apple should use the Sign in with Apple REST API to revoke user tokens." Apple uses "should", not "must".

Guideline 4.8: an app that uses Google sign-in for the primary account must also offer an equivalent privacy-preserving login service, such as Sign in with Apple. There is an exemption when the app "exclusively uses your company's own account setup and sign-in systems" [S19]. The email code login on its own falls under that exemption. Adding Google brings 4.8 into play, and the plan to add Apple at the same time satisfies it.

**Inference:**

- A strict reading says an app where accounts can't be created in-app doesn't "support account creation", so 5.1.1(v) wouldn't apply.
- Apple's guidance is broad, though: guest accounts and accounts created on the web are both covered. Once Sign in with Apple exists, a reviewer can easily see the app as creating or linking accounts.
- An in-app "Delete account" action costs very little: it deletes the user, revokes their tokens and calls Apple's revoke endpoint. It removes a likely rejection.

Recommendation: add the deletion action, and revoke the Apple token when the account is deleted once Apple sign-in exists.

## 5. Hosting near Frankfurt with 240 s queue jobs

### Laravel Cloud

- Regions include EU Central (Frankfurt) [S21].
- Plans [S21][S22]:

  | Plan | Price | Includes |
  | --- | --- | --- |
  | Starter | $5/mo with $5 usage credit | Flex only, max 2 GiB per instance, no autoscaling, 1 managed queue, task scheduler |
  | Growth | $20/mo | Adds Pro compute and worker clusters |

- Managed queues [S23]:
  - **Flex** "Job runtime: Up to 90 seconds". When a Flex worker must stop, it has 90 s to finish the current job.
  - **Pro** "No fixed limit". Pro workers are always on (at least one worker) and get one hour to finish when stopped. Pro is available on Growth and higher plans.
  - "Run jobs that may exceed 90 seconds on Pro."
  - When a managed queue exists, Cloud sets `QUEUE_CONNECTION=cloud`. Jobs that previously went through the `database` driver are then routed to the managed queue.
- Self-managed `queue:work` can run as an App cluster "background process" (all plans) or on a worker cluster (Growth and up) [S24]. The docs give no per-job runtime limit for these. The App cluster must not scale to zero, or the docs say "any job still running at that point is interrupted" [S23][S25].
- Old queue clusters were sunset on 2026-09-30 [S24].
- Compute rates at the default (US) region on the pricing page: Flex 512 MiB costs $6/mo, Flex 1 GiB $12/mo and Pro 4 GiB $32/mo. Always-on resources stop billing after 28 days a month [S21][S22]. Frankfurt rates sit behind a region selector that I couldn't read, so treat these as approximate.
- Serverless Postgres is Neon-backed and billed per second while awake. In the docs' US East (Ohio) example it costs $0.106 per CU-hour and $0.50 per GB-month. It accepts up to 1 CU on Starter [S22].
- **Gotcha (Inference):** with the `database` queue driver, 3 workers poll Postgres every `--sleep` seconds (3 s in the docs examples [S26]). The database never sits idle long enough to scale to zero. At 0.25 CU and the 672 h cap, that is about $17.80 a month at the Ohio rate.
- Smallest viable setup (about $30/mo): Starter, Flex 1 GiB App with scale-to-zero off, running `queue:work --timeout=240` ×3 and the scheduler, plus an always-awake Postgres. The sum is $5 + $12 + about $18 + storage − $5 credit. Running Pro managed queues on Growth instead adds at least $20/mo for the plan plus an always-on Pro worker.

### Forge + a VPS

- Forge pricing [S27]:

  | Plan | Price | Servers |
  | --- | --- | --- |
  | Hobby | $12/mo | Unlimited Laravel VPS servers plus **1 external server** |
  | Growth | $19/mo | Unlimited servers |

- Supported providers include Hetzner Cloud and DigitalOcean, and you can bring your own server [S28].
- Forge runs queue workers under Supervisor, which restarts them if they crash, and has a scheduler page [S29]. Laravel's queue docs say `--timeout` should be "at least several seconds shorter than your `retry_after`", and Supervisor's `stopwaitsecs` should exceed your longest job [S26]. For this app that means `--timeout=240`, `retry_after=300` and `stopwaitsecs` of at least 300.
- Laravel VPS is DigitalOcean-backed and billed hourly through Forge. The docs page lists no prices or regions [S30].
- **Hetzner** prices (excl. VAT, IPv4 included) [S31][S32]:

  | Plan | Range | Specs | Price | Locations |
  | --- | --- | --- | --- | --- |
  | CX23 | Cost-Optimized | 2 vCPU / 4 GB / 40 GB | €5.99/mo | NBG/FSN/HEL |
  | CAX11 (Arm) | Cost-Optimized | 2 vCPU / 4 GB | €6.49/mo | NBG/FSN/HEL |
  | CPX02 | Regular Performance | 1 vCPU / 1 GB | €6.49/mo | FSN1/NBG1 |

  On 2026-11-10 these pages showed every plan as "currently unavailable", which appears to be a capacity limit. Check availability before relying on it.
- **DigitalOcean** Basic droplets [S33]:

  | Size | Price |
  | --- | --- |
  | 1 GiB | $6/mo |
  | 2 GiB | $12/mo |
  | 2 vCPU / 4 GiB | $24/mo |

  A Frankfurt datacenter is listed.
- Smallest viable setup: Forge Hobby $12 + Hetzner CX23 €5.99, with Postgres, PHP-FPM, Nginx, 3 workers and cron all on one 4 GB server. That comes to roughly **$19/mo**. With DigitalOcean Frankfurt 2 GiB it is $12 + $12 = **$24/mo**.
- **Inference:** 1 GB of RAM is too tight for Postgres plus PHP plus 3 workers. Pick 2 GB or more.

### Fly.io (`fra`)

- Machines [S34]:

  | Machine | Price |
  | --- | --- |
  | `shared-cpu-1x` 512 MB | $3.69/mo (US) |
  | `shared-cpu-1x` 1 GB | $6.70/mo (US), **$7.73/mo in `fra`** |

- There is no free tier. Bills under $5 a month are waived for personal organizations.
- Managed Postgres starts at **$38/mo** for the Basic plan [S34].
- Fly has no built-in scheduler. **Inference:** run `schedule:work` and `queue:work` as process groups or extra Machines. Fly doesn't limit how long a job can run.
- Smallest viable setup: about $8–16 for compute. Add $38 for Fly Managed Postgres, or Postgres from elsewhere. That totals about $16–55/mo.

### Render (Frankfurt) and Railway

- **Render** has a Frankfurt region [S35]. Free web services spin down after 15 minutes. Free Postgres expires after 30 days, and background workers and cron jobs can't use free instances [S36].
- Render paid prices [S37]:

  | Item | Price |
  | --- | --- |
  | Hobby workspace | $0 |
  | Web Starter 512 MB | $7/mo |
  | Background worker 512 MB | $7/mo |
  | Postgres 256 MB | $6/mo |
  | Postgres 1 GB | $19/mo |

  Render has no native PHP runtime, so the app would need Docker. Smallest viable setup: about **$20/mo**.
- **Railway** regions are US West, US East, EU West (Amsterdam) and Singapore, with **no Frankfurt** [S38]. The Hobby plan is $5/mo including $5 of usage. RAM costs about $10 per GB-month and vCPU about $20 per vCPU-month [S39].
- **Inference:** web, worker and Postgres at about 0.5 GB each comes to about $15–20/mo.

### Postgres options

| Option | Cost | Fit |
| --- | --- | --- |
| Neon Free, `aws-eu-central-1` (Frankfurt) [S40] | $0, but only 100 CU-hours a month per project and 1 GB storage. Compute always scales to zero after 5 minutes idle, and that can't be turned off [S41]. | **Poor with the database queue driver (Inference).** Polling keeps compute awake: 0.25 CU × about 730 h ≈ 182 CU-h, which is over the 100 CU-h allowance. Launch plan: $0.106 per CU-hour, about $19/mo always-on at 0.25 CU, plus $0.35 per GB-month. |
| Postgres on the same VPS (Forge) | $0 extra | Best for this size. Forge's database backups need setting up (Forge's database pages [S42]). |
| Laravel Cloud Serverless Postgres | About $18/mo always-awake (Ohio rate) | Same Neon scale-to-zero problem as Neon Free. |

**Inference:** if you want a serverless Postgres to sleep, move the queue (and cache) off the database. On a VPS, a local Redis does this. On Laravel Cloud, a Flex Valkey does it, at about $6/mo always-on.

### Recommendation

| Option | Monthly cost | Notes |
| --- | --- | --- |
| **Forge Hobby + Hetzner CX23** (Nuremberg or Falkenstein) | ≈ $19 | Postgres, 3 workers under Supervisor (`--timeout=240`, `stopwaitsecs=330`) and the Forge scheduler, all on one server. Cheapest. No limits on job runtime. One server and one region. If Hetzner capacity is unavailable, swap in DigitalOcean Frankfurt 2 GiB (≈ $24). |
| Laravel Cloud Starter | ≈ $30 | Least operations work. The App cluster must stay awake, and you must not add a managed queue, because Flex queues stop at 90 s and it reroutes the default connection. |
| Render Frankfurt | ≈ $20 | Fully managed. Needs a Dockerfile. |
| Fly.io / Railway | — | No advantage here. Fly's managed Postgres is expensive, and Railway has no Frankfurt region. |

## Not verified

- Laravel Cloud's Frankfurt-specific rates. The pricing page selector didn't render as text, so the Cloud numbers above are US rates.
- Whether Hetzner's "currently unavailable" status was temporary capacity or a quirk of the page.
- Apple's position on accounts created only by an admin. No Apple source addresses it. Ask App Review if you want certainty.
- Render and Fly per-region price differences, apart from the Fly `fra` 1 GB figure.

## Sources

| # | Source | Accessed |
| --- | --- | --- |
| S1 | GitHub API, laravel/framework latest release (v13.40.0, 2026-11-03) | 2026-11-10 |
| S2 | GitHub API, laravel/sanctum latest release (v4.3.3, 2026-07-21); `composer.json` on the 4.x branch | 2026-11-10 |
| S3 | https://laravel.com/docs/13.x/sanctum (Token Expiration, Mobile Application Authentication) | 2026-11-10 |
| S4 | https://github.com/laravel/sanctum/blob/4.x/src/Guard.php (`isValidAccessToken`, `updateLastUsedAt`) | 2026-11-10 |
| S5 | https://github.com/laravel/sanctum/blob/4.x/config/sanctum.php | 2026-11-10 |
| S6 | https://github.com/laravel/sanctum/blob/4.x/src/SanctumServiceProvider.php (`createGuard`) | 2026-11-10 |
| S7 | https://github.com/laravel/sanctum/blob/4.x/src/Console/Commands/PruneExpired.php | 2026-11-10 |
| S8 | https://github.com/laravel/sanctum/blob/4.x/src/Sanctum.php | 2026-11-10 |
| S9 | https://github.com/laravel/framework/blob/13.x/config/session.php | 2026-11-10 |
| S10 | https://github.com/laravel/framework/blob/13.x/src/Illuminate/Session/DatabaseSessionHandler.php | 2026-11-10 |
| S11 | https://github.com/laravel/framework/blob/13.x/src/Illuminate/Session/Middleware/StartSession.php | 2026-11-10 |
| S12 | https://github.com/laravel/framework/blob/13.x/src/Illuminate/Auth/SessionGuard.php | 2026-11-10 |
| S13 | https://github.com/laravel/framework/blob/13.x/src/Illuminate/Auth/AuthManager.php | 2026-11-10 |
| S14 | https://laravel.com/docs/13.x/fortify | 2026-11-10 |
| S15 | https://laravel.com/docs/13.x/starter-kits (Authentication, WorkOS AuthKit) | 2026-11-10 |
| S16 | https://packagist.org/packages/spatie/laravel-one-time-passwords (1.1.2, 2026-07-22) | 2026-11-10 |
| S17 | https://github.com/spatie/laravel-one-time-passwords README | 2026-11-10 |
| S18 | https://github.com/spatie/laravel-one-time-passwords/blob/main/config/one-time-passwords.php | 2026-11-10 |
| S19 | https://developer.apple.com/app-store/review/guidelines/ (5.1.1, 4.8) | 2026-11-10 |
| S20 | https://developer.apple.com/support/offering-account-deletion-in-your-app/ | 2026-11-10 |
| S21 | https://laravel.com/cloud/pricing | 2026-11-10 |
| S22 | https://laravel.com/cloud/docs/pricing | 2026-11-10 |
| S23 | https://laravel.com/cloud/docs/queues | 2026-11-10 |
| S24 | https://laravel.com/cloud/docs/workers | 2026-11-10 |
| S25 | https://laravel.com/cloud/docs/compute (Scale to zero) | 2026-11-10 |
| S26 | https://laravel.com/docs/13.x/queues (Worker Sleep Duration, Job Expirations and Timeouts, Supervisor Configuration) | 2026-11-10 |
| S27 | https://laravel.com/forge/pricing | 2026-11-10 |
| S28 | https://laravel.com/forge/docs/server-providers.md | 2026-11-10 |
| S29 | https://laravel.com/forge/docs/sites/queues.md; https://laravel.com/forge/docs/resources/scheduler.md (listed in the Forge docs index) | 2026-11-10 |
| S30 | https://laravel.com/forge/docs/servers/laravel-vps | 2026-11-10 |
| S31 | https://www.hetzner.com/cloud/cost-optimized | 2026-11-10 |
| S32 | https://www.hetzner.com/cloud/regular-performance | 2026-11-10 |
| S33 | https://www.digitalocean.com/pricing/droplets | 2026-11-10 |
| S34 | https://docs.fly.io/about/pricing | 2026-11-10 |
| S35 | https://render.com/docs/regions | 2026-11-10 |
| S36 | https://render.com/docs/free | 2026-11-10 |
| S37 | https://render.com/pricing | 2026-11-10 |
| S38 | https://docs.railway.com/reference/regions | 2026-11-10 |
| S39 | https://railway.com/pricing | 2026-11-10 |
| S40 | https://neon.com/docs/introduction/regions | 2026-11-10 |
| S41 | https://neon.com/pricing | 2026-11-10 |
| S42 | https://laravel.com/forge/docs/resources/databases.md (listed in the Forge docs index, not opened) | 2026-11-10 |

## Cloudways

Added 2026-11-10, after Cloudways was chosen. This changes the database to MySQL or MariaDB, because Cloudways servers ship no Postgres. Users are in South Africa. `[C#]` markers point to the source table at the end of this section.

**Access caveat.** The Cloudways knowledge base (support.cloudways.com) and the feedback forum returned HTTP 403 to my fetcher, so I couldn't read them directly. Claims marked **(KB, via search)** come from search-engine extracts of those KB articles. They are not verbatim reads, so check them in the KB or the dashboard. Everything else comes from pages I fetched.

### Summary

| Need | Cloudways answer |
| --- | --- |
| South African region | **Yes.** Vultr Johannesburg (added 2024-05-09) [C1], AWS Cape Town [C2][C3], and GCP Johannesburg (KB, via search) [C4]. Vultr is cheapest because its price is the same in every region [C5]. |
| Frankfurt | DigitalOcean, Vultr, Linode, AWS and GCP all list it (KB, via search) [C4]. AWS Micro in Frankfurt costs $23.72/mo [C2]. |
| Database | MariaDB 10.11 by default. MySQL 8.4 can be chosen only when a Debian 12 server is launched, and the choice is permanent [C6]. |
| PHP | 8.3 and 8.4 are available [C1][C7]. Use **8.4**, because `spatie/laravel-one-time-passwords` needs PHP ^8.4 (section 3). |
| Queue workers | Supervisord jobs are configured in the panel, with process count, timeout, sleep and tries. The guide assumes the **Redis** driver (KB, via search) [C8]. `stopwaitsecs` isn't exposed anywhere I could see. |
| Scheduler | Cron Job Management → Advanced, with an every-minute `schedule:run` (KB, via search) [C9]. |
| Deploy | Git pull over SSH, plus SSH/SFTP and Composer [C7][C9]. No zero-downtime release model is documented. |
| Backups / SSL | Scheduled server backups go off-site, are mandatory, and cost $0.033/GB [C5][C10]. Let's Encrypt is free [C7][C11]. |

### 1. Regions and smallest-plan prices

Cloudways has five providers: DigitalOcean, Vultr, Linode, AWS and Google Cloud. Its pricing page counts 9, 30, 25, 28 and 28 locations respectively [C5]. The data-center page has a filter but showed no location names to my fetcher [C12].

| Provider | South Africa | Frankfurt | Smallest plan |
| --- | --- | --- | --- |
| **Vultr** | **Johannesburg**. Changelog 2024-05-09: "Africa - Johannesburg" is a new Vultr region [C1]. One Cloudways page marks Johannesburg "Limited availability" for the big HF 58 GB size (via search) [C13]. | Yes (KB, via search) [C4] | Micro 1 GB / 1 vCPU / 25 GB is **$14/mo**. "starts at $14/month for a 1GB standard server" [C14]. |
| **AWS** | **Cape Town** ("Africa – Cape Town") [C3] | Yes [C3] | Micro (T3, 1 GB / 2 vCPU) costs **$26.96/mo in Cape Town** and **$23.72/mo in Frankfurt**, excluding storage and bandwidth. These prices are from a post updated 2024-07-01 [C2]. |
| **GCP** | **Johannesburg** is on the KB's GCE list (KB, via search) [C4]. The 2026 expansion post mentions "Johannesburg" for African audiences but doesn't name the provider [C15]. | Yes (KB, via search) [C4] | Not shown on the pages I could read. Price varies by region [C5]. |
| **DigitalOcean** | None | Yes [C4][C14] | Micro 1 GB is **$14/mo**. Small 2 GB / 1 vCPU / 50 GB is **$28/mo** [C5]. |
| **Linode** | None in the lists I saw | Yes (KB, via search) [C4] | Not shown. |

- The pricing FAQ says: "DigitalOcean, Vultr, and Linode charge the same price no matter where your server is hosted." AWS and GCP prices vary by region [C5].
- The pricing page lists Micro $14, Small 2 GB $28, Small+ 2 GB/2 vCPU $37 and Medium 4 GB $54 [C5]. The page doesn't say which provider the table belongs to. **Inference:** with flat pricing it should apply to Vultr Johannesburg too, but check the launch screen.
- Flexible has a 5-day free trial with no card, excluding AWS and GCP [C5]. A Black Friday code gives 80% off the first 2 months [C5][C7].
- **Inference:** 1 GB is too small for MariaDB, PHP-FPM, 3 workers and an occasional `npm run build`. Pick the 2 GB Small plan ($28/mo).

### 2. Database engine

- Cloudways offers MariaDB 10.11, which is the default, and MySQL 8.4 LTS. You choose MySQL 8.4 when you launch a new Debian 12 server. "Once the server is created with MySQL or MariaDB, users cannot switch between them." You can clone or stage only to a server with the same engine [C6].
- Versions are upgraded from the server's Packages tab. Downgrades aren't supported, for example MariaDB 10.11 to 10.6 (KB, via search) [C16]. The changelog shows MariaDB 11.4 supported from 2025-07-01, in a Magento context [C1].
- **Laravel 13 minimums:** MariaDB 10.3+ and MySQL 5.7+ [C17]. Both Cloudways engines meet them.
- **Database queue driver:** `DatabaseQueue::getLockForPopping` uses `FOR UPDATE SKIP LOCKED` on MySQL ≥ 8.0.1 and MariaDB ≥ 10.6.0 [C18]. Both Cloudways engines get it, so 3 workers won't block each other.

Differences that matter for Laravel:

| Feature | MySQL 8.4 | MariaDB 10.11 |
| --- | --- | --- |
| `json` column | Native binary JSON, compared by value [C19] | "an alias for LONGTEXT COLLATE utf8mb4_bin" with an automatic `JSON_VALID` check. Values are "compared as strings" [C19]. |
| Indexing JSON or `whereJsonContains` | Multi-valued indexes (`CAST(... AS UNSIGNED ARRAY)`) are used by `JSON_CONTAINS`, `MEMBER OF` and `JSON_OVERLAPS` [C20] | **Inference:** no equivalent. Index a `virtualAs`/`storedAs` generated column instead [C21]. |
| Functional or expression indexes | Supported, for example `INDEX ((ABS(col1)))` [C20] | The `CREATE INDEX` syntax accepts only `col_name [(length)]` key parts [C22]. **Inference:** use a generated column plus an index. |
| Partial (`WHERE`) indexes | **None** [C20] | **None** [C22] |
| Vector columns and indexes | No | MariaDB **11.7+** only [C21]. Not on 10.11. |
| `->instant()`, `->lock()`, `->inplace()` | MySQL only [C21] | — |
| `invisible`, `after`, `first`, `virtualAs`, `useCurrentOnUpdate`, fullText | Both [C21] | Both [C21] |

**Inference:** a partial unique index from a Postgres design, such as "one active row per user", has no direct equivalent on either engine. Common workarounds are a generated column that is NULL for inactive rows, with a unique index on it, or enforcing the rule in application code. The Laravel migrations docs list no check-constraint builder method [C21], so CHECK constraints need `DB::statement`.

### 3. Queue workers, scheduler, PHP

- **Supervisord** is installed or removed from the server's Packages tab (KB, via search) [C16]. The application then has a **Supervisor Jobs** tab with these fields: number of processes (default 1), timeout, sleep, queue names and max tries (KB, via search) [C8].
- The KB guide installs `predis/predis` and sets the queue driver to **Redis**. It describes "the configuration when Redis is used as the default driver" (KB, via search) [C8]. A third-party post from about 2024 says the generated command is hard-coded as `queue:work redis` [C23]. I found no first-party statement that the panel can run the `database` connection.
- **Inference (recommended):** use the Redis queue on Cloudways. Redis comes with the server [C7], and it fits the panel.
  - Set `retry_after=300` on the `redis` connection.
  - Set the panel timeout to 240 and processes to 3.
  - The database driver remains a fallback if Cloudways support confirms the command can be changed.
- **`stopwaitsecs`:** I found no source showing that it can be set. Laravel's docs want it longer than the longest job [S26].
  - **Inference:** Supervisor's default is 10 s, so a worker restarted mid-job could be killed and the job retried after `retry_after`.
  - Restart workers with `php artisan queue:restart`, which lets the current job finish, instead of restarting from the panel. Make jobs safe to retry.
- I found no per-process runtime limit on Cloudways. A Cloudways MCP server can also create, restart and check Supervisord queues (KB, via search) [C24].
- **Scheduler:** Application → Cron Job Management → Advanced, with an every-minute entry that runs `php artisan schedule:run` in the app's `public_html` (KB, via search) [C9].
- **PHP:** the Laravel hosting page says you can "switch between PHP 7.4, 8.0, 8.1, 8.3, and 8.4 anytime" [C7]. The changelog shows PHP 8.3 from 2024-06-20 and "PHP 8.4 Now Available on Cloudways" (Debian 11 and 12) on 2025-09-23. It has no PHP 8.5 entry [C1].
- Outbound HTTPS to the Anthropic API and Resend: no Cloudways source mentions an egress restriction. **Not verified.**

### 4. Deploy model

- **Git:** "Deployment via Git" generates an SSH key that you add to the repo as a deploy key. Only the **SSH** remote address works, not HTTPS. You then pick a branch and pull (KB, via search) [C9]. The Laravel page says deploys can be triggered "by webhooks or the API", and Envoyer is supported [C7].
- **SSH, SFTP and Composer:** "SSH and SFTP allow you to securely access servers…", "so you can use Composer and Git easily". You can restrict SSH and SFTP by IP [C7]. The KB Laravel guide runs Composer over SSH in `public_html` (KB, via search) [C9].
- **Node and npm:** a Cloudways blog guide says "Cloudways servers come with Node.js and NPM pre-installed" [C25]. No first-party page gives the version. **Inference:** run `node -v` over SSH. If it's too old for Vite, build assets in CI and commit or upload `public/build` instead of building on the server.
- **Zero-downtime:** none is documented. Git deploy pulls into the live directory [C9]. **Inference:** a deploy is pull → `composer install --no-dev` → `npm ci && npm run build` → `php artisan migrate --force` → `optimize` → `queue:restart`. Run it by hand or from a script triggered by the webhook, and expect a few seconds of mixed state. Envoyer is the paid route to atomic releases [C7].

### 5. Backups and SSL

- **Backups** (KB, via search) [C10]:
  - Server-level backups run on a schedule you set, from hourly to every 7 days, and are kept for 1 to 4 weeks.
  - The default is daily between 01:00 and 05:00 UTC, kept for a week.
  - Backups are stored off-site.
- Backups are mandatory on Flexible: "backups are mandatory and can't be turned off". Off-site storage costs **$0.033/GB** [C5]. The Laravel page says "all backup data is stored in an offsite location" [C7].
- Snapshots exist only on AWS and GCP servers and are kept for 14 days (KB, via search) [C10].
- **Inference:** the database is a few MB, so backups should cost cents a month. The backups also restore to Cloudways, so a periodic `mysqldump` to your own storage is a cheap second copy.
- **SSL:** "a free Let's Encrypt SSL certificate with our Laravel hosting", and custom certificates are supported [C7]. The 90-day Let's Encrypt certificates renew automatically [C11].

### Is a South African region viable?

**Yes.** Vultr Johannesburg is the best fit, at a flat **$28/mo for 2 GB** (Small) or $14 for 1 GB.

- It is the same price as Frankfurt, so there is no regional premium [C5].
- **Inference:** the latency gain is real. Johannesburg is local, and Frankfurt is roughly 150–180 ms away.
- Calls to the Anthropic API and Resend become intercontinental instead. That is fine for background jobs.
- AWS Cape Town works but costs more ($26.96 for 1 GB Micro, before storage) [C2].
- Before committing, confirm on the launch screen that Johannesburg offers the Small size, and that Vultr isn't capacity-limited there [C13].

Suggested setup:

- Vultr Johannesburg, Small 2 GB, MariaDB 10.11 (or MySQL 8.4 if you want JSON multi-valued or functional indexes; decide at launch, because the engine can't be changed later), PHP 8.4.
- Redis queue with 3 Supervisord processes and timeout 240.
- A cron `schedule:run` every minute.

### Not verified (Cloudways)

- KB article text: the region lists, the Supervisor form and its driver constraint, cron, Git and backups were seen only as search extracts. The KB returned 403.
- Whether the Supervisor panel can run the `database` queue connection, or set `stopwaitsecs`.
- Node.js version on current Debian 12 servers.
- Prices for GCP, Linode and Vultr High Frequency. Current AWS prices (the table is from 2024).
- Outbound network restrictions.

### Sources (Cloudways section)

| # | Source | Accessed |
| --- | --- | --- |
| C1 | https://www.cloudways.com/en/changelog.php (2024-05-09 Vultr Johannesburg; PHP 8.3 2024-06-20; PHP 8.4 2025-09-23; Debian 12 2025-04-09; MariaDB 10.11/11.4 2025-07-01) | 2026-11-10 |
| C2 | https://www.cloudways.com/blog/t3-micro-aws/ (AWS Micro per-region prices, updated 2024-07-01) | 2026-11-10 |
| C3 | https://www.cloudways.com/blog/aws-dubai-datacenter/ (AWS location list incl. Cape Town, Frankfurt; updated 2023-06-14) | 2026-11-10 |
| C4 | https://support.cloudways.com/en/articles/5120648-which-infrastructure-provider-do-i-have-to-choose (403; search extract only) | 2026-11-10 |
| C5 | https://www.cloudways.com/en/pricing.php (plans, flat-price FAQ, backups mandatory, $0.033/GB, trial) | 2026-11-10 |
| C6 | https://www.cloudways.com/blog/mysql-5-7-is-available-at-cloudways/ ("MySQL 8.4 Support for Debian 12", updated 2026-01-20) | 2026-11-10 |
| C7 | https://www.cloudways.com/en/laravel-hosting/ (PHP versions, SSH/SFTP, Git, Envoyer, Redis, Let's Encrypt, off-site backups) | 2026-11-10 |
| C8 | https://support.cloudways.com/en/articles/5127434-how-to-configure-laravel-supervisord-on-cloudways (403; search extract only) | 2026-11-10 |
| C9 | https://support.cloudways.com/en/articles/5128779-how-to-deploy-laravel-project-on-cloudways-server and https://support.cloudways.com/en/articles/5124087-how-to-deploy-code-to-your-application-using-git-on-cloudways-flexible (403; search extracts only) | 2026-11-10 |
| C10 | https://support.cloudways.com/en/articles/5123324-how-to-configure-a-server-level-backup and https://support.cloudways.com/en/articles/5123359-how-to-take-a-snapshot-of-a-server (403; search extracts only) | 2026-11-10 |
| C11 | https://www.cloudways.com/en/free-ssl-hosting.php (search extract) | 2026-11-10 |
| C12 | https://www.cloudways.com/en/datacenters.php | 2026-11-10 |
| C13 | https://www.cloudways.com/blog/introducing-vultr-hf-58gb-servers/ (search extract; Johannesburg "Limited availability") | 2026-11-10 |
| C14 | https://www.cloudways.com/en/vultr-hosting.php | 2026-11-10 |
| C15 | https://www.cloudways.com/blog/new-data-center-expansion/ (updated 2026-02-02) | 2026-11-10 |
| C16 | https://support.cloudways.com/en/articles/5116170-which-base-packages-are-deployed-with-a-cloudways-server and https://support.cloudways.com/en/articles/5120689-how-to-manage-your-server-settings (403; search extracts only) | 2026-11-10 |
| C17 | https://laravel.com/docs/13.x/database (supported databases and minimum versions) | 2026-11-10 |
| C18 | https://github.com/laravel/framework/blob/13.x/src/Illuminate/Queue/DatabaseQueue.php (`getLockForPopping`) | 2026-11-10 |
| C19 | https://mariadb.com/docs/server/reference/data-types/string-data-types/json | 2026-11-10 |
| C20 | https://dev.mysql.com/doc/refman/8.4/en/create-index.html (functional key parts, multi-valued indexes) | 2026-11-10 |
| C21 | https://laravel.com/docs/13.x/migrations (column modifiers, index types, vector on MariaDB 11.7+) | 2026-11-10 |
| C22 | https://mariadb.com/docs/server/reference/sql-statements/data-definition/create/create-index | 2026-11-10 |
| C23 | https://chaiwei.hashnode.dev/configuring-laravel-horizon-with-cloudways-supervisor-jobs (third-party, search extract) | 2026-11-10 |
| C24 | https://support.cloudways.com/en/articles/15798823-cloudways-mcp-server-tools (403; search extract only) | 2026-11-10 |
| C25 | https://www.cloudways.com/blog/what-is-mern-stack/ (search extract; Node/npm pre-installed) | 2026-11-10 |
