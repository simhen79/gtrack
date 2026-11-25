<?php

use App\Models\Drill;
use App\Models\Facility;
use App\Models\Game;
use App\Models\GameVersion;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

/** Whether an id is a UUIDv7, as every id but a Game's or Drill's is. */
function isUuid7(string $id): bool
{
    return Str::isUuid($id) && $id[14] === '7';
}

it('lists Drafts apart from the Catalogue', function () {
    $published = GameVersion::factory()->published()->create(['name' => 'Fairway Finder']);
    $draft = GameVersion::factory()->create(['name' => 'Up and Down 9']);

    $this->actingAs(admin())->get('/admin/catalogue')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/catalogue')
            ->where('games', fn ($games) => collect($games)->pluck('name')->all() === ['Fairway Finder'])
            ->where('drafts', fn ($drafts) => collect($drafts)->pluck('name')->all() === ['Up and Down 9'])
            ->where('games.0.status', 'published')
            ->where('drafts.0.status', 'draft')
            ->where('drafts.0.id', $draft->id)
            ->where('games.0.game_id', $published->game_id));
});

it('approves a Draft: publishes it, creates its plain Variation and puts it in the Catalogue', function () {
    $draft = GameVersion::factory()->create(['name' => 'Up and Down 9', 'rules' => 'Nine lies around the green.']);

    $this->actingAs(admin())->post("/admin/drafts/{$draft->id}/approve")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drafts', 0)
        ->where('games.0.id', $draft->id)
        ->where('games.0.status', 'published'));

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')
        ->assertOk()
        ->assertJsonCount(1, 'games')
        ->json('games.0');
    expect($game['name'])->toBe('Up and Down 9')
        ->and($game['status'])->toBe('published')
        ->and($game['variations'])->toHaveCount(1)
        ->and($game['variations'][0]['is_plain'])->toBeTrue()
        ->and($game['variations'][0]['wording'])->toBe('Nine lies around the green.');
});

it('gives Games text ULIDs and their versions and Variations UUIDv7s', function () {
    $draft = GameVersion::factory()->create();
    $this->actingAs(admin())->post("/admin/drafts/{$draft->id}/approve");

    $game = $this->actingAs(golfer())->getJson('/api/catalogue')->json('games.0');

    expect(Str::isUlid($game['game_id']))->toBeTrue()
        ->and(isUuid7($game['id']))->toBeTrue()
        ->and(isUuid7($game['variations'][0]['id']))->toBeTrue();
});

it('refuses to publish a second version of a Game that already has one', function () {
    $published = GameVersion::factory()->published()->create();
    $second = GameVersion::factory()->for($published->game)->create(['version' => 2]);

    $this->actingAs(admin())->post("/admin/drafts/{$second->id}/approve")
        ->assertSessionHasErrors('approve');

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->where('games', fn ($games) => collect($games)->pluck('id')->all() === [$published->id])
        ->where('drafts.0.id', $second->id));
});

it('has the database reject two published versions of one Game', function () {
    $game = Game::create();
    GameVersion::factory()->published()->for($game)->create();

    expect(fn () => GameVersion::factory()->published()->for($game)->create(['version' => 2]))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('keeps Drafts out of the Catalogue golfers read', function () {
    GameVersion::factory()->published()->create(['name' => 'Fairway Finder']);
    GameVersion::factory()->create(['name' => 'Up and Down 9']);

    $this->actingAs(golfer())->getJson('/api/catalogue')
        ->assertOk()
        ->assertJsonPath('games.*.name', ['Fairway Finder']);
});

it('retires a published Game: it leaves the Catalogue and its record remains', function () {
    $version = GameVersion::factory()->published()->create();

    $this->actingAs(admin())->post("/admin/games/{$version->game_id}/retire")->assertRedirect();

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->where('games.0.id', $version->id)
        ->where('games.0.status', 'retired')
        ->where('games.0.retired_at', fn ($at) => $at !== null));
    $this->actingAs(golfer())->getJson('/api/catalogue')->assertJsonCount(0, 'games');
});

it('deletes a Draft', function () {
    $draft = GameVersion::factory()->create();

    $this->actingAs(admin())->delete("/admin/drafts/{$draft->id}")->assertRedirect();

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page->has('drafts', 0)->has('games', 0));
});

