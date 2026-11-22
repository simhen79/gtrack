<?php

namespace Database\Factories;

use App\Models\PracticeGround;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Creates rows for the current golfer, like the app does.
 *
 * @extends Factory<PracticeGround>
 */
class PracticeGroundFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->city().' driving range'];
    }
}
