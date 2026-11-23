<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One of a Game version's five Levels: its targets and its settings. Shared, like its version. */
class GameLevel extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['level', 'up', 'down'];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'up' => 'integer',
            'down' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<GameVersion, $this>
     */
    public function gameVersion(): BelongsTo
    {
        return $this->belongsTo(GameVersion::class);
    }

    /**
     * @return HasMany<GameLevelSetting, $this>
     */
    public function settings(): HasMany
    {
        return $this->hasMany(GameLevelSetting::class);
    }

    /**
     * The Level's value for each placeholder it sets.
     *
     * @return array<string, string>
     */
    public function settingValues(): array
    {
        return $this->settings->pluck('value', 'key')->all();
    }
}
