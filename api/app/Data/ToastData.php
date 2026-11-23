<?php

namespace App\Data;

use App\Enums\ToastStatus;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A short confirmation: a bold title and an optional `small` line, flashed to the next page as `toast`. */
#[TypeScript]
class ToastData extends Data
{
    public function __construct(
        public ToastStatus $status,
        public string $title,
        public ?string $description = null,
    ) {}
}
