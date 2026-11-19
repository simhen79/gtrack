<?php

namespace App\Models;

use App\Enums\GameOrigin;
use App\Enums\GameStatus;
use App\Enums\ScoreBetter;
use App\Enums\ScoreEntry;
use App\Enums\SgCategory;
use Database\Factories\GameVersionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One version of a Game: a Draft, the published version, or a retired one.
 * Shared by every golfer.
 */
class GameVersion extends Model
{
    /** @use HasFactory<GameVersionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'version', 'status', 'origin', 'name', 'sg_category', 'balls', 'estimated_minutes',
        'seconds_per_ball', 'rules', 'scoring', 'score_better', 'score_entry',
        'source_concept', 'source_url', 'published_at', 'retired_at',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'status' => GameStatus::class,
            'origin' => GameOrigin::class,
            'sg_category' => SgCategory::class,
            'balls' => 'integer',
            'estimated_minutes' => 'integer',
            'seconds_per_ball' => 'integer',
            'score_better' => ScoreBetter::class,
            'score_entry' => ScoreEntry::class,
            'published_at' => 'datetime',
            'retired_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Game, $this>
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * @return BelongsToMany<Facility, $this>
     */
    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'game_version_facility');
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'game_version_feature');
    }

    /**
     * @return BelongsToMany<DistanceGroup, $this>
     */
    public function distanceGroups(): BelongsToMany
    {
        return $this->belongsToMany(DistanceGroup::class, 'game_version_distance_group');
    }

    /**
     * @return HasMany<OpenField, $this>
     */
    public function openFields(): HasMany
    {
        return $this->hasMany(OpenField::class)->orderBy('position');
    }

    /**
     * @return HasMany<PadValue, $this>
     */
    public function padValues(): HasMany
    {
        return $this->hasMany(PadValue::class)->orderBy('position');
    }

    /**
     * @return HasMany<Variation, $this>
     */
    public function variations(): HasMany
    {
        return $this->hasMany(Variation::class);
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeStatus(Builder $query, GameStatus $status): void
    {
        $query->where('status', $status);
    }
}
