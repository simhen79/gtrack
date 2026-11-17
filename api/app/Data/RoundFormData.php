<?php

namespace App\Data;

use App\Models\Round;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * What the Round entry form opens with: a saved Round when editing, or the
 * details carried over from the last Round when entering a new one.
 */
#[TypeScript]
class RoundFormData extends Data
{
    public function __construct(
        public ?string $id,
        public string $played_on,
        public string $course_name,
        public ?string $tees,
        public ?int $holes,
        public ?int $par,
        public ?int $score,
        public ?string $handicap_index,
        public ?int $course_handicap,
        public ?string $baseline_id,
        public ?string $sg_off_the_tee,
        public ?string $sg_approach,
        public ?string $sg_short_game,
        public ?string $sg_putting,
    ) {}

    public static function fromRound(Round $round): self
    {
        return new self(
            $round->id,
            $round->played_on->toDateString(),
            $round->course_name,
            $round->tees,
            $round->holes,
            $round->par,
            $round->score,
            $round->handicap_index,
            $round->course_handicap,
            $round->baseline_id,
            $round->sg_off_the_tee,
            $round->sg_approach,
            $round->sg_short_game,
            $round->sg_putting,
        );
    }

    /** Course, holes, tees, par, handicaps and Baseline carry over; the day's numbers don't. */
    public static function carriedOver(string $today, ?Round $last, ?string $defaultBaselineId): self
    {
        return new self(
            null,
            $today,
            $last->course_name ?? '',
            $last?->tees,
            $last->holes ?? 18,
            $last?->par,
            null,
            $last?->handicap_index,
            $last?->course_handicap,
            $last->baseline_id ?? $defaultBaselineId,
            null, null, null, null,
        );
    }
}
