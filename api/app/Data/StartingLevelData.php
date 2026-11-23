<?php

namespace App\Data;

use App\Models\StartingLevel;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A starting-Level band: from this Handicap Index up to the next band's, a golfer
 * starts at `level`. The first band has no `from`, so it holds everything below.
 */
#[TypeScript]
class StartingLevelData extends Data
{
    public function __construct(
        public ?string $from,
        public int $level,
    ) {}

    /** @return list<self> */
    public static function list(): array
    {
        return StartingLevel::orderBy('position')->get()
            ->map(fn (StartingLevel $band) => new self($band->from_handicap_index, $band->level))
            ->all();
    }
}
