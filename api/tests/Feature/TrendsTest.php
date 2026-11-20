<?php

use App\Auth\CurrentGolfer;
use App\Models\Baseline;
use App\Models\Round;
use App\Models\Setting;
use App\Models\SgBand;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Rounds on one Baseline, oldest first, one a day from 1 October, each with the
 * Strokes Gained given by `$putting` and the other categories at 0.00.
 *
 * @param  array<int, string>  $putting
 * @return Collection<int, Round>
 */
function roundsOn(User $golfer, Baseline $baseline, array $putting, int $holes = 18): Collection
{
    app(CurrentGolfer::class)->set($golfer);
    $rounds = collect($putting)->map(fn (string $value, int $i) => Round::factory()->for($baseline)->create([
        'played_on' => now()->setDate(2026, 10, 1)->addDays($i)->toDateString(),
        'holes' => $holes,
        'sg_off_the_tee' => '0.00',
        'sg_approach' => '0.00',
        'sg_short_game' => '0.00',
        'sg_putting' => $value,
    ]));
    app(CurrentGolfer::class)->clear();

    return $rounds;
}

function baselineOf(User $golfer, string $name, bool $default = false): Baseline
{
    app(CurrentGolfer::class)->set($golfer);
    $baseline = Baseline::create(['name' => $name]);
    if ($default) {
        Setting::sole()->update(['default_baseline_id' => $baseline->id]);
    }
    app(CurrentGolfer::class)->clear();

    return $baseline;
}

it('counts a 9-hole Round per 18', function () {
    $golfer = golfer();
    $scratch = baselineOf($golfer, 'Scratch', default: true);
    roundsOn($golfer, $scratch, ['-0.80'], holes: 9);

    $this->actingAs($golfer)->get('/trends')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('trends/index')
            ->where('categories.3.category', 'putting')
            ->where('categories.3.last_5', ['-1.60'])
            ->where('categories.3.last_20', ['-1.60']));
});

it('sends each SG Category a 5-Round and a 20-Round rolling series, a point per Round', function () {
    $golfer = golfer();
    $scratch = baselineOf($golfer, 'Scratch', default: true);
    // Putting −0.01 in the first Round, −0.02 in the second … −0.25 in the 25th.
    roundsOn($golfer, $scratch, array_map(fn (int $i) => sprintf('-0.%02d', $i), range(1, 25)));

    $this->actingAs($golfer)->get('/trends')->assertInertia(fn (Assert $page) => $page
        ->has('rounds', 25)
        ->where('rounds.0.played_on', '2026-10-01')
        ->where('rounds.24.played_on', '2026-10-25')
        ->where('categories', fn ($categories) => collect($categories)->pluck('category')->all() === ['off_the_tee', 'approach', 'short_game', 'putting']
            && collect($categories)->every(fn ($trend) => count($trend['last_5']) === 25 && count($trend['last_20']) === 25))
        ->where('categories.0.last_5.24', '0.00')
        ->where('categories.3.last_5.5', '-0.04')
        ->where('categories.3.last_5.24', '-0.23')
        ->where('categories.3.last_20.19', '-0.11')
        ->where('categories.3.last_20.24', '-0.16'));
});

it('combines only the picked Baseline\'s Rounds, starting with the default Baseline', function () {
    $golfer = golfer();
    $tour = baselineOf($golfer, 'Tour');
    $scratch = baselineOf($golfer, 'Scratch', default: true);
    roundsOn($golfer, $scratch, ['-1.00', '-2.00']);
    roundsOn($golfer, $tour, ['-3.00']);

    $this->actingAs($golfer)->get('/trends')->assertInertia(fn (Assert $page) => $page
        ->where('baselines', [
            ['id' => $scratch->id, 'name' => 'Scratch', 'is_default' => true],
            ['id' => $tour->id, 'name' => 'Tour', 'is_default' => false],
        ])
        ->where('baseline_id', $scratch->id)
        ->has('rounds', 2)
        ->where('categories.3.last_5', ['-1.00', '-1.50']));

    $this->get("/trends?baseline={$tour->id}")->assertInertia(fn (Assert $page) => $page
        ->where('baseline_id', $tour->id)
        ->has('rounds', 1)
        ->where('categories.3.last_5', ['-3.00']));
});

it('averages the Rounds available when there are fewer than a window', function () {
    $golfer = golfer();
    $scratch = baselineOf($golfer, 'Scratch', default: true);
    roundsOn($golfer, $scratch, ['-1.00', '0.50', '-2.00']);

    $this->actingAs($golfer)->get('/trends')->assertInertia(fn (Assert $page) => $page
        ->where('categories.3.last_5', ['-1.00', '-0.25', '-0.83'])
        ->where('categories.3.last_20', ['-1.00', '-0.25', '-0.83']));
});

it('sends empty trends to a golfer with no Rounds', function () {
    $this->actingAs(golfer())->get('/trends')->assertInertia(fn (Assert $page) => $page
        ->component('trends/index')
        ->where('baselines', [])
        ->where('baseline_id', null)
        ->where('rounds', [])
        ->where('categories.0.last_5', [])
        ->where('categories.3.last_20', []));
});

it('keeps a golfer\'s Baseline out of another golfer\'s trends', function () {
    assertGolferIsolation(
        fn () => Round::factory()->create()->baseline,
        fn (Baseline $baseline) => [test()->get("/trends?baseline={$baseline->id}")],
    );
});

it('refuses a Baseline that isn\'t one', function () {
    $this->actingAs(golfer())->get('/trends?baseline=not-a-baseline')->assertNotFound();
});

it('averages each Approach and Putting distance band per 18 over the last 20 Rounds that have it', function () {
    $golfer = golfer();
    $scratch = baselineOf($golfer, 'Scratch', default: true);
    $rounds = roundsOn($golfer, $scratch, array_fill(0, 21, '0.00'));
    $nearest = SgBand::inOrder()->first();

    app(CurrentGolfer::class)->set($golfer);
    $rounds[0]->sgBands()->create(['sg_band_id' => $nearest->id, 'value' => '-5.00']);
    $rounds[5]->sgBands()->create(['sg_band_id' => $nearest->id, 'value' => '-0.30']);
    $rounds[9]->update(['holes' => 9]);
    $rounds[9]->sgBands()->create(['sg_band_id' => $nearest->id, 'value' => '-0.10']);
    app(CurrentGolfer::class)->clear();

    $this->actingAs($golfer)->get('/trends')->assertInertia(fn (Assert $page) => $page
        ->has('categories.0.bands', 0)
        ->has('categories.1.bands', 7)
        ->where('categories.1.bands.0', ['id' => $nearest->id, 'label' => '50–75 m', 'value' => '-0.25'])
        ->where('categories.1.bands.1.value', null)
        ->has('categories.2.bands', 0)
        ->has('categories.3.bands', 11)
        ->where('categories.3.bands.10.label', '10+ m'));
});
