<?php

namespace App\Models\Concerns;

use App\Auth\CurrentGolfer;
use App\Models\Scopes\GolferScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToGolfer
{
    public static function bootBelongsToGolfer(): void
    {
        static::addGlobalScope(new GolferScope);

        static::creating(function (self $model) {
            $model->user_id ??= app(CurrentGolfer::class)->id();
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function golfer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
