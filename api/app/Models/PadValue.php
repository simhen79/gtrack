<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One value on a Game version's large pad, in order. Shared, like its version. */
class PadValue extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['position', 'value'];

    protected function casts(): array
    {
        return ['value' => 'integer'];
    }

    /**
     * @return BelongsTo<GameVersion, $this>
     */
    public function gameVersion(): BelongsTo
    {
        return $this->belongsTo(GameVersion::class);
    }
}
