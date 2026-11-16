<?php

namespace App\Models\Scopes;

use App\Auth\CurrentGolfer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Limits golfer-owned rows to the current golfer, and throws when there is none
 * (fail closed).
 */
class GolferScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where($model->qualifyColumn('user_id'), app(CurrentGolfer::class)->id());
    }
}
