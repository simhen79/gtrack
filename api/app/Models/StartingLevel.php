<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * A Handicap Index band and the Level a golfer starts a Game at within it. Shared by
 * every golfer and edited by admins.
 */
class StartingLevel extends Model
{
    use HasUuids;

    protected $fillable = ['position', 'from_handicap_index', 'level'];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'from_handicap_index' => 'decimal:1',
            'level' => 'integer',
        ];
    }
}
