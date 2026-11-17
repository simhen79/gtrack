<?php

it('asks a golfer with no settings for a fallback Handicap Index before anything else', function () {
    $this->actingAs(newGolfer())->get('/')->assertRedirect('/settings/handicap');
});

it('saves the fallback Handicap Index to the golfer\'s settings and lets them in', function () {
    $this->actingAs(newGolfer())
        ->post('/settings/handicap', ['fallback_handicap_index' => '12.4'])
        ->assertRedirect('/');

    $this->get('/settings/handicap')->assertInertia(fn ($page) => $page
        ->component('settings/handicap')
        ->where('fallback_handicap_index', '12.4'));
    $this->get('/')->assertOk();
});

it('refuses a missing or impossible fallback Handicap Index', function (mixed $value) {
    $this->actingAs(newGolfer())
        ->post('/settings/handicap', ['fallback_handicap_index' => $value])
        ->assertSessionHasErrors('fallback_handicap_index');

    $this->get('/')->assertRedirect('/settings/handicap');
})->with([null, 'abc', '54.1', '-10.1', '12.45']);
