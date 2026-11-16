<?php

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Spatie\OneTimePasswords\Notifications\OneTimePasswordNotification;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/**
 * A signed-up golfer to act as.
 */
function golfer(): User
{
    return User::factory()->create()->assignRole('golfer');
}

function admin(): User
{
    return User::factory()->create()->assignRole('admin', 'golfer');
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
 * Every golfer-data endpoint gets one of these: a second golfer must neither see
 * nor change a record that belongs to the first.
 *
 *     assertGolferIsolation(
 *         fn (User $owner) => Round::factory()->for($owner)->create(),
 *         fn (Round $round) => [
 *             test()->getJson("/api/rounds/{$round->id}"),
 *             test()->patchJson("/api/rounds/{$round->id}", ['score' => 70]),
 *         ],
 *     );
 *
 * @param  Closure(User): Model  $makeOwned  creates the record for its owner
 * @param  Closure(Model): array<int, TestResponse>  $attempts  the reads and writes the second golfer tries
 */
function assertGolferIsolation(Closure $makeOwned, Closure $attempts): void
{
    $record = $makeOwned(golfer());
    $before = $record->fresh()->getAttributes();

    test()->actingAs(golfer());

    // The golfer scope hides other golfers' rows, so to the second golfer the
    // record doesn't exist: 404, never a 403 that would confirm the id is real.
    foreach ($attempts($record) as $response) {
        $response->assertNotFound();
    }

    expect($record->fresh()?->getAttributes())->toBe($before);
}

/**
 * The test app is one long-lived process, so it remembers the signed-in user and
 * session between requests. A real request starts clean; this makes it so.
 */
function forgetBrowserState(): void
{
    app('auth')->forgetGuards();
    app('session')->forgetDrivers();
    app()->forgetInstance('session.store');
}
