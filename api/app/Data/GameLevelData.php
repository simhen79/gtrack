<?php

namespace App\Data;

use App\Models\GameLevel;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** One of a Game version's Levels, 1 to 5: a value per rules placeholder, and its targets. */
#[TypeScript]
class GameLevelData extends Data
{
    /** @param  array<string, string>  $settings */
    public function __construct(
        public int $level,
        public array $settings,
        public ?int $up,
        public ?int $down,
    ) {}

    public static function fromLevel(GameLevel $level): self
    {
        return new self($level->level, $level->settingValues(), $level->up, $level->down);
    }
}
