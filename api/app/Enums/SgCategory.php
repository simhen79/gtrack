<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** The four SG Categories, in their fixed order. */
#[TypeScript]
enum SgCategory: string
{
    case OffTheTee = 'off_the_tee';
    case Approach = 'approach';
    case ShortGame = 'short_game';
    case Putting = 'putting';
}
