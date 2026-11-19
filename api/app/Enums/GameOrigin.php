<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** Who wrote a Game version. */
#[TypeScript]
enum GameOrigin: string
{
    case Llm = 'llm';
    case HandWritten = 'hand_written';
    case FirstLoad = 'first_load';
}
