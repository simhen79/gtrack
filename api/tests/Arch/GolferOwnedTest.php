<?php

use App\Models\Concerns\BelongsToGolfer;
use App\Models\User;

// Fail closed: a new model is golfer-owned unless it's added here as shared,
// on purpose (spec: Access).
$shared = [
    User::class,
];

arch('every golfer-owned model uses BelongsToGolfer')
    ->expect('App\Models')
    ->classes()
    ->toUseTrait(BelongsToGolfer::class)
    ->ignoring([...$shared, 'App\Models\Concerns', 'App\Models\Scopes']);
