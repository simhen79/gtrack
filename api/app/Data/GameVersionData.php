<?php

namespace App\Data;

use App\Enums\GameOrigin;
use App\Enums\GameStatus;
use App\Enums\ScoreBetter;
use App\Enums\ScoreEntry;
use App\Enums\SgCategory;
use App\Models\GameVersion;
use App\Models\Variation;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A version of a Game, with the Game's ULID as `game_id`. Its links are
 * reference-table ids; its Variations are the ones this golfer can see.
 */
#[TypeScript]
class GameVersionData extends Data
{
    /**
     * @param  list<string>  $facility_ids
     * @param  list<string>  $feature_ids
     * @param  list<string>  $distance_group_ids
     * @param  list<string>  $open
     * @param  list<int>  $pad_values
     * @param  list<GameLevelData>  $levels
     * @param  list<VariationData>  $variations
     */
    public function __construct(
        public string $id,
        public string $game_id,
        public int $version,
        public GameStatus $status,
        public GameOrigin $origin,
        public string $name,
        public SgCategory $sg_category,
        public ?int $balls,
        public ?int $estimated_minutes,
        public ?int $seconds_per_ball,
        public string $rules,
        public string $scoring,
        public ScoreBetter $score_better,
        public ScoreEntry $score_entry,
        public ?string $source_concept,
        public ?string $source_url,
        public array $facility_ids,
        public array $feature_ids,
        public array $distance_group_ids,
        public array $open,
        public array $pad_values,
        public array $levels,
        public array $variations,
        public ?string $published_at,
        public ?string $retired_at,
        public ?string $replaced_at,
    ) {}

    /** The relations `fromVersion` reads, to load up front. */
    public const WITH = ['facilities', 'features', 'distanceGroups', 'openFields', 'padValues', 'levels.settings', 'variations'];

    public static function fromVersion(GameVersion $version): self
    {
        return new self(
            $version->id,
            $version->game_id,
            $version->version,
            $version->status,
            $version->origin,
            $version->name,
            $version->sg_category,
            $version->balls,
            $version->estimated_minutes,
            $version->seconds_per_ball,
            $version->rules,
            $version->scoring,
            $version->score_better,
            $version->score_entry,
            $version->source_concept,
            $version->source_url,
            $version->facilities->modelKeys(),
            $version->features->modelKeys(),
            $version->distanceGroups->modelKeys(),
            $version->openFields->pluck('name')->all(),
            $version->padValues->pluck('value')->all(),
            $version->levels->map(GameLevelData::fromLevel(...))->all(),
            $version->variations
                ->filter(fn (Variation $variation) => $variation->retired_at === null)
                ->map(VariationData::fromVariation(...))
                ->values()
                ->all(),
            $version->published_at?->toIso8601String(),
            $version->retired_at?->toIso8601String(),
            $version->replaced_at?->toIso8601String(),
        );
    }
}
