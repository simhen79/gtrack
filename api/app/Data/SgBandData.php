<?php

namespace App\Data;

use App\Enums\SgCategory;
use App\Models\SgBand;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A distance band a Round's Approach or Putting Strokes Gained can be entered by. */
#[TypeScript]
class SgBandData extends Data
{
    public function __construct(
        public string $id,
        public SgCategory $sg_category,
        public string $label,
        public ?string $distance_group,
    ) {}

    public static function fromBand(SgBand $band): self
    {
        return new self($band->id, $band->sg_category, $band->label(), $band->distanceGroup?->label());
    }
}
