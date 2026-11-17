<?php

use App\Jobs\QueueCheck;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;
use Laravel\Sanctum\PersonalAccessToken;

Schedule::call(fn () => Cache::forever('ops:heartbeat', now()->format('Y-m-d H:i:s T')))
    ->name('heartbeat')
    ->everyMinute();

// The token check already refuses these; this clears them out.
Schedule::call(fn () => PersonalAccessToken::where(
    fn ($query) => $query->where('last_used_at', '<', now()->subDays(config('sanctum.idle_days')))
        ->orWhere(fn ($query) => $query->whereNull('last_used_at')->where('created_at', '<', now()->subDays(config('sanctum.idle_days')))),
)->delete())
    ->name('prune-idle-tokens')
    ->daily();

Artisan::command('ops:queue-check', function () {
    QueueCheck::dispatch();
    $this->info('Queue check dispatched. Run ops:status once a worker has picked it up.');
})->purpose('Dispatch a job that records when a queue worker ran it');

Artisan::command('ops:status', function () {
    $this->line('Heartbeat: '.Cache::get('ops:heartbeat', 'never'));
    $this->line('Queue check: '.Cache::get('ops:queue_check', 'never'));
})->purpose('Show when the scheduler heartbeat and the queue check last ran');
