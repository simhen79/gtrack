<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

/**
 * Proves a queue worker is running: records when it ran and on which connection.
 * Dispatch it with `php artisan ops:queue-check`, then read `php artisan ops:status`.
 */
class QueueCheck implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Cache::forever('ops:queue_check', now()->format('Y-m-d H:i:s').' on '.$this->job->getConnectionName());
    }
}
