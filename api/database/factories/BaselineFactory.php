<?php

namespace Database\Factories;

use App\Models\Baseline;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Creates rows for the current golfer, like the app does.
 *
 * @extends Factory<Baseline>
 */
class BaselineFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => fake()->unique()->randomElement(['Scratch', 'Tour', '10 handicap', '20 handicap'])];
    }
}
