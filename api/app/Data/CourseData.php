<?php

namespace App\Data;

use App\Models\Round;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A course the golfer has played, with the tees they played it from, newest first. */
#[TypeScript]
class CourseData extends Data
{
    /**
     * @param  string[]  $tees
     */
    public function __construct(
        public string $name,
        public array $tees,
    ) {}

    /**
     * The courses of the golfer's Rounds, the most recently played first.
     *
     * @return Collection<int, self>
     */
    public static function played(): Collection
    {
        return Round::latest('played_on')->latest()->get(['course_name', 'tees'])
            ->groupBy('course_name')
            ->map(fn (Collection $rounds, string $name) => new self($name, $rounds->pluck('tees')->filter()->unique()->values()->all()))
            ->values();
    }
}
