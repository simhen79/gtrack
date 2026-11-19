<?php

namespace App\Models;

use App\Enums\SgCategory;
use App\Models\Concerns\SpansMetres;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A distance band that Approach or Putting Strokes Gained can be entered by.
 * A reference row, filled by migration and shared by every golfer.
 */
class SgBand extends Model
{
    use HasUuids, SpansMetres;

    protected function casts(): array
    {
        return [
            'sg_category' => SgCategory::class,
            'min_metres' => 'integer',
            'max_metres' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<DistanceGroup, $this>
     */
    public function distanceGroup(): BelongsTo
    {
        return $this->belongsTo(DistanceGroup::class);
    }

    /**
     * Approach bands, then Putting bands, each nearest first.
     *
     * @param  Builder<self>  $query
     */
    public function scopeInOrder(Builder $query): void
    {
        $query->orderByRaw("sg_category = 'putting'")->orderBy('position');
    }
}
