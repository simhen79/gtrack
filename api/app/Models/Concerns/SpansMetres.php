<?php

namespace App\Models\Concerns;

/**
 * A distance from `min_metres` up to `max_metres`, open-ended when there's no max.
 */
trait SpansMetres
{
    /** "50–75 m", or "200+ m" when open-ended. */
    public function label(): string
    {
        return $this->max_metres === null
            ? "{$this->min_metres}+ m"
            : "{$this->min_metres}–{$this->max_metres} m";
    }
}
