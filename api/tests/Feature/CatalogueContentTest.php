<?php

use App\Models\DistanceGroup;
use Symfony\Component\Yaml\Yaml;

/**
 * The v1 Catalogue content file, as written for review.
 *
 * @return array{games: list<array<string, mixed>>, drills: list<array<string, mixed>>}
 */
function catalogueContent(): array
{
    return Yaml::parseFile(database_path('catalogue/v1.yaml'));
}

/** A distance group by its content-format name, such as "100-150" or "5+". */
function distanceGroupId(string $category, string $name): ?string
{
    return DistanceGroup::where('sg_category', $category)->get()
        ->first(fn (DistanceGroup $group) => $group->min_metres.($group->max_metres === null ? '+' : "-{$group->max_metres}") === $name)
        ?->id;
}

/**
 * The links of a Game or Drill in the content file, as the editors post them.
 *
 * @param  array<string, mixed>  $item
 * @return array<string, mixed>
 */
function contentLinks(array $item): array
{
    $facilityKeys = $item['facilities'];

    return [
        'facility_ids' => collect($facilityKeys)->map(fn (string $key) => facilityId($key))->all(),
        // A feature key such as `slopes` names a feature of whichever listed Facility has it.
        'feature_ids' => collect($item['features'])
            ->map(fn (string $key) => collect($facilityKeys)
                ->map(fn (string $facility) => rescue(fn () => featureId($facility, $key), report: false))
                ->filter()->first())
            ->all(),
        'distance_group_ids' => collect($item['distanceGroups'] ?? [])
            ->map(fn (string $name) => distanceGroupId($item['category'], $name))
            ->all(),
    ];
}

/**
 * A Game from the content file as the Game editor posts it.
 *
 * @param  array<string, mixed>  $game
 * @return array<string, mixed>
 */
function contentGameFields(array $game): array
{
    return [
        'name' => $game['name'],
        'sg_category' => $game['category'],
        'balls' => $game['balls'],
        'estimated_minutes' => $game['estimatedMinutes'],
        'seconds_per_ball' => $game['secondsPerBall'],
        'rules' => $game['rules'],
        'scoring' => $game['scoring'],
        'score_better' => $game['score']['better'],
        'score_entry' => $game['score']['entry'],
        'pad_values' => $game['score']['padValues'] ?? [],
        'open' => $game['open'],
        'source_concept' => $game['source']['concept'] ?? null,
        'source_url' => $game['source']['url'] ?? null,
        ...contentLinks($game),
        'levels' => collect($game['levels'])
            ->map(fn (array $level) => [
                'settings' => collect($level['settings'])->map(fn ($value) => (string) $value)->all(),
                'up' => $level['up'],
                'down' => $level['down'],
            ])
            ->all(),
    ];
}

/**
 * Publishes every Game in the content file through the Game editor, and saves every
 * Drill through the Drill form, as an admin. Returns the Catalogue as a golfer reads it.
 *
 * @return array{games: list<array<string, mixed>>, drills: list<array<string, mixed>>}
 */
function publishCatalogueContent(): array
{
    ['games' => $games, 'drills' => $drills] = catalogueContent();
    $admin = admin();

    foreach ($games as $game) {
        test()->actingAs($admin)->post('/admin/games', contentGameFields($game))
            ->assertSessionHasNoErrors();
    }

    foreach ($drills as $drill) {
        test()->actingAs($admin)->post('/admin/drills', [
            'name' => $drill['name'],
            'sg_category' => $drill['category'],
            'balls' => $drill['balls'],
            'estimated_minutes' => $drill['estimatedMinutes'],
            'seconds_per_ball' => $drill['secondsPerBall'],
            'setup' => $drill['setup'],
            'source_concept' => $drill['source']['concept'] ?? null,
            'source_url' => $drill['source']['url'] ?? null,
            ...contentLinks($drill),
        ])->assertSessionHasNoErrors();
    }

    return test()->actingAs(golfer())->getJson('/api/catalogue')->assertOk()->json();
}

it('publishes every Game in the content file through the publish check', function () {
    expect(publishCatalogueContent()['games'])->toHaveCount(30);
});

it('has every Game and Drill on the v1 list: 8 Approach, 5 Off the Tee, 8 Short Game, 9 Putting, and 11 Drills', function () {
    ['games' => $games, 'drills' => $drills] = catalogueContent();

    expect(collect($games)->countBy('category')->all())
        ->toEqual(['approach' => 8, 'off_the_tee' => 5, 'short_game' => 8, 'putting' => 9])
        ->and(collect([...$games, ...$drills])->pluck('id'))
        ->each->toBeString()->toMatch('/^[0-9A-HJKMNP-TV-Z]{26}$/')
        ->and(collect([...$games, ...$drills])->pluck('id')->duplicates())->toBeEmpty()
        ->and(collect($games)->pluck('name')->duplicates())->toBeEmpty()
        ->and(collect($games)->pluck('version')->unique()->all())->toBe([1]);

    expect(publishCatalogueContent()['drills'])->toHaveCount(11);
});

it('gives every Game five Levels, except Return Putt 18', function () {
    $games = collect(publishCatalogueContent()['games']);

    $games->reject(fn (array $game) => $game['name'] === 'Return Putt 18')
        ->each(fn (array $game) => expect(collect($game['levels'])->pluck('level')->all())
            ->toBe([1, 2, 3, 4, 5], "{$game['name']} has five Levels"));
    expect($games->firstWhere('name', 'Return Putt 18')['levels'])->toBe([]);
});

