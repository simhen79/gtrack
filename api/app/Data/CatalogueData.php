<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** The Catalogue as a golfer reads it: published Games and Drills that aren't retired. */
#[TypeScript]
class CatalogueData extends Data
{
    /**
     * @param  list<GameVersionData>  $games
     * @param  list<DrillData>  $drills
     */
    public function __construct(
        public array $games,
        public array $drills,
    ) {}
}
