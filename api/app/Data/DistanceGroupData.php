<?php

namespace App\Data;

use App\Enums\SgCategory;
use App\Models\DistanceGroup;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** An Approach or Putting distance group a Drill or Game can work in. */
#[TypeScript]
class DistanceGroupData extends Data
{
    public function __construct(
        public string $id,
        public SgCategory $sg_category,
        public string $label,
    ) {}

    /** @return list<self> Approach groups, then Putting groups, each nearest first. */
    public static function list(): array
    {
        return DistanceGroup::query()
            ->orderByRaw("sg_category = 'putting'")
            ->orderBy('position')
            ->get()
            ->map(fn (DistanceGroup $group) => new self($group->id, $group->sg_category, $group->label()))
            ->all();
    }
}
