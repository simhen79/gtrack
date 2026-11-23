<?php

namespace Database\Factories;

use App\Enums\GameOrigin;
use App\Enums\GameStatus;
use App\Models\Facility;
use App\Models\Game;
use App\Models\GameVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A Draft of a new Game on the range with no Levels, unless a state says otherwise.
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

    public function configure(): static
    {
        // A Game is played somewhere: the first Facility its SG Category allows.
        return $this->afterCreating(function (GameVersion $version) {
            if (! $version->facilities()->exists()) {
                $version->facilities()->attach(Facility::where('key', $version->sg_category->facilityKeys()[0])->value('id'));
            }
        });
    }

    public function published(): static
    {
        return $this->state(['status' => GameStatus::Published, 'published_at' => now()]);
    }

    /** @param  list<string>  $names */
    public function withOpen(array $names): static
    {
        return $this->afterCreating(fn (GameVersion $version) => $version->openFields()->createMany(
            collect($names)->map(fn (string $name, int $position) => ['position' => $position, 'name' => $name])->all(),
        ));
    }

    /** @param  list<int>  $values */
    public function withPadValues(array $values): static
    {
        return $this->afterCreating(fn (GameVersion $version) => $version->padValues()->createMany(
            collect($values)->map(fn (int $value, int $position) => ['position' => $position, 'value' => $value])->all(),
        ));
    }

    /**
     * Levels with these up and down targets, each setting every placeholder the rules use.
     *
     * @param  list<array{0: int, 1: int}>  $targets  [up, down] per Level, from Level 1
     */
    public function withLevels(array $targets): static
    {
        return $this->afterCreating(function (GameVersion $version) use ($targets) {
            preg_match_all('/\{([a-z_]+)\}/', $version->rules, $placeholders);
            foreach ($targets as $index => [$up, $down]) {
                $level = $version->levels()->create(['level' => $index + 1, 'up' => $up, 'down' => $down]);
                $level->settings()->createMany(collect(array_unique($placeholders[1]))
                    ->map(fn (string $key) => ['key' => $key, 'value' => (string) (30 - 5 * $index)])->values()->all());
            }
        });
    }
}
