<?php

namespace App\Data;

use App\Models\Facility;
use App\Models\Feature;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Facility with its features, in their fixed order. */
#[TypeScript]
class FacilityData extends Data
{
    /** @param list<FeatureData> $features */
    public function __construct(
        public string $id,
        public string $key,
        public string $name,
        public array $features,
    ) {}

    /** @return list<self> */
    public static function list(): array
    {
        return Facility::with('features')->orderBy('position')->get()->map(fn (Facility $facility) => new self(
            $facility->id,
            $facility->key,
            $facility->name,
            $facility->features->map(fn (Feature $feature) => new FeatureData($feature->id, $feature->key, $feature->name))->all(),
        ))->all();
    }
}
