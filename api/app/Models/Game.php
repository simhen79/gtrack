<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Game in the Catalogue, which keeps its ULID across versions. Everything a golfer
 * plays lives on its versions. Shared by every golfer.
 */
class Game extends Model
{
    use HasUlids;

    /**
     * @return HasMany<GameVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(GameVersion::class);
    }
}