it('writes Return Putt 18 with no balls, about 25 minutes, a timer, no Levels and no Open fields, on the 18-hole course', function () {
    $game = collect(publishCatalogueContent()['games'])->firstWhere('name', 'Return Putt 18');

    expect($game)
        ->sg_category->toBe('putting')
        ->balls->toBeNull()
        ->estimated_minutes->toBe(25)
        ->score_entry->toBe('timer')
        ->score_better->toBe('lower')
        ->levels->toBe([])
        ->open->toBe([])
        ->facility_ids->toBe([facilityId('putting_green')])
        ->feature_ids->toBe([featureId('putting_green', 'course_18')])
        ->and(collect($game['distance_group_ids'])->sort()->values()->all())
        ->toBe(DistanceGroup::where('sg_category', 'putting')->orderBy('id')->pluck('id')->sort()->values()->all());
});

it('lists distance groups on every Approach and Putting Game and Drill, with a Game in every distance group', function () {
    ['games' => $games, 'drills' => $drills] = publishCatalogueContent();

    collect([...$games, ...$drills])
        ->whereIn('sg_category', ['approach', 'putting'])
        ->each(fn (array $item) => expect($item['distance_group_ids'])->not->toBeEmpty("{$item['name']} lists its distance groups"));

    // Return Putt 18 covers every Putting distance group, but is only picked with 25 minutes to spare.
    $covered = collect($games)->reject(fn (array $game) => $game['name'] === 'Return Putt 18')
        ->pluck('distance_group_ids')->flatten()->unique();
    DistanceGroup::all()->each(fn (DistanceGroup $group) => expect($covered->contains($group->id))
        ->toBeTrue("A Game is in the {$group->sg_category->label()} group from {$group->min_metres} m"));
});

it('has a Putting Game played inside each Putting distance group at every Level', function () {
    $games = collect(publishCatalogueContent()['games'])->where('sg_category', 'putting');

    DistanceGroup::where('sg_category', 'putting')->get()->each(fn (DistanceGroup $group) => expect($games->contains(
        fn (array $game) => in_array($group->id, $game['distance_group_ids'])
            && $game['levels'] !== []
            && collect($game['levels'])->every(fn (array $level) => isset($level['settings']['distance'])
                && (float) $level['settings']['distance'] >= $group->min_metres
                && ($group->max_metres === null || (float) $level['settings']['distance'] <= $group->max_metres))
    ))->toBeTrue("A Game putts from {$group->label()} at every Level"));
});

it('uses neutral names and its own wording, and scores original Approach Games on landing within {zone} m of the flag', function () {
    ['games' => $games, 'drills' => $drills] = publishCatalogueContent();

    // From research/range-games-catalogue.md: names the sources published their Games under, and
    // the players, coaches and programs it says to keep out of our wording.
    $publishedNames = [
        'Fairways In Regulation', 'Tee Shot Test', 'Create a Fairway', '100', 'Wood Shot', 'Iron Shot', 'Knockout',
        'Every Club in Play', 'Eighteen', '21 Game', 'Par 18', 'Darts', '15 Chips', '5 Ball', 'Chip Shot',
        'Pitch Shot', 'Bunker Shot', 'Around the World', 'Seashell', 'Closest to the Hole', 'Mix-Up', 'Clock Face',
        'Lag-It', 'Croquet Golf', 'Thread the Needle', 'Ladder Challenge', 'Impact Location Challenge',
    ];
    $avoid = [
        'Drive, Chip and Putt', 'Golf Australia', 'Special Olympics', 'DECADE', 'Toptracer', 'Tiger', 'Mickelson',
        'Johnson', 'Garcia', 'Phillips', 'Harmon', 'Hearn',
    ];
    foreach ([...$games, ...$drills] as $item) {
        expect(collect($publishedNames)->map(fn (string $name) => strtolower($name)))
            ->not->toContain(strtolower($item['name']));

        $wording = implode(' ', [$item['name'], $item['rules'] ?? '', $item['scoring'] ?? '', $item['setup'] ?? '', $item['source_concept']]);
        foreach ($avoid as $name) {
            expect(str_contains($wording, $name))->toBeFalse("{$item['name']} avoids “{$name}”");
        }
    }

    $original = collect($games)->where('sg_category', 'approach')->whereNull('source_url');
    expect($original)->not->toBeEmpty();
    $original->each(fn (array $game) => expect($game)
        ->rules->toContain('first lands within {zone} m of')
        ->rules->toMatch('/\bflags?\b/')
        ->score_better->toBe('higher')
        ->score_entry->toBe('counter')
        ->scoring->toStartWith('1 point per hit.')
        ->and(collect($game['levels'])->pluck('settings')->map(fn (array $settings) => array_keys($settings))->unique()->all())
        ->toBe([['zone']]));
});

it('gives each SG Category a Game of about 5 minutes and one needing no features beyond its Facility', function () {
    $games = collect(publishCatalogueContent()['games']);

    // Seconds per ball at each Facility (spec: Facility pace), unless a Game sets its own.
    $pace = [
        facilityId('range_bay') => 40,
        facilityId('chipping_area') => 75,
        facilityId('putting_green') => 30,
        facilityId('practice_bunker') => 60,
    ];
    $minutes = fn (array $game) => $game['estimated_minutes']
        ?? $game['balls'] * ($game['seconds_per_ball'] ?? $pace[$game['facility_ids'][0]]) / 60;

    foreach (['off_the_tee', 'approach', 'short_game', 'putting'] as $category) {
        $inCategory = $games->where('sg_category', $category);
        expect($inCategory->contains(fn (array $game) => $minutes($game) >= 4 && $minutes($game) <= 6))
            ->toBeTrue("{$category} has a Game of about 5 minutes")
            ->and($inCategory->contains(fn (array $game) => $game['feature_ids'] === []))
            ->toBeTrue("{$category} has a Game needing no features");
    }
});
