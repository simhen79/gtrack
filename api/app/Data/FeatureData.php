<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A feature a Facility can have, such as target flags. */
#[TypeScript]
class FeatureData extends Data
{
    public function __construct(
        public string $id,
        public string $key,
        public string $name,
    ) {}
}
