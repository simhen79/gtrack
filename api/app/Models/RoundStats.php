<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** A Round's advanced stats. Every one is optional. */
class RoundStats extends Model
{
    use BelongsToGolfer, HasUuids;

    /** Off the Tee, then the Approach miss cross, then Short Game. Penalties is the one count; the rest are percentages. */
    public const FIELDS = [
        'fairways_hit_percent', 'fairways_missed_left_percent', 'fairways_missed_right_percent', 'penalties',
        'approach_miss_long_percent', 'approach_miss_short_percent', 'approach_miss_left_percent', 'approach_miss_right_percent',
        'up_and_downs_percent', 'sand_saves_percent',
    ];

    protected $fillable = self::FIELDS;

    protected function casts(): array
    {
        return array_fill_keys(self::FIELDS, 'integer');
    }
}
