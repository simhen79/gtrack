<?php

use App\Models\DistanceGroup;
use App\Models\GameVersion;
use Inertia\Testing\AssertableInertia as Assert;

it('writes a Game by hand on one screen and publishes it as v1 with its five Levels', function () {
    $this->actingAs(admin())->post('/admin/games', gameFields())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(1, 'games')->json('games.0');
    expect($game['name'])->toBe('Flag Zone 100-150')
        ->and($game['version'])->toBe(1)
        ->and($game['status'])->toBe('published')
        ->and($game['origin'])->toBe('hand_written')
        ->and($game['open'])->toBe(['target order'])
        ->and($game['levels'])->toHaveCount(5)
        ->and($game['levels'][0])->toBe(['level' => 1, 'settings' => ['zone' => '30'], 'up' => 6, 'down' => 2])
        ->and($game['levels'][4]['settings'])->toBe(['zone' => '10']);

    $this->actingAs(admin())->get("/admin/games/{$game['game_id']}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/game')
            ->where('game.id', $game['id'])
            ->has('game.levels', 5)
            ->where('category_facilities.short_game', ['chipping_area', 'practice_bunker', 'range_bay'])
            ->where('category_facilities.putting', ['putting_green'])
            ->has('facilities')
            ->has('distance_groups'));
});

it('refuses to approve a Draft with 3 Level rows, and approves one with five or none', function (int $rows, bool $publishes) {
    $draft = GameVersion::factory()->withLevels(array_fill(0, $rows, [6, 2]))->create();

    $response = $this->actingAs(admin())->post("/admin/drafts/{$draft->id}/approve");

    if ($publishes) {
        $response->assertSessionHasNoErrors();
    } else {
        $response->assertSessionHasErrors(['approve' => 'A Game has five Levels or none.']);
    }

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', $publishes ? 0 : 1)
        ->has('games', $publishes ? 1 : 0));
})->with([
    '3 rows' => [3, false],
    '5 rows' => [5, true],
    'none' => [0, true],
]);

it('refuses to publish a Level whose up target runs the wrong way for the score direction', function (string $better, int $up, int $down, ?string $message) {
    // Every other Level runs the right way: up 6, down 2 when higher is better.
    $levels = collect(gameFields()['levels'])
        ->map(fn (array $level) => $better === 'higher' ? $level : [...$level, 'up' => 2, 'down' => 6])
        ->all();
    $levels[1] = [...$levels[1], 'up' => $up, 'down' => $down];

    $response = $this->actingAs(admin())->post('/admin/games', gameFields(['score_better' => $better, 'levels' => $levels]));

    if ($message) {
        $response->assertSessionHasErrors(['levels.1.up' => $message]);
        $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(0, 'games');
    } else {
        $response->assertSessionHasNoErrors();
    }
})->with([
    'higher is better, up below down' => ['higher', 2, 6, 'Level 2: with higher is better, the up target must be above the down target.'],
    'higher is better, up above down' => ['higher', 6, 2, null],
    'lower is better, up above down' => ['lower', 6, 2, 'Level 2: with lower is better, the up target must be below the down target.'],
    'lower is better, up below down' => ['lower', 2, 6, null],
    'higher is better, up equal to down' => ['higher', 4, 4, 'Level 2: with higher is better, the up target must be above the down target.'],
]);

it('refuses to publish when a Level lacks a setting the rules use', function () {
    $levels = gameFields()['levels'];
    $levels[3]['settings'] = ['zone' => ''];

    $this->actingAs(admin())->post('/admin/games', gameFields(['levels' => $levels]))
        ->assertSessionHasErrors(['levels.3.settings.zone' => 'Level 4 has no {zone}.']);

    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(0, 'games');
});

it('refuses to publish when a Level lacks a placeholder with capitals or digits', function () {
    $this->actingAs(admin())->post('/admin/games', gameFields(['rules' => 'Land within {zone} m, then {Zone2} m, of the flag.']))
        ->assertSessionHasErrors(['levels.0.settings.Zone2' => 'Level 1 has no {Zone2}.']);

    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(0, 'games');
});

it('refuses to publish rules with a placeholder and no Levels to set it', function () {
    $this->actingAs(admin())->post('/admin/games', gameFields(['levels' => []]))
        ->assertSessionHasErrors(['levels' => 'The rules use {zone}, so add five Levels to set it.']);
});

