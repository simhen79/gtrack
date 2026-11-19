<?php

namespace App\Models;

use App\Enums\SgCategory;
use App\Models\Concerns\SpansMetres;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** A reference row, filled by migration and shared by every golfer. */
class DistanceGroup extends Model
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
}
