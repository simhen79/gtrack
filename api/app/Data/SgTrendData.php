<?php

namespace App\Data;

use App\Enums\SgCategory;
use App\Models\Round;
use App\Models\SgBand;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * One SG Category over the golfer's most recent Rounds on a Baseline: each shown Round's
 * per-18 value, oldest first, their average, and the last 20 Rounds' average to compare with.
 */
#[TypeScript]
class SgTrendData extends Data
{
    public function __construct(
        public SgCategory $category,
        /** @var array<int, string> one per shown Round, oldest first */
        public array $values,
        /** The shown Rounds' average; null with no Rounds. */
        public ?string $recent,
        /** The last 20 Rounds' average; null with no Rounds. */
        public ?string $last_20,
        /** @var array<int, SgBandTrendData> Approach and Putting only, over the last 20 Rounds */
        public array $bands,
    ) {}

    /**
     * @param  Collection<int, Round>  $rounds  oldest first, with their band values loaded
     * @param  Collection<int, SgBand>  $bands  every SG band, in order
     * @param  int  $window  how many of the most recent Rounds to show
     */
    public static function fromRounds(SgCategory $category, Collection $rounds, Collection $bands, int $window): self
    {
        $per18 = $rounds->map(fn (Round $round) => $round->sgPer18($category))->values()->all();
        $shown = array_slice($per18, -$window);
        $last20 = $rounds->slice(-20);

        return new self(
            $category,
            array_map(self::format(...), $shown),
            self::mean($shown),
            self::mean(array_slice($per18, -20)),
            $bands->where('sg_category', $category)
                ->map(fn (SgBand $band) => SgBandTrendData::fromRounds($band, $last20))
                ->values()->all(),
        );
    }

    /** @param  array<int, int>  $hundredths */
    private static function mean(array $hundredths): ?string
    {
        return $hundredths === [] ? null : self::format(array_sum($hundredths) / count($hundredths));
    }

    private static function format(int|float $hundredths): string
    {
        return number_format(round($hundredths) / 100, 2, '.', '');
    }
}
