<?php

namespace App\Data;

use App\Models\PracticeGround;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** The golfer's Practice Grounds by name, the archived ones apart, and the Facilities to pick from. */
#[TypeScript]
class PracticeGroundsData extends Data
{
    /**
     * @param  list<PracticeGroundData>  $practice_grounds
     * @param  list<PracticeGroundData>  $archived
     * @param  list<FacilityData>  $facilities
     */
    public function __construct(
        public array $practice_grounds,
        public array $archived,
        public array $facilities,
    ) {}

    public static function current(): self
    {
        $grounds = PracticeGround::with(PracticeGround::WITH)->orderBy('name')->get();

        return new self(
            $grounds->whereNull('archived_at')->map(PracticeGroundData::fromGround(...))->values()->all(),
            $grounds->whereNotNull('archived_at')->map(PracticeGroundData::fromGround(...))->values()->all(),
            FacilityData::list(),
        );
    }
}
