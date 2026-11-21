<?php

namespace App\Http\Controllers;

use App\Data\ToastData;
use App\Enums\ToastStatus;
use Inertia\Inertia;

abstract class Controller
{
    /**
     * Confirms a completed action on the page the redirect lands on. Inertia's flash keeps it
     * out of history, so Back doesn't show it again.
     */
    protected function toast(string $title, ?string $description = null): void
    {
        Inertia::flash('toast', (new ToastData(ToastStatus::Success, $title, $description))->toArray());
    }
}
