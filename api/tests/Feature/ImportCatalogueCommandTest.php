<?php

use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\Yaml\Yaml;

const CATALOGUE_FIXTURE = 'tests/Fixtures/catalogue.yaml';

/**
 * The fixture with its first Game (or first Drill) changed, written to a file of its own.
 *
 * @param  Closure(array<string, mixed>): array<string, mixed>  $change
 */
function catalogueFixtureWith(Closure $change, string $list = 'games'): string
{
    $content = Yaml::parseFile(base_path(CATALOGUE_FIXTURE));
    $content[$list][0] = $change($content[$list][0]);

    return catalogueFile($content);
}

/**
 * Content written to a file of its own, deleted when the test ends, passed or failed.
 *
 * @param  array<string, mixed>  $content
 */
function catalogueFile(array $content): string
{
    $path = sys_get_temp_dir().'/catalogue-'.Str::random(12).'.yaml';
    file_put_contents($path, Yaml::dump($content, 6));
    test()->beforeApplicationDestroyed(fn () => unlink($path));

    return $path;
}

it('loads Games as first-load Drafts and Drills into the Catalogue, publishing nothing', function () {
    $this->artisan('app:import-catalogue', ['file' => base_path(CATALOGUE_FIXTURE)])->assertSuccessful();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('games', 0)
        ->where('drafts', fn ($drafts) => collect($drafts)->map(fn ($draft) => [
            $draft['game_id'], $draft['name'], $draft['version'], $draft['status'], $draft['origin'],
        ])->all() === [
            ['01m83kxb0khv9y88z8dtt5hqxf', 'Flag Zone 100-150', 1, 'draft', 'first_load'],
            ['01m83kxb237zra49qj4b1zqr6a', 'Return Putt 18', 1, 'draft', 'first_load'],
        ]));

    $catalogue = $this->actingAs(golfer())->getJson('/api/catalogue')->assertOk();
    $catalogue->assertJsonCount(0, 'games');
    expect($catalogue->json('drills'))->toHaveCount(1)
        ->and($catalogue->json('drills.0'))->toMatchArray([
            'id' => '01m83kxb2w8p1dv7xxqpts4k03',
            'name' => 'Putter Gate',
            'sg_category' => 'putting',
            'balls' => 20,
            'setup' => 'Two tees just wider than the putter head, a putter\'s length from the hole.',
            'source_url' => 'https://example.com/gate',
            'facility_ids' => [facilityId('putting_green')],
            'feature_ids' => [featureId('putting_green', 'slopes')],
        ]);
});

it('loads nothing twice when run again', function () {
    $this->artisan('app:import-catalogue', ['file' => base_path(CATALOGUE_FIXTURE)])->assertSuccessful();
    $this->artisan('app:import-catalogue', ['file' => base_path(CATALOGUE_FIXTURE)])
        ->expectsOutputToContain('Already loaded: Flag Zone 100-150, v1')
        ->expectsOutputToContain('Already loaded: Putter Gate')
        ->doesntExpectOutputToContain('differs from the file')
        ->assertSuccessful();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 2)
        ->has('drills', 1));
});

it('says when a loaded Game or Drill differs from the file, and leaves it as loaded', function () {
    $this->artisan('app:import-catalogue', ['file' => base_path(CATALOGUE_FIXTURE)])->assertSuccessful();
    $content = Yaml::parseFile(base_path(CATALOGUE_FIXTURE));
    $content['games'][0]['levels'][2]['settings']['zone'] = 11;
    $content['drills'][0]['setup'] = 'Two tees, a ball apart.';
    $file = catalogueFile($content);

    $this->artisan('app:import-catalogue', ['file' => $file])
        ->expectsOutputToContain('Already loaded: Flag Zone 100-150, v1, but it differs from the file. Change it in the Game editor, or give the file a new version.')
        ->expectsOutputToContain('Already loaded: Putter Gate, but it differs from the file. Change it in the Drill editor.')
        ->doesntExpectOutputToContain('Already loaded: Return Putt 18, v1, but')
        ->assertSuccessful();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->where('drafts.0.levels.2.settings.zone', '12')
        ->where('drills.0.setup', 'Two tees just wider than the putter head, a putter\'s length from the hole.'));
});

