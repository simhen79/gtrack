<?php

namespace Database\Factories;

use App\Enums\GameOrigin;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\GameVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A Draft of a new Game with no Levels, unless a state says otherwise.
 *
 * @extends Factory<GameVersion>
 */
class GameVersionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'game_id' => fn () => Game::create()->id,
            'version' => 1,
            'status' => GameStatus::Draft,
            'origin' => GameOrigin::HandWritten,
            'name' => fake()->unique()->words(2, true),
            'sg_category' => 'off_the_tee',
            'balls' => 10,
            'rules' => 'Pick two targets 30 m apart as a fairway. Hit 10 drives.',
            'scoring' => '1 point per ball that finishes inside',
            'score_better' => 'higher',
            'score_entry' => 'counter',
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => GameStatus::Published, 'published_at' => now()]);
    }
}
