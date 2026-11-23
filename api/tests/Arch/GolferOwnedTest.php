<?php

use App\Models\Concerns\BelongsToGolfer;
use App\Models\DistanceGroup;
use App\Models\Drill;
use App\Models\Facility;
use App\Models\Feature;
use App\Models\Game;
use App\Models\GameLevel;
use App\Models\GameLevelSetting;
use App\Models\GameVersion;
use App\Models\OpenField;
use App\Models\PadValue;
use App\Models\SgBand;
use App\Models\StartingLevel;
use App\Models\User;
use App\Models\Variation;

// Fail closed: a new model is golfer-owned unless it's added here as shared,
// on purpose (spec: Access).
$shared = [
    User::class,
    DistanceGroup::class,
    SgBand::class,
    Facility::class,
    Feature::class,
    Game::class,
    GameVersion::class,
    OpenField::class,
    PadValue::class,
    GameLevel::class,
    GameLevelSetting::class,
    StartingLevel::class,
    Drill::class,
    // Plain Variations are shared and LLM-written ones are a golfer's, so its own
    // MineOrPlainScope stands in for BelongsToGolfer.
    Variation::class,
];

arch('every golfer-owned model uses BelongsToGolfer')
    ->expect('App\Models')
    ->classes()
    ->toUseTrait(BelongsToGolfer::class)
    ->ignoring([...$shared, 'App\Models\Concerns', 'App\Models\Scopes']);
