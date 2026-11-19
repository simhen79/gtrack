<?php

namespace App\Data;

use App\Enums\SgCategory;
use App\Models\Drill;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Drill as the admin sees and edits it. Its links are reference-table ids. */
#[TypeScript]
class DrillData extends Data
{
    /**
     * @param  list<string>  $facility_ids
     * @param  list<string>  $feature_ids
     * @param  list<string>  $distance_group_ids
     */
    public function __construct(
        public string $id,
        public string $name,
        public SgCategory $sg_category,
        public ?int $balls,
        public ?int $estimated_minutes,
        public ?int $seconds_per_ball,
        public string $setup,
        public ?string $source_concept,
        public ?string $source_url,
        public array $facility_ids,
        public array $feature_ids,
        public array $distance_group_ids,
        public ?string $retired_at,
    ) {}

    public static function fromDrill(Drill $drill): self
    {
        return new self(
            $drill->id,
            $drill->name,
            $drill->sg_category,
            $drill->balls,
            $drill->estimated_minutes,
            $drill->seconds_per_ball,
            $drill->setup,
            $drill->source_concept,
            $drill->source_url,
            $drill->facilities->modelKeys(),
            $drill->features->modelKeys(),
            $drill->distanceGroups->modelKeys(),
            $drill->retired_at?->toIso8601String(),
        );
    }
}
