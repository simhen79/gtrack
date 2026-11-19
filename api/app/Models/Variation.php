<?php

namespace App\Models;

use App\Models\Scopes\MineOrPlainScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Setup wording for a Game version. The plain Variation is shared and made when the
 * version is published; an LLM-written one belongs to one golfer, so a golfer sees
 * the plain ones and their own.
 */
class Variation extends Model
{
    use HasUuids;

    protected $fillable = ['wording', 'miss_direction', 'is_plain', 'retired_at'];

    protected static function booted(): void
    {
        static::addGlobalScope(new MineOrPlainScope);
    }

    protected function casts(): array
    {
        return [
            'is_plain' => 'boolean',
            'retired_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<GameVersion, $this>
     */
    public function gameVersion(): BelongsTo
    {
        return $this->belongsTo(GameVersion::class);
    }
}
