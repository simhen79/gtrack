<?php

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/**
 * A golfer to act as. Roles arrive with sign-in; until then any user is a golfer.
 */
function golfer(): User
{
    return User::factory()->create();
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
