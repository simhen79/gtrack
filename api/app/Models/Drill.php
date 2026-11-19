<?php

namespace App\Models;

use App\Enums\SgCategory;
use Database\Factories\DrillFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Unscored practice in the Catalogue. Edited in place: no Drafts, versions or Levels.
 * Shared by every golfer.
 */
class Drill extends Model
{
    /** @use HasFactory<DrillFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'name', 'sg_category', 'balls', 'estimated_minutes', 'seconds_per_ball',
        'setup', 'source_concept', 'source_url',
    ];

    protected function casts(): array
    {
        return [
            'sg_category' => SgCategory::class,
            'balls' => 'integer',
            'estimated_minutes' => 'integer',
            'seconds_per_ball' => 'integer',
            'retired_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Facility, $this>
     */
    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'drill_facility');
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'drill_feature');
    }

    /**
     * @return BelongsToMany<DistanceGroup, $this>
     */
    public function distanceGroups(): BelongsToMany
    {
        return $this->belongsToMany(DistanceGroup::class, 'drill_distance_group');
    }
}
