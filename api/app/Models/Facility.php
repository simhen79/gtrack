<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A reference row, filled by migration and shared by every golfer. */
class Facility extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'seconds_per_ball' => 'integer',
        ];
    }

    /**
     * @return HasMany<Feature, $this>
     */
    public function features(): HasMany
    {
        return $this->hasMany(Feature::class)->orderBy('position');
    }
}