it('only approves or deletes Drafts', function () {
    $published = GameVersion::factory()->published()->create();
    $this->actingAs(admin());

    $this->post("/admin/drafts/{$published->id}/approve")->assertNotFound();
    $this->delete("/admin/drafts/{$published->id}")->assertNotFound();
});

it('leaves retired Drills out of the Catalogue golfers read', function () {
    Drill::factory()->create(['name' => 'Gate Drill']);
    $retired = Drill::factory()->create(['name' => 'Clock Drill']);

    $this->actingAs(admin())->post("/admin/drills/{$retired->id}/retire")->assertRedirect();

    $this->actingAs(golfer())->getJson('/api/catalogue')
        ->assertJsonPath('drills.*.name', ['Gate Drill']);
});

it('lets golfers read the Catalogue but not change it, approve a Draft or open Drafts', function () {
    $draft = GameVersion::factory()->create();
    $published = GameVersion::factory()->published()->create();
    $drill = Drill::factory()->create();
    $this->actingAs(golfer());

    $this->getJson('/api/catalogue')->assertOk();
    $this->get('/admin/catalogue')->assertForbidden();
    $this->post("/admin/drafts/{$draft->id}/approve")->assertForbidden();
    $this->delete("/admin/drafts/{$draft->id}")->assertForbidden();
    $this->post("/admin/games/{$published->game_id}/retire")->assertForbidden();
    $this->get('/admin/drills/create')->assertForbidden();
    $this->post('/admin/drills', [])->assertForbidden();
    $this->get("/admin/drills/{$drill->id}/edit")->assertForbidden();
    $this->put("/admin/drills/{$drill->id}", [])->assertForbidden();
    $this->post("/admin/drills/{$drill->id}/retire")->assertForbidden();

    expect($draft->fresh()->status->value)->toBe('draft')
        ->and($published->fresh()->status->value)->toBe('published')
        ->and($drill->fresh()->retired_at)->toBeNull();
});

it('shows a golfer the plain Variation and their own, never another golfer\'s', function () {
    $draft = GameVersion::factory()->create();
    $this->actingAs(admin())->post("/admin/drafts/{$draft->id}/approve");
    $mine = golfer();
    $theirs = golfer();
    foreach ([$mine, $theirs] as $golfer) {
        $draft->variations()->make(['wording' => "Written for {$golfer->email}", 'is_plain' => false])
            ->forceFill(['user_id' => $golfer->id])
            ->save();
    }

    $this->actingAs($mine)->getJson('/api/catalogue')
        ->assertJsonPath('games.0.variations.*.wording', [$draft->rules, "Written for {$mine->email}"]);
});

it('keeps a Game version\'s Open fields and pad values in order', function () {
    GameVersion::factory()->published()
        ->withOpen(['target order', 'scenario wording'])
        ->withPadValues([1, 2, 3, 5])
        ->create(['score_entry' => 'pad']);

    $this->actingAs(golfer())->getJson('/api/catalogue')
        ->assertJsonPath('games.0.open', ['target order', 'scenario wording'])
        ->assertJsonPath('games.0.pad_values', [1, 2, 3, 5]);
});

it('gives each Game and Drill its SG Category and Facilities, for the Catalogue\'s filters', function () {
    $bunker = Facility::where('key', 'practice_bunker')->sole();
    $green = Facility::where('key', 'putting_green')->sole();
    $game = GameVersion::factory()->published()->create(['sg_category' => 'short_game']);
    $game->facilities()->sync([$bunker->id]);
    $drill = Drill::factory()->create(['sg_category' => 'putting']);
    $drill->facilities()->sync([$green->id]);

    $this->actingAs(admin())->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->where('games.0.sg_category', 'short_game')
        ->where('games.0.facility_ids', [$bunker->id])
        ->where('drills.0.sg_category', 'putting')
        ->where('drills.0.facility_ids', [$green->id]));
});
