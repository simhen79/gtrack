<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the welcome page through Inertia for a signed-in golfer', function () {
    $this->actingAs(golfer())
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});

it('sends a guest to sign in', function () {
    $this->get('/')->assertRedirect('/login');
});
