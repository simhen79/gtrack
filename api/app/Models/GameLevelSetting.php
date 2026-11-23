<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A Level's value for one rules placeholder, such as `zone` = 30. Shared, like its version. */
class GameLevelSetting extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['key', 'value'];

    /**
     * @return BelongsTo<GameLevel, $this>
     */
    public function gameLevel(): BelongsTo
    {
        return $this->belongsTo(GameLevel::class);
    }
}
