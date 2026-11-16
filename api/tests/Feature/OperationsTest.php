<?php

it('reports that nothing has run yet on a fresh install', function () {
    $this->artisan('ops:status')
        ->expectsOutputToContain('Heartbeat: never')
        ->expectsOutputToContain('Queue check: never')
        ->assertSuccessful();
});

it('records the scheduler heartbeat each minute', function () {
    $this->travelTo('2026-11-16 10:15:00');

    $this->artisan('schedule:run')->assertSuccessful();

    $this->artisan('ops:status')
        ->expectsOutputToContain('Heartbeat: 2026-11-16 10:15:00')
        ->assertSuccessful();
});

it('records the queue check once a worker runs the job', function () {
    $this->travelTo('2026-11-16 10:20:00');

    $this->artisan('ops:queue-check')->assertSuccessful();

    // Tests use the sync queue, so the job has already run on "sync".
    $this->artisan('ops:status')
        ->expectsOutputToContain('Queue check: 2026-11-16 10:20:00 on sync')
        ->assertSuccessful();
});
