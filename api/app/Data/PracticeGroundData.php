<?php

namespace App\Data;

use App\Models\PracticeGround;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Practice Ground with the Facilities it has and their features, in their fixed order. */
#[TypeScript]
class PracticeGroundData extends Data
{
    /**
     * @param  list<string>  $facility_ids
     * @param  list<string>  $feature_ids
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $note,
        public array $facility_ids,
        public array $feature_ids,
        /** When it was archived, or null while it's on the golfer's list. */
        public ?string $archived_at,
    ) {}

    public static function fromGround(PracticeGround $ground): self
    {
        return new self(
            $ground->id,
            $ground->name,
            $ground->note,
            $ground->facilities->pluck('id')->all(),
            $ground->features->pluck('id')->all(),
            $ground->archived_at?->toIso8601String(),
        );
    }
}
