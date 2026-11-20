<?php

namespace App\Data;

use App\Enums\SgCategory;
use App\Models\Round;
use App\Models\SgBand;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * One SG Category's trend over a Baseline's Rounds: rolling per-18 averages,
 * one point per Round, oldest first.
 */
#[TypeScript]
class SgTrendData extends Data
{
    public function __construct(
        public SgCategory $category,
        /** @var array<int, string> */
        public array $last_5,
        /** @var array<int, string> */
        public array $last_20,
        /** @var array<int, SgBandTrendData> Approach and Putting only, over the last 20 Rounds */
        public array $bands,
    ) {}

    /**
     * @param  Collection<int, Round>  $rounds  oldest first, with their band values loaded
     * @param  Collection<int, SgBand>  $bands  every SG band, in order
     */
    public static function fromRounds(SgCategory $category, Collection $rounds, Collection $bands): self
    {
        $per18 = $rounds->map(fn (Round $round) => $round->sgPer18($category))->values()->all();
        $last20 = $rounds->slice(-20);

        return new self(
            $category,
            self::rolling($per18, 5),
            self::rolling($per18, 20),
            $bands->where('sg_category', $category)
                ->map(fn (SgBand $band) => SgBandTrendData::fromRounds($band, $last20))
                ->values()->all(),
        );
    }

    /**
     * Each point averages the Round and those before it, up to `$window` Rounds,
     * so the first points average the Rounds available.
     *
     * @param  array<int, int>  $hundredths
     * @return array<int, string>
     */
    private static function rolling(array $hundredths, int $window): array
    {
        return array_map(function (int $i) use ($hundredths, $window) {
            $slice = array_slice($hundredths, max(0, $i - $window + 1), min($i + 1, $window));

            return number_format(round(array_sum($slice) / count($slice)) / 100, 2, '.', '');
        }, array_keys($hundredths));
    }
}