it('refuses to publish a Level with no up or down target', function () {
    $levels = gameFields()['levels'];
    $levels[0]['up'] = null;
    $levels[2]['down'] = null;

    $this->actingAs(admin())->post('/admin/games', gameFields(['levels' => $levels]))
        ->assertSessionHasErrors([
            'levels.0.up' => 'Level 1 needs an up target.',
            'levels.2.down' => 'Level 3 needs a down target.',
        ]);
});

it('refuses to publish an Approach or Putting Game with no distance groups', function (string $category, string $facility, string $message) {
    $this->actingAs(admin())->post('/admin/games', gameFields([
        'sg_category' => $category,
        'facility_ids' => [facilityId($facility)],
        'feature_ids' => [],
        'distance_group_ids' => [],
    ]))->assertSessionHasErrors(['distance_group_ids' => $message]);
})->with([
    'Approach' => ['approach', 'range_bay', 'An Approach Game needs at least one distance group.'],
    'Putting' => ['putting', 'putting_green', 'A Putting Game needs at least one distance group.'],
]);

it('publishes an Off the Tee Game with no distance groups', function () {
    $this->actingAs(admin())->post('/admin/games', gameFields([
        'sg_category' => 'off_the_tee',
        'distance_group_ids' => [],
    ]))->assertSessionHasNoErrors();
});

it('refuses to publish Facilities, features or distance groups outside the fixed lists', function (Closure $overrides, string $field, string $message) {
    $this->actingAs(admin())->post('/admin/games', gameFields($overrides()))
        ->assertSessionHasErrors([$field => $message]);

    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(0, 'games');
})->with([
    'a Facility the SG Category can’t be played at' => [
        fn () => ['facility_ids' => [facilityId('range_bay'), facilityId('putting_green')]],
        'facility_ids',
        'Approach Games are played at the range bay only.',
    ],
    'a feature off the Game’s Facilities' => [
        fn () => ['feature_ids' => [featureId('chipping_area', 'rough')]],
        'feature_ids',
        'Pick features only on the Facilities this Game needs.',
    ],
    'a distance group from another SG Category' => [
        fn () => ['distance_group_ids' => [DistanceGroup::where('sg_category', 'putting')->value('id')]],
        'distance_group_ids',
        'Pick distance groups from this Game’s SG Category.',
    ],
]);

it('refuses to publish a Game missing what every Game needs', function (array $overrides, string $field, string $message) {
    $this->actingAs(admin())->post('/admin/games', gameFields($overrides))
        ->assertSessionHasErrors([$field => $message]);
})->with([
    'a name' => [['name' => ''], 'name', 'Give the Game a name.'],
    'a Facility' => [['facility_ids' => [], 'feature_ids' => []], 'facility_ids', 'Pick at least one Facility.'],
    'balls or minutes' => [['balls' => null, 'estimated_minutes' => null], 'balls', 'Give a number of balls or the estimated minutes.'],
    'rules' => [['rules' => '', 'levels' => []], 'rules', 'Write the rules.'],
    'scoring' => [['scoring' => ''], 'scoring', 'Say how it’s scored.'],
    'pad values for a points pad' => [['score_entry' => 'pad', 'pad_values' => []], 'pad_values', 'A points pad needs its values, such as 0, 1, 2, 3.'],
]);

/** Publishes the standard Game, as v1, on 3 March 2027; returns its Game id. */
function publishedGame(): string
{
    test()->travelTo('2027-03-03 09:00');
    test()->actingAs(admin())->post('/admin/games', gameFields())->assertSessionHasNoErrors();
    test()->travelTo('2027-04-10 09:00');

    return GameVersion::sole()->game_id;
}

