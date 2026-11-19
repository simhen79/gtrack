<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An Open field of a Game version, something its Variations may change, such as target order. Shared, like its version. */
class OpenField extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['position', 'name'];

    /**
     * @return BelongsTo<GameVersion, $this>
     */
    public function gameVersion(): BelongsTo
    {
        return $this->belongsTo(GameVersion::class);
    }
}
