<?php

use App\Jobs\QueueCheck;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Schedule::call(fn () => Cache::forever('ops:heartbeat', now()->format('Y-m-d H:i:s')))
    ->name('heartbeat')
    ->everyMinute();

Artisan::command('ops:queue-check', function () {
    QueueCheck::dispatch();
    $this->info('Queue check dispatched. Run ops:status once a worker has picked it up.');
})->purpose('Dispatch a job that records when a queue worker ran it');

Artisan::command('ops:status', function () {
    $this->line('Heartbeat: '.Cache::get('ops:heartbeat', 'never'));
    $this->line('Queue check: '.Cache::get('ops:queue_check', 'never'));
})->purpose('Show when the scheduler heartbeat and the queue check last ran');
