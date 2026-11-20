<?php

namespace App\Data;

use App\Models\Round;
use App\Models\RoundSgBand;
use App\Models\SgBand;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A distance band's Strokes Gained per 18, averaged over the Rounds that entered it; null when none did. */
#[TypeScript]
class SgBandTrendData extends Data
{
    public function __construct(
        public string $id,
        public string $label,
        public ?string $value,
    ) {}

    /** @param  Collection<int, Round>  $rounds  with their band values loaded */
    public static function fromRounds(SgBand $band, Collection $rounds): self
    {
        $per18 = $rounds->flatMap(fn (Round $round) => $round->sgBands
            ->where('sg_band_id', $band->id)
            ->map(fn (RoundSgBand $entered) => $round->per18($entered->value)));

        return new self(
            $band->id,
            $band->label(),
            $per18->isEmpty() ? null : number_format(round($per18->avg()) / 100, 2, '.', ''),
        );
    }
}
