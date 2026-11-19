<?php

namespace App\Data;

use App\Models\Variation;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** Setup wording for a Game version: the plain one, or one written for this golfer. */
#[TypeScript]
class VariationData extends Data
{
    public function __construct(
        public string $id,
        public string $wording,
        public ?string $miss_direction,
        public bool $is_plain,
    ) {}

    public static function fromVariation(Variation $variation): self
    {
        return new self($variation->id, $variation->wording, $variation->miss_direction, $variation->is_plain);
    }
}
