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

    public function label(): string
    {
        return match ($this) {
            self::OffTheTee => 'Off the Tee',
            self::Approach => 'Approach',
            self::ShortGame => 'Short Game',
            self::Putting => 'Putting',
        };
    }

    /**
     * The Facilities this SG Category can be played at, by Facility key (spec: Facilities
     * by SG Category). A Game lists only these; so do the categories the Facilities allow.
     *
     * @return list<string>
     */
    public function facilityKeys(): array
    {
        return match ($this) {
            self::OffTheTee, self::Approach => ['range_bay'],
            self::ShortGame => ['chipping_area', 'practice_bunker', 'range_bay'],
            self::Putting => ['putting_green'],
        };
    }

    /** Whether its Games and Drills are split by distance group. */
    public function hasDistanceGroups(): bool
    {
        return $this === self::Approach || $this === self::Putting;
    }
}