it('loads a Game that fails the publish check as a Draft, and lists its problems', function () {
    $file = catalogueFixtureWith(function (array $game) {
        $game['levels'][2]['up'] = null;
        $game['facilities'] = ['putting_green'];
        $game['features'] = [];

        return $game;
    });

    $this->artisan('app:import-catalogue', ['file' => $file])
        ->expectsOutputToContain('Drafted: Flag Zone 100-150, v1, which won\'t pass the publish check until it\'s fixed:')
        ->expectsOutputToContain('Approach Games are played at the range bay only.')
        ->expectsOutputToContain('Level 3 needs an up target.')
        ->assertSuccessful();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('games', 0)
        ->where('drafts.0.name', 'Flag Zone 100-150')
        ->where('drafts.0.levels.2.up', null));
});

it('runs the publish check when an imported Draft is Approved', function () {
    $file = catalogueFixtureWith(function (array $game) {
        $game['levels'][2]['up'] = null;

        return $game;
    });
    $this->artisan('app:import-catalogue', ['file' => $file])->assertSuccessful();
    $drafts = collect($this->actingAs(admin())->get('/admin/catalogue')->inertiaProps('drafts'))->keyBy('name');

    $this->post("/admin/drafts/{$drafts['Flag Zone 100-150']['id']}/approve")
        ->assertSessionHasErrors(['approve' => 'Level 3 needs an up target.']);
    $this->post("/admin/drafts/{$drafts['Return Putt 18']['id']}/approve")
        ->assertSessionHasNoErrors();

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 1)
        ->where('drafts.0.name', 'Flag Zone 100-150')
        ->where('games.0.name', 'Return Putt 18')
        ->where('games.0.status', 'published')
        ->where('games.0.origin', 'first_load'));
});

it('refuses a Game the editor would refuse, loads the rest and fails', function () {
    $file = catalogueFixtureWith(function (array $game) {
        $game['facilities'] = ['driving_range'];

        return $game;
    });

    $this->artisan('app:import-catalogue', ['file' => $file])
        ->expectsOutputToContain('Not loaded: Flag Zone 100-150, v1')
        ->expectsOutputToContain("There's no Facility called driving_range.")
        ->assertFailed();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 1)
        ->where('drafts.0.name', 'Return Putt 18')
        ->has('drills', 1));
});

it('refuses a Drill at a Facility its SG Category isn\'t played at', function () {
    $file = catalogueFixtureWith(function (array $drill) {
        $drill['facilities'] = ['putting_green', 'range_bay'];

        return $drill;
    }, 'drills');

    $this->artisan('app:import-catalogue', ['file' => $file])
        ->expectsOutputToContain('Not loaded: Putter Gate')
        ->expectsOutputToContain('Putting Drills are played at the putting green only.')
        ->assertFailed();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 2)
        ->has('drills', 0));
});

it('refuses a later version of a Game in another SG Category', function () {
    $this->artisan('app:import-catalogue', ['file' => base_path(CATALOGUE_FIXTURE)])->assertSuccessful();
    $file = catalogueFixtureWith(function (array $game) {
        $game['version'] = 2;
        $game['category'] = 'short_game';
        $game['distanceGroups'] = [];

        return $game;
    });

    $this->artisan('app:import-catalogue', ['file' => $file])
        ->expectsOutputToContain('Not loaded: Flag Zone 100-150, v2')
        ->expectsOutputToContain('Fixed once published. For another SG Category, write a new Game.')
        ->assertFailed();

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 2)
        ->where('drafts.0.version', 1));
});
