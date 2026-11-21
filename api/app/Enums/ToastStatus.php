<?php

namespace App\Enums;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A Toast's status disc: done, or failed. */
#[TypeScript]
enum ToastStatus: string
{
    case Success = 'success';
    case Danger = 'danger';
}
