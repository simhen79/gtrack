<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** A Round's advanced stats. Every one is optional. */
class RoundStats extends Model
{
    use BelongsToGolfer, HasUuids;

    /** The counts, then the Approach miss percentages, then up and downs. */
    public const FIELDS = [
        'fairways_hit', 'fairways_missed_left', 'fairways_missed_right', 'penalties',
        'approach_miss_long_percent', 'approach_miss_short_percent', 'approach_miss_left_percent', 'approach_miss_right_percent',
        'up_and_downs_made', 'up_and_downs_attempted',
    ];

    protected $fillable = self::FIELDS;

    protected function casts(): array
    {
        return array_fill_keys(self::FIELDS, 'integer');
    }
}
