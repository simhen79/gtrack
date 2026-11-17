<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Baseline the golfer can pick for a Round. */
#[TypeScript]
class BaselineData extends Data
{
    public function __construct(
        public string $id,
        public string $name,
        public bool $is_default,
    ) {}
}
