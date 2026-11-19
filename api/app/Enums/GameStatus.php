<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** Where a Game version is in its life: a Draft, in the Catalogue, or retired. */
#[TypeScript]
enum GameStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Retired = 'retired';
}
