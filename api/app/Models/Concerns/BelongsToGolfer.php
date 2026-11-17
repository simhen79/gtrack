<?php

namespace App\Models\Concerns;

use App\Auth\CurrentGolfer;
use App\Models\Scopes\GolferScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

trait BelongsToGolfer
{
    public static function bootBelongsToGolfer(): void
    {
        static::addGlobalScope(new GolferScope);

        static::creating(function (self $model) {
            $golferId = app(CurrentGolfer::class)->id();

            if ($model->user_id !== null && $model->user_id !== $golferId) {
                throw new LogicException('Golfer-owned rows can only be created for the current golfer.');
            }

            $model->user_id = $golferId;
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
