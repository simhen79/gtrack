<?php

it('keeps a web session alive while it is used within 90 days', function () {
    $session = signInWithCode(golfer());

    $this->travel(89)->days();
    fromBrowser($session)->get('/')->assertOk();

    $this->travel(89)->days();
    fromBrowser($session)->get('/')->assertOk();
});

it('ends a web session after 90 days without use', function () {
    $session = signInWithCode(golfer());

    $this->travel(91)->days();

    fromBrowser($session)->get('/')->assertRedirect('/login');
});

it('ends the session on sign out', function () {
    $session = signInWithCode(golfer());

    fromBrowser($session)->post('/logout')->assertRedirect('/login');

    fromBrowser($session)->get('/')->assertRedirect('/login');
});
