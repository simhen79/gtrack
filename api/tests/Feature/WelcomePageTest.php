<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the welcome page through Inertia', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
