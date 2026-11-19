<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** Which way a Game's score improves. */
#[TypeScript]
enum ScoreBetter: string
{
    case Higher = 'higher';
    case Lower = 'lower';
}
