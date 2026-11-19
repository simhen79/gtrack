<?php

namespace App\Data;

use App\Models\Round;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A row on the golfer's list of Rounds, with what its detail shows. */
#[TypeScript]
class RoundSummaryData extends Data
{
    public function __construct(
        public string $id,
        public string $played_on,
        public string $course_name,
        public int $holes,
        public int $score,
        public string $baseline,
        public string $sg_total,
        public string $sg_off_the_tee,
        public string $sg_approach,
        public string $sg_short_game,
        public string $sg_putting,
        public RoundStatsData $stats,
    ) {}

    public static function fromRound(Round $round): self
    {
        return new self(
            $round->id,
            $round->played_on->toDateString(),
            $round->course_name,
            $round->holes,
            $round->score,
            $round->baseline->name,
            $round->sgTotal(),
            $round->sg_off_the_tee,
            $round->sg_approach,
            $round->sg_short_game,
            $round->sg_putting,
            RoundStatsData::fromStats($round->stats),
        );
    }
}
