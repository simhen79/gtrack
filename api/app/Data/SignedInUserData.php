<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SignedInUserData extends Data
{
    public function __construct(
        public string $id,
        public string $email,
    ) {}
}
