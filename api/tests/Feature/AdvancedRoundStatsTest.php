<?php

use App\Auth\CurrentGolfer;
use App\Models\Round;
use Illuminate\Support\Facades\DB;

/**
 * Every advanced stat filled in, as the entry form posts them.
 *
 * @return array<string, int>
 */
function advancedStats(array $overrides = []): array
{
    return [
        'fairways_hit' => 8,
        'fairways_missed_left' => 4,
        'fairways_missed_right' => 2,
        'penalties' => 1,
        'approach_miss_long_percent' => 12,
        'approach_miss_short_percent' => 31,
        'approach_miss_left_percent' => 18,
        'approach_miss_right_percent' => 9,
        'up_and_downs_made' => 3,
        'up_and_downs_attempted' => 7,
        ...$overrides,
    ];
}

it('offers the 7 Approach and 11 Putting distance bands, each in its distance group', function () {
    $this->actingAs(golfer())->get('/rounds/create')->assertInertia(fn ($page) => $page
        ->where('sg_bands', fn ($bands) => collect($bands)->map(fn ($band) => [$band['sg_category'], $band['label'], $band['distance_group']])->all() === [
            ['approach', '50–75 m', '50–100 m'],
            ['approach', '75–100 m', '50–100 m'],
            ['approach', '100–125 m', '100–150 m'],
            ['approach', '125–150 m', '100–150 m'],
            ['approach', '150–175 m', '150+ m'],
            ['approach', '175–200 m', '150+ m'],
            ['approach', '200+ m', '150+ m'],
            ['putting', '0–1 m', '0–1 m'],
            ['putting', '1–2 m', '1–3 m'],
            ['putting', '2–3 m', '1–3 m'],
            ['putting', '3–4 m', '3–5 m'],
            ['putting', '4–5 m', '3–5 m'],
            ['putting', '5–6 m', '5+ m'],
            ['putting', '6–7 m', '5+ m'],
            ['putting', '7–8 m', '5+ m'],
            ['putting', '8–9 m', '5+ m'],
            ['putting', '9–10 m', '5+ m'],
            ['putting', '10+ m', '5+ m'],
        ]));
});

it('saves a Round exactly as before when the advanced stats are left empty', function () {
    $this->actingAs(golfer());
    $id = enterRound(['stats' => array_fill_keys(array_keys(advancedStats()), null), 'bands' => []]);

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->where('round.sg_approach', '-2.10')
        ->where('round.sg_putting', '1.05')
        ->where('round.stats', array_fill_keys(array_keys(advancedStats()), null))
        ->where('round.bands', []));
    $this->get('/rounds')->assertInertia(fn ($page) => $page->where('rounds.0.sg_total', '-1.90'));
});

it('records advanced stats with a Round and opens them for editing', function () {
    $this->actingAs(golfer());
    $id = enterRound(['stats' => advancedStats()]);

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page->where('round.stats', advancedStats()));

    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');
    $this->put("/rounds/{$id}", roundFields(['baseline_id' => $baseline, 'stats' => advancedStats(['penalties' => null, 'fairways_hit' => 10])]))
        ->assertSessionHasNoErrors();

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->where('round.stats', advancedStats(['penalties' => null, 'fairways_hit' => 10])));
});

/**
 * SG band ids by label, per SG Category, as Round entry offers them.
 *
 * @return array<string, array<string, string>>
 */
function bandIds(): array
{
    return collect(test()->get('/rounds/create')->inertiaProps('sg_bands'))
        ->groupBy('sg_category')
        ->map(fn ($bands) => $bands->pluck('id', 'label')->all())
        ->all();
}

it('totals Approach and Putting from their bands, counting blank bands as 0, whatever total is typed', function () {
    $this->actingAs(golfer());
    ['approach' => $approach, 'putting' => $putting] = bandIds();
    $bands = [
        $approach['50–75 m'] => '-0.42',
        $approach['100–125 m'] => '0.18',
        $approach['200+ m'] => '-0.30',
        $approach['75–100 m'] => null,
        $putting['1–2 m'] => '0.25',
        $putting['10+ m'] => '-0.05',
    ];

    $id = enterRound(['sg_approach' => '5.00', 'sg_putting' => null, 'bands' => $bands]);

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->where('round.sg_approach', '-0.54')
        ->where('round.sg_putting', '0.20')
        ->where('round.bands', [
            $approach['50–75 m'] => '-0.42',
            $approach['100–125 m'] => '0.18',
            $approach['200+ m'] => '-0.30',
            $putting['1–2 m'] => '0.25',
            $putting['10+ m'] => '-0.05',
        ]));
    $this->get('/rounds')->assertInertia(fn ($page) => $page->where('rounds.0.sg_total', '-1.19'));

    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');
    $this->put("/rounds/{$id}", roundFields(['baseline_id' => $baseline, 'sg_approach' => '1.00', 'bands' => $bands]))
        ->assertSessionHasNoErrors();

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page->where('round.sg_approach', '-0.54'));
});

