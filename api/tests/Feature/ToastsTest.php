<?php

use App\Models\Drill;
use App\Models\GameVersion;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

/** The Toast a page that came back after an action shows. */
function successToast(string $title, ?string $description = null): array
{
    return ['status' => 'success', 'title' => $title, 'description' => $description];
}

it('confirms a saved Round with a Toast', function () {
    $this->actingAs(golfer())->followingRedirects()
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('rounds/index')
            ->hasFlash('toast', successToast('Round saved', 'Royal Johannesburg East')));
});

it('confirms an edited Round with a Toast', function () {
    $this->actingAs(golfer());
    $id = enterRound();
    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');

    $this->followingRedirects()
        ->put("/rounds/{$id}", roundFields(['baseline_id' => $baseline, 'course_name' => 'Glendower']))
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Round saved', 'Glendower')));
});

it('confirms a deleted Round with a Toast', function () {
    $this->actingAs(golfer());
    $id = enterRound();

    $this->followingRedirects()->delete("/rounds/{$id}")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Round deleted', 'Royal Johannesburg East')));
});

it('confirms a saved Drill with a Toast', function () {
    $this->actingAs(admin())->followingRedirects()
        ->post('/admin/drills', drillFields())
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Drill saved', 'Gate Drill')));
});

it('confirms an edited Drill with a Toast', function () {
    $drill = Drill::factory()->create(['name' => 'Gate Drill']);

    $this->actingAs(admin())->followingRedirects()
        ->put("/admin/drills/{$drill->id}", drillFields(['name' => 'Wide Gate']))
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Drill saved', 'Wide Gate')));
});

it('confirms a retired Drill with a Toast', function () {
    $drill = Drill::factory()->create(['name' => 'Clock Drill']);

    $this->actingAs(admin())->followingRedirects()
        ->post("/admin/drills/{$drill->id}/retire")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Drill retired', 'Clock Drill')));
});

it('confirms an approved Draft with a Toast', function () {
    $draft = GameVersion::factory()->create(['name' => 'Up and Down 9']);

    $this->actingAs(admin())->followingRedirects()
        ->post("/admin/drafts/{$draft->id}/approve")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Draft approved', 'Up and Down 9')));
});

it('confirms a deleted Draft with a Toast', function () {
    $draft = GameVersion::factory()->create(['name' => 'Up and Down 9']);

    $this->actingAs(admin())->followingRedirects()
        ->delete("/admin/drafts/{$draft->id}")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Draft deleted', 'Up and Down 9')));
});

it('confirms a retired Game with a Toast', function () {
    $version = GameVersion::factory()->published()->create(['name' => 'Fairway Finder']);

    $this->actingAs(admin())->followingRedirects()
        ->post("/admin/games/{$version->game_id}/retire")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Game retired', 'Fairway Finder')));
});

it('confirms a sent invite with a Toast', function () {
    Mail::fake();

    $this->actingAs(admin())->followingRedirects()
        ->post('/admin/users', ['email' => 'new.golfer@example.com'])
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Invite sent', 'new.golfer@example.com')));
});

it('confirms a re-sent invite with a Toast', function () {
    Mail::fake();
    $invited = User::factory()->create(['email' => 'invited@example.com'])->assignRole('golfer');

    $this->actingAs(admin())->followingRedirects()
        ->post("/admin/users/{$invited->id}/invite")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Invite re-sent', 'invited@example.com')));
});

it('confirms changed roles, a disabled login and a re-enabled one with Toasts', function () {
    $golfer = User::factory()->create(['email' => 'golfer@example.com'])->assignRole('golfer');
    $this->actingAs(admin());

    $this->followingRedirects()->put("/admin/users/{$golfer->id}/roles", ['roles' => ['admin', 'golfer']])
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Roles saved', 'golfer@example.com')));
    $this->followingRedirects()->post("/admin/users/{$golfer->id}/disable")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Disabled', 'golfer@example.com')));
    $this->followingRedirects()->post("/admin/users/{$golfer->id}/enable")
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Re-enabled', 'golfer@example.com')));
});

it('confirms a saved Handicap Index with a Toast', function () {
    $this->actingAs(newGolfer())->followingRedirects()
        ->post('/settings/handicap', ['fallback_handicap_index' => '12.4'])
        ->assertInertia(fn (Assert $page) => $page->hasFlash('toast', successToast('Handicap Index saved', '12.4')));
});

it('shows no Toast when a form comes back with errors', function () {
    $this->actingAs(golfer());

    $this->from('/rounds/create')->followingRedirects()
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'score' => null]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('rounds/edit')
            ->has('errors.score')
            ->missingFlash('toast'));
    $this->actingAs(admin())->from('/admin/users')->followingRedirects()
        ->put('/admin/users/'.auth()->id().'/roles', ['roles' => ['golfer']])
        ->assertInertia(fn (Assert $page) => $page->has('errors.roles')->missingFlash('toast'));
});
