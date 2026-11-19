<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** How a golfer enters a Game's score on the phone. */
#[TypeScript]
enum ScoreEntry: string
{
    case Counter = 'counter';
    case Pad = 'pad';
    case Timer = 'timer';
}
