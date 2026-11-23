<?php

use Inertia\Testing\AssertableInertia as Assert;

it('seeds the starting-Level bands with the spec’s table', function () {
    $this->actingAs(admin())->get('/admin/starting-levels')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/starting-levels')
            ->where('bands', [
                ['from' => null, 'level' => 5],
                ['from' => '0.0', 'level' => 4],
                ['from' => '3.0', 'level' => 3],
                ['from' => '10.0', 'level' => 2],
                ['from' => '20.0', 'level' => 1],
            ]));
});

it('saves the bands an admin edits', function () {
    $bands = [
        ['from' => null, 'level' => 5],
        ['from' => '1.0', 'level' => 4],
        ['from' => '5.5', 'level' => 3],
        ['from' => '12.0', 'level' => 2],
        ['from' => '24.0', 'level' => 1],
    ];

    $this->actingAs(admin())->put('/admin/starting-levels', ['bands' => $bands])
        ->assertRedirect('/admin/starting-levels')
        ->assertSessionHasNoErrors();

    $this->get('/admin/starting-levels')->assertInertia(fn (Assert $page) => $page->where('bands', $bands));
});

it('refuses bands that don’t climb, or Levels outside 1 to 5', function (array $band, string $field) {
    $bands = [
        ['from' => null, 'level' => 5],
        ['from' => '0.0', 'level' => 4],
        ['from' => '3.0', 'level' => 3],
        ['from' => '10.0', 'level' => 2],
        ['from' => '20.0', 'level' => 1],
    ];
    $bands[2] = $band;

    $this->actingAs(admin())->put('/admin/starting-levels', ['bands' => $bands])
        ->assertSessionHasErrors($field);

    $this->get('/admin/starting-levels')->assertInertia(fn (Assert $page) => $page->where('bands.2.from', '3.0'));
})->with([
    'below the band before' => [['from' => '-1.0', 'level' => 3], 'bands.2.from'],
    'no start' => [['from' => null, 'level' => 3], 'bands.2.from'],
    'Level 6' => [['from' => '3.0', 'level' => 6], 'bands.2.level'],
]);

it('lets only admins open or change the starting-Level bands', function () {
    $this->actingAs(golfer());

    $this->get('/admin/starting-levels')->assertForbidden();
    $this->put('/admin/starting-levels', ['bands' => []])->assertForbidden();
});
