<?php

namespace App\Data;

use App\Models\Round;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Round as a point along the trends, for the tooltip. */
#[TypeScript]
class TrendRoundData extends Data
{
    public function __construct(
        public string $id,
        public string $played_on,
        public string $course_name,
        public int $holes,
    ) {}

    public static function fromRound(Round $round): self
    {
        return new self($round->id, $round->played_on->toDateString(), $round->course_name, $round->holes);
    }
}
