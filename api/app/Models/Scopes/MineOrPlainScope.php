<?php

namespace App\Models\Scopes;

use App\Auth\CurrentGolfer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Limits Variations to the shared plain ones and the current golfer's own, and
 * throws when there is no current golfer (fail closed), as GolferScope does.
 */
class MineOrPlainScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $golferId = app(CurrentGolfer::class)->id();

        $builder->where(fn (Builder $query) => $query
            ->where($model->qualifyColumn('is_plain'), true)
            ->orWhere($model->qualifyColumn('user_id'), $golferId));
    }
}
