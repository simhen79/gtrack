<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** A Round's Strokes Gained in one distance band. */
class RoundSgBand extends Model
{
    use BelongsToGolfer, HasUuids;

    protected $fillable = ['sg_band_id', 'value'];

    protected function casts(): array
    {
        return ['value' => 'decimal:2'];
    }
}