it('publishes a new version when a published Game’s rules, scoring, ball count, Facilities or features change, and retires the old one', function (Closure $changes) {
    $gameId = publishedGame();

    $this->put("/admin/games/{$gameId}", gameFields($changes()))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $games = $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(1, 'games')->json('games');
    expect($games[0]['game_id'])->toBe($gameId)
        ->and($games[0]['version'])->toBe(2)
        ->and($games[0]['published_at'])->toStartWith('2027-04-10')
        ->and($games[0]['levels'])->toHaveCount(5);

    $this->actingAs(admin())->get("/admin/games/{$gameId}/edit")->assertInertia(fn (Assert $page) => $page
        ->where('game.version', 2)
        ->has('earlier_versions', 1)
        ->where('earlier_versions.0.version', 1)
        ->where('earlier_versions.0.status', 'retired')
        ->where('earlier_versions.0.published_at', fn (string $at) => str_starts_with($at, '2027-03-03'))
        ->where('earlier_versions.0.replaced_at', fn (string $at) => str_starts_with($at, '2027-04-10')));
})->with([
    'rules' => [fn () => ['rules' => 'Pick a flag between 100 and 150 m. Stop within {zone} m of it.']],
    'scoring' => [fn () => ['scoring' => '2 points per ball inside the zone']],
    'ball count' => [fn () => ['balls' => 12]],
    'Facilities and features' => [fn () => ['feature_ids' => [featureId('range_bay', 'distance_signs')]]],
]);

it('publishes a new version when only a published Game’s Facilities change', function () {
    $shortGame = ['sg_category' => 'short_game', 'facility_ids' => [facilityId('chipping_area')], 'feature_ids' => [], 'distance_group_ids' => []];
    $this->actingAs(admin())->post('/admin/games', gameFields($shortGame))->assertSessionHasNoErrors();
    $gameId = GameVersion::sole()->game_id;

    $this->put("/admin/games/{$gameId}", gameFields([...$shortGame, 'facility_ids' => [facilityId('chipping_area'), facilityId('practice_bunker')]]))
        ->assertSessionHasNoErrors();

    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(1, 'games')->assertJsonPath('games.0.version', 2);
});

it('saves a published Game’s Level settings and targets in place, with no new version', function () {
    $gameId = publishedGame();
    $levels = gameFields()['levels'];
    $levels[2] = ['settings' => ['zone' => '18'], 'up' => 7, 'down' => 3];

    $this->put("/admin/games/{$gameId}", gameFields(['levels' => $levels]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(1, 'games')->json('games.0');
    expect($game['version'])->toBe(1)
        ->and($game['published_at'])->toStartWith('2027-03-03')
        ->and($game['levels'][2])->toBe(['level' => 3, 'settings' => ['zone' => '18'], 'up' => 7, 'down' => 3]);

    $this->actingAs(admin())->get("/admin/games/{$gameId}/edit")->assertInertia(fn (Assert $page) => $page
        ->where('game.version', 1)
        ->has('earlier_versions', 0));
});

it('keeps a published Game in place when an in-place edit fails the check', function () {
    $gameId = publishedGame();
    $levels = gameFields()['levels'];
    $levels[0]['up'] = 1;

    $this->put("/admin/games/{$gameId}", gameFields(['levels' => $levels]))
        ->assertSessionHasErrors('levels.0.up');

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')->json('games.0');
    expect($game['levels'][0]['up'])->toBe(6);
});

it('fixes a published Game’s SG Category', function () {
    $gameId = publishedGame();

    $this->put("/admin/games/{$gameId}", gameFields(['sg_category' => 'short_game', 'distance_group_ids' => []]))
        ->assertSessionHasErrors(['sg_category' => 'Fixed once published. For another SG Category, write a new Game.']);

    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonPath('games.0.sg_category', 'approach');
});

it('publishes a Draft fixed in the editor as its own version', function () {
    $draft = GameVersion::factory()->withLevels(array_fill(0, 3, [6, 2]))->create(['origin' => 'first_load']);

    $this->actingAs(admin())->get("/admin/games/{$draft->game_id}/edit")
        ->assertInertia(fn (Assert $page) => $page->where('game.id', $draft->id)->where('game.status', 'draft')->has('game.levels', 3));

    $this->put("/admin/games/{$draft->game_id}", gameFields())->assertSessionHasNoErrors();

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(1, 'games')->json('games.0');
    expect($game['id'])->toBe($draft->id)
        ->and($game['version'])->toBe(1)
        ->and($game['origin'])->toBe('first_load')
        ->and($game['levels'])->toHaveCount(5);
});

it('lets only admins open the Game editor or publish from it', function () {
    $published = GameVersion::factory()->published()->create();
    $this->actingAs(golfer());

    $this->get('/admin/games/create')->assertForbidden();
    $this->post('/admin/games', gameFields())->assertForbidden();
    $this->get("/admin/games/{$published->game_id}/edit")->assertForbidden();
    $this->put("/admin/games/{$published->game_id}", gameFields())->assertForbidden();
});
