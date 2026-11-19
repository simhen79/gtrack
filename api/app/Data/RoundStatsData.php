<?php

namespace App\Data;

use App\Models\RoundStats;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Round's advanced stats, each null until the golfer enters it. */
#[TypeScript]
class RoundStatsData extends Data
{
    public function __construct(
        public ?int $fairways_hit_percent = null,
        public ?int $fairways_missed_left_percent = null,
        public ?int $fairways_missed_right_percent = null,
        public ?int $penalties = null,
        public ?int $approach_miss_long_percent = null,
        public ?int $approach_miss_short_percent = null,
        public ?int $approach_miss_left_percent = null,
        public ?int $approach_miss_right_percent = null,
        public ?int $up_and_downs_percent = null,
        public ?int $sand_saves_percent = null,
    ) {}

    public static function fromStats(?RoundStats $stats): self
    {
        return new self(...$stats?->only(RoundStats::FIELDS) ?? []);
    }
}
