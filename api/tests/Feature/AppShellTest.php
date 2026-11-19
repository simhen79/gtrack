<?php

use App\Auth\CurrentGolfer;
use App\Models\Round;
use Inertia\Testing\AssertableInertia as Assert;

it('renders Home through Inertia for a signed-in golfer', function () {
    $this->actingAs(golfer())
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('home'));
});

it('sends a guest to sign in', function () {
    $this->get('/')->assertRedirect('/login');
});

it('gives every page in the shell the account it shows, without the Admin section for a golfer', function () {
    $golfer = golfer();
    app(CurrentGolfer::class)->set($golfer);
    $round = Round::factory()->create();
    app(CurrentGolfer::class)->clear();

    foreach (['/', '/rounds', '/rounds/create', "/rounds/{$round->id}/edit"] as $url) {
        $this->actingAs($golfer)->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.email', $golfer->email)
                ->where('auth.permissions', fn ($names) => ! collect($names)->contains('users.manage')));
    }
});

it('gives an admin the Admin section on every page, golfer pages included', function () {
    $admin = admin();

    foreach (['/', '/rounds', '/admin/users'] as $url) {
        $this->actingAs($admin)->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.email', $admin->email)
                ->where('auth.permissions', fn ($names) => collect($names)->contains('users.manage')));
    }
});

it('gives the fallback Handicap Index page the account too, at first sign-in', function () {
    $golfer = newGolfer();

    $this->actingAs($golfer)->get('/settings/handicap')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/handicap')
            ->where('auth.user.email', $golfer->email));
});

it('shows sign-in without an account, so it gets the themed page without nav', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('auth.user', null));
});
