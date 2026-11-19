<?php

namespace Database\Factories;

use App\Models\Drill;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Drill>
 */
class DrillFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'sg_category' => 'putting',
            'balls' => 20,
            'setup' => 'Two tees just wider than the putter head.',
        ];
    }
}
