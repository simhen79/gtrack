<?php

namespace Database\Factories;

use App\Models\Baseline;
use App\Models\Round;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Creates rows for the current golfer, like the app does.
 *
 * @extends Factory<Round>
 */
class RoundFactory extends Factory
{
    public function definition(): array
    {
        return [
            'baseline_id' => Baseline::factory(),
            'played_on' => fake()->dateTimeBetween('-1 year')->format('Y-m-d'),
            'course_name' => fake()->city().' Golf Club',
            'holes' => 18,
            'score' => fake()->numberBetween(70, 100),
            'handicap_index' => fake()->randomFloat(1, 0, 30),
            'course_handicap' => fake()->numberBetween(0, 34),
            'sg_off_the_tee' => fake()->randomFloat(2, -4, 2),
            'sg_approach' => fake()->randomFloat(2, -4, 2),
            'sg_short_game' => fake()->randomFloat(2, -4, 2),
            'sg_putting' => fake()->randomFloat(2, -4, 2),
        ];
    }
}