it('takes the typed total again once every band of an SG Category is cleared', function () {
    $this->actingAs(golfer());
    ['approach' => $approach, 'putting' => $putting] = bandIds();
    $id = enterRound(['bands' => [$approach['50–75 m'] => '-0.42', $putting['0–1 m'] => '0.10']]);
    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');

    $this->put("/rounds/{$id}", roundFields([
        'baseline_id' => $baseline,
        'sg_approach' => '0.50',
        'sg_putting' => '-1.00',
        'bands' => [$approach['50–75 m'] => null, $putting['0–1 m'] => '0.30'],
    ]))->assertSessionHasNoErrors();

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->where('round.sg_approach', '0.50')
        ->where('round.sg_putting', '0.30')
        ->where('round.bands', [$putting['0–1 m'] => '0.30']));
});

it('refuses advanced stats out of range, and keeps the Round unsaved', function (array $stats, string $field, string $message) {
    $this->actingAs(golfer())
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'stats' => advancedStats($stats)]))
        ->assertSessionHasErrors([$field => $message]);

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 0));
})->with([
    'a negative count' => [['penalties' => -1], 'stats.penalties', 'Penalties can’t be negative.'],
    'a percentage above 100' => [['approach_miss_short_percent' => 101], 'stats.approach_miss_short_percent', 'Approach misses short can’t be more than 100%.'],
    'up and downs made above attempts' => [['up_and_downs_made' => 8], 'stats.up_and_downs_made', 'Up and downs made can’t be more than up and downs attempted.'],
]);

it('refuses a band value past two decimals, and a band that doesn\'t exist', function () {
    $this->actingAs(golfer());
    $approach = bandIds()['approach'];

    $this->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'bands' => [$approach['50–75 m'] => '-0.425']]))
        ->assertSessionHasErrors("bands.{$approach['50–75 m']}");
    $this->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'bands' => ['not-a-band' => '0.10']]))
        ->assertSessionHasErrors('bands');

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 0));
});

it('deletes a Round\'s advanced stats and band values with it', function () {
    $this->actingAs(golfer());
    $approach = bandIds()['approach'];
    $id = enterRound(['stats' => advancedStats(), 'bands' => [$approach['50–75 m'] => '-0.42']]);
    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');
    $this->post('/rounds', roundFields(['baseline_id' => $baseline, 'played_on' => '2026-11-01', 'stats' => advancedStats(), 'bands' => [$approach['50–75 m'] => '0.10']]));
    $kept = $this->get('/rounds')->inertiaProps('rounds.1.id');
    expect(DB::table('round_stats')->where('round_id', $id)->count())->toBe(1)
        ->and(DB::table('round_sg_bands')->where('round_id', $id)->count())->toBe(1);

    $this->delete("/rounds/{$id}")->assertRedirect('/rounds');

    expect(DB::table('round_stats')->where('round_id', $id)->count())->toBe(0)
        ->and(DB::table('round_sg_bands')->where('round_id', $id)->count())->toBe(0);
    $this->get("/rounds/{$kept}/edit")->assertInertia(fn ($page) => $page
        ->where('round.stats', advancedStats())
        ->where('round.bands', [$approach['50–75 m'] => '0.10']));
});

it('never shows or changes another golfer\'s advanced stats', function () {
    assertGolferIsolation(
        fn () => tap(Round::factory()->create())->saveAdvancedStats(advancedStats(), []),
        fn (Round $round) => [
            test()->get("/rounds/{$round->id}/edit"),
            test()->put("/rounds/{$round->id}", roundFields(['new_baseline' => 'Mine', 'stats' => advancedStats(['penalties' => 9])])),
        ],
    );

    app(CurrentGolfer::class)->clear();
    expect(DB::table('round_stats')->pluck('penalties')->all())->toBe([1]);
});

it('shows each Round\'s SG Categories and advanced stats on the Rounds list', function () {
    $this->actingAs(golfer());
    enterRound(['stats' => advancedStats(['penalties' => null])]);

    $this->get('/rounds')->assertInertia(fn ($page) => $page
        ->where('rounds.0.sg_off_the_tee', '-1.25')
        ->where('rounds.0.sg_approach', '-2.10')
        ->where('rounds.0.sg_short_game', '0.40')
        ->where('rounds.0.sg_putting', '1.05')
        ->where('rounds.0.stats', advancedStats(['penalties' => null])));
});
