<?php

use App\Auth\CurrentGolfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Spatie\OneTimePasswords\Notifications\OneTimePasswordNotification;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/**
 * A signed-up golfer to act as: past first sign-in, so they have settings.
 */
function golfer(): User
{
    return withSettings(newGolfer());
}

function admin(): User
{
    return withSettings(User::factory()->create()->assignRole('admin', 'golfer'));
}

/**
 * A golfer at their first sign-in, who hasn't given a fallback Handicap Index yet.
 */
function newGolfer(): User
{
    return User::factory()->create()->assignRole('golfer');
}

/**
 * Written straight to the table so it leaves whatever CurrentGolfer a test has set alone.
 */
function withSettings(User $user, string $fallbackHandicapIndex = '18.0'): User
{
    DB::table('settings')->insert([
        'id' => (string) Str::uuid7(),
        'user_id' => $user->id,
        'fallback_handicap_index' => $fallbackHandicapIndex,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $user;
}

/**
 * Signs in through the real email-code flow, as a browser would, and returns the
 * session cookie that browser now holds. Fakes notifications.
 */
function signInWithCode(User $user): string
{
    forgetBrowserState();
    Notification::fake();
    test()->post('/login/code', ['email' => $user->email]);

    $code = null;
    Notification::assertSentTo($user, OneTimePasswordNotification::class, function ($notification) use (&$code) {
        $code = $notification->oneTimePassword->password;

        return true;
    });

    $response = test()->post('/login', ['email' => $user->email, 'code' => $code])->assertRedirect('/');

    return $response->getCookie(config('session.cookie'), decrypt: false)->getValue();
}

/**
 * The next request comes from the browser holding this session cookie, with
 * nothing remembered in memory from earlier requests in the test.
 */
function fromBrowser(string $sessionCookie): TestCase
{
    forgetBrowserState();

    return test()->withUnencryptedCookie(config('session.cookie'), $sessionCookie);
}

/**
 * Signs in through the phone's email-code flow and returns the bearer token.
 * Needs notifications faked.
 */
function phoneToken(User $user): string
{
    test()->postJson('/api/login/code', ['email' => $user->email])->assertNoContent();

    $code = null;
    Notification::assertSentTo($user, OneTimePasswordNotification::class, function ($notification) use (&$code) {
        $code = $notification->oneTimePassword->password;

        return true;
    });

    return test()->postJson('/api/login', ['email' => $user->email, 'code' => $code, 'device_name' => 'iPhone'])
        ->assertOk()
        ->json('token');
}

/** The next request comes from a phone holding this token, and nothing else. */
function fromPhone(string $token): TestCase
{
    forgetBrowserState();

    return test()->withToken($token);
}

/**
 * Every golfer-data endpoint gets one of these: a second golfer must neither see
 * nor change a record that belongs to the first.
 *
 *     assertGolferIsolation(
 *         fn () => Round::factory()->create(),
 *         fn (Round $round) => [
 *             test()->getJson("/api/rounds/{$round->id}"),
 *             test()->patchJson("/api/rounds/{$round->id}", ['score' => 70]),
 *         ],
 *     );
 *
 * @param  Closure(): Model  $makeOwned  creates the record, run as its owner
 * @param  Closure(Model): array<int, TestResponse>  $attempts  the reads and writes the second golfer tries
 */
function assertGolferIsolation(Closure $makeOwned, Closure $attempts): void
{
    app(CurrentGolfer::class)->set(golfer());
    $record = $makeOwned();
    app(CurrentGolfer::class)->clear();

    // Read past the golfer scope: outside a request there is no current golfer.
    $read = fn () => $record->newQueryWithoutScopes()->find($record->getKey())?->getAttributes();
    $before = $read();

    test()->actingAs(golfer());

    // The golfer scope hides other golfers' rows, so to the second golfer the
    // record doesn't exist: 404, never a 403 that would confirm the id is real.
    foreach ($attempts($record) as $response) {
        $response->assertNotFound();
    }

    expect($read())->toBe($before);
}

/**
 * The test app is one long-lived process, so it remembers the signed-in user and
 * session between requests. A real request starts clean; this makes it so.
 */
function forgetBrowserState(): void
{
    app('auth')->forgetGuards();
    app()->forgetInstance('auth.driver');
    app('session')->forgetDrivers();
    app()->forgetInstance('session.store');
}
