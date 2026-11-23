<?php

namespace App\Catalogue;

use App\Enums\GameOrigin;
use App\Enums\GameStatus;
use App\Enums\ScoreBetter;
use App\Enums\ScoreEntry;
use App\Enums\SgCategory;
use App\Models\DistanceGroup;
use App\Models\Facility;
use App\Models\Feature;
use App\Models\Game;
use App\Models\GameLevel;
use App\Models\GameVersion;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Publishes Games into the Catalogue: a hand-written Game, an edited one, or an
 * approved Draft. Every path runs the publish check on the rows it wrote, inside its
 * transaction, so a refused publish leaves nothing behind.
 *
 * Content is a Game in the editor's shape: the version's fields, plus `facility_ids`,
 * `feature_ids`, `distance_group_ids`, `open`, `pad_values` and `levels`, each Level
 * as `['settings' => [placeholder => value], 'up' => int, 'down' => int]`.
 */
class Publisher
{
    /**
     * A new Game, written by hand, published as v1.
     *
     * @param  array<string, mixed>  $content
     *
     * @throws ValidationException keyed by the editor's fields when the check fails
     */
    public function publishNew(array $content): GameVersion
    {
        return DB::transaction(function () use ($content) {
            $version = Game::create()->versions()->make([
                'version' => 1,
                'status' => GameStatus::Published,
                'origin' => GameOrigin::HandWritten,
                'published_at' => now(),
            ]);
            $this->write($version, $content);
            $this->publish($version);

            return $version;
        });
    }

    /**
     * Saves an edited Game. A Draft is written and published. A published version is
     * edited in place, unless a field that makes it a different Game changed: then the
     * edit is published as the next version, and the old one is retired as replaced.
     *
     * @param  array<string, mixed>  $content
     *
     * @throws ValidationException keyed by the editor's fields when the check fails
     */
    public function save(Game $game, array $content): GameVersion
    {
        return DB::transaction(function () use ($game, $content) {
            $current = $game->editableVersion()->lockForUpdate()->firstOrFail();

            if ($current->status === GameStatus::Draft) {
                $current->forceFill(['status' => GameStatus::Published, 'published_at' => now()]);
                $this->write($current, $content);
                $this->publish($current);

                return $current;
            }

            // Another SG Category is another Game, and would drop Facilities it can't use.
            if ($current->sg_category->value !== $content['sg_category']) {
                throw ValidationException::withMessages([
                    'sg_category' => 'Fixed once published. For another SG Category, write a new Game.',
                ]);
            }

            if (! $this->changesTheGame($current, $content)) {
                $this->write($current, $content);
                $this->check($current);

                return $current;
            }

            $current->forceFill(['status' => GameStatus::Retired, 'retired_at' => now(), 'replaced_at' => now()])->save();
            $next = $game->versions()->make([
                'version' => $current->version + 1,
                'status' => GameStatus::Published,
                'origin' => GameOrigin::HandWritten,
                'published_at' => now(),
            ]);
            $this->write($next, $content);
            $this->publish($next);

            return $next;
        });
    }

    /**
     * Writes a version of a Game as a Draft, without the publish check: Approve runs
     * it later. The Game keeps the ULID it's given.
     *
     * @param  array<string, mixed>  $content
     */
    public function draft(string $gameId, int $version, GameOrigin $origin, array $content): GameVersion
    {
        return DB::transaction(function () use ($gameId, $version, $origin, $content) {
            $game = Game::find($gameId) ?? Game::forceCreate(['id' => $gameId]);
            $draft = $game->versions()->make([
                'version' => $version,
                'status' => GameStatus::Draft,
                'origin' => $origin,
            ]);
            $this->write($draft, $content);

            return $draft;
        });
    }

    /**
     * Approves a Draft as it stands.
     *
     * @throws ValidationException under `approve` when the check fails or the Game
     *                             already has a published version
     */
    public function approve(GameVersion $draft): void
    {
        DB::transaction(function () use ($draft) {
            try {
                $draft->forceFill(['status' => GameStatus::Published, 'published_at' => now()])->save();
            } catch (UniqueConstraintViolationException) {
                // The database allows one published version per Game.
                throw ValidationException::withMessages([
                    'approve' => 'This Game already has a published version. Retire it before approving this one.',
                ]);
            }

            $problems = $this->problems($draft);
            if ($problems !== []) {
                // The Catalogue shows one message; the editor shows each under its field.
                throw ValidationException::withMessages(['approve' => reset($problems)]);
            }

            $this->publish($draft);
        });
    }

    /**
     * Writes the content into the version and its child rows, replacing what was there.
     *
     * @param  array<string, mixed>  $content
     */
    private function write(GameVersion $version, array $content): void
    {
        $version->fill([
            'name' => $content['name'] ?? '',
            'sg_category' => $content['sg_category'],
            'balls' => $content['balls'] ?? null,
            'estimated_minutes' => $content['estimated_minutes'] ?? null,
            'seconds_per_ball' => $content['seconds_per_ball'] ?? null,
            'rules' => $content['rules'] ?? '',
            'scoring' => $content['scoring'] ?? '',
            'score_better' => $content['score_better'],
            'score_entry' => $content['score_entry'],
            'source_concept' => $content['source_concept'] ?? null,
            'source_url' => $content['source_url'] ?? null,
        ])->save();

        $version->facilities()->sync($content['facility_ids']);
        $version->features()->sync($content['feature_ids']);
        $version->distanceGroups()->sync($content['distance_group_ids']);

        $version->openFields()->delete();
        $version->openFields()->createMany(collect($content['open'])
            ->map(fn (string $name, int $position) => ['position' => $position, 'name' => $name])->all());

        $version->padValues()->delete();
        $version->padValues()->createMany(collect($content['pad_values'])
            ->map(fn (int $value, int $position) => ['position' => $position, 'value' => $value])->all());

        $version->levels()->delete();
        foreach (array_values($content['levels']) as $index => $row) {
            /** @var GameLevel $level */
            $level = $version->levels()->create(['level' => $index + 1, 'up' => $row['up'] ?? null, 'down' => $row['down'] ?? null]);
            $level->settings()->createMany(collect($row['settings'] ?? [])
                ->filter(fn (?string $value) => trim((string) $value) !== '')
                ->map(fn (string $value, string $key) => ['key' => $key, 'value' => trim($value)])
                ->values()->all());
        }
    }

    /**
     * Checks a version that's now published, and gives it its plain Variation.
     *
     * @throws ValidationException keyed by the editor's fields when the check fails
     */
    private function publish(GameVersion $version): void
    {
        $this->check($version);
        $version->variations()->create(['wording' => $version->rules, 'is_plain' => true]);
    }

    /**
     * @throws ValidationException keyed by the editor's fields when the check fails
     */
    private function check(GameVersion $version): void
    {
        $problems = $this->problems($version);
        if ($problems !== []) {
            throw ValidationException::withMessages($problems);
        }
    }

    /**
     * Whether the content changes what a score on this version means: its rules, scoring,
     * ball count or time, Facilities or features. Level settings and targets don't.
     *
     * @param  array<string, mixed>  $content
     */
    private function changesTheGame(GameVersion $version, array $content): bool
    {
        $ids = fn (iterable $ids) => collect($ids)->sort()->values()->all();
        $whole = fn (string $field) => isset($content[$field]) ? (int) $content[$field] : null;

        return $version->rules !== ($content['rules'] ?? '')
            || $version->scoring !== ($content['scoring'] ?? '')
            || $version->balls !== $whole('balls')
            || $version->estimated_minutes !== $whole('estimated_minutes')
            || $ids($version->facilities()->pluck('facilities.id')) !== $ids($content['facility_ids'])
            || $ids($version->features()->pluck('features.id')) !== $ids($content['feature_ids']);
    }

    /**
     * The placeholders the rules use, such as `zone` for `{zone}`, in the order they
     * first appear: each Level gives every one a value. A name starts with a letter.
     *
     * @return list<string>
     */
    public static function placeholders(string $rules): array
    {
        preg_match_all('/\{([A-Za-z]\w*)\}/', $rules, $matches);

        return array_values(array_unique($matches[1]));
    }

    /**
     * The publish check, read from the version's saved rows: what stops it being
     * published, keyed by the editor's field, in the editor's order.
     *
     * @return array<string, string>
     */
    public function problems(GameVersion $version): array
    {
        $version->load(['facilities', 'features', 'distanceGroups', 'padValues', 'levels.settings']);
        $category = $version->sg_category;
        $problems = [];

        if (trim($version->name) === '') {
            $problems['name'] = 'Give the Game a name.';
        }

        $allowed = $category->facilityKeys();
        if ($version->facilities->isEmpty()) {
            $problems['facility_ids'] = 'Pick at least one Facility.';
        } elseif ($version->facilities->contains(fn (Facility $facility) => ! in_array($facility->key, $allowed, true))) {
            $names = Facility::whereIn('key', $allowed)->orderBy('position')->pluck('name')->map(fn (string $name) => Str::lower($name));
            $problems['facility_ids'] = "{$category->label()} Games are played at the {$names->join(', ', ' or ')} only.";
        }

        if ($version->features->contains(fn (Feature $feature) => ! $version->facilities->contains('id', $feature->facility_id))) {
            $problems['feature_ids'] = 'Pick features only on the Facilities this Game needs.';
        }

        if ($version->distanceGroups->contains(fn (DistanceGroup $group) => $group->sg_category !== $category)) {
            $problems['distance_group_ids'] = 'Pick distance groups from this Game’s SG Category.';
        } elseif ($category->hasDistanceGroups() && $version->distanceGroups->isEmpty()) {
            $article = $category === SgCategory::Approach ? 'An' : 'A';
            $problems['distance_group_ids'] = "{$article} {$category->label()} Game needs at least one distance group.";
        }

        if ($version->balls === null && $version->estimated_minutes === null) {
            $problems['balls'] = 'Give a number of balls or the estimated minutes.';
        }
        if (trim($version->rules) === '') {
            $problems['rules'] = 'Write the rules.';
        }
        if (trim($version->scoring) === '') {
            $problems['scoring'] = 'Say how it’s scored.';
        }
        if ($version->score_entry === ScoreEntry::Pad && $version->padValues->isEmpty()) {
            $problems['pad_values'] = 'A points pad needs its values, such as 0, 1, 2, 3.';
        }

        $levels = $version->levels;
        $placeholders = self::placeholders($version->rules);
        if ($levels->isNotEmpty() && $levels->count() !== 5) {
            $problems['levels'] = 'A Game has five Levels or none.';
        } elseif ($levels->isEmpty() && $placeholders !== []) {
            $braced = collect($placeholders)->map(fn (string $key) => "{{$key}}")->join(', ');
            $problems['levels'] = "The rules use {$braced}, so add five Levels to set it.";
        }

        $higher = $version->score_better === ScoreBetter::Higher;
        foreach ($levels as $level) {
            $n = $level->level;
            $row = 'levels.'.($n - 1);
            $settings = $level->settingValues();
            foreach ($placeholders as $key) {
                if (! isset($settings[$key])) {
                    $problems["{$row}.settings.{$key}"] = "Level {$n} has no {{$key}}.";
                }
            }

            if ($level->up === null) {
                $problems["{$row}.up"] = "Level {$n} needs an up target.";
            }
            if ($level->down === null) {
                $problems["{$row}.down"] = "Level {$n} needs a down target.";
            }
            if ($level->up === null || $level->down === null) {
                continue;
            }

            $wrongWay = $higher ? $level->up <= $level->down : $level->up >= $level->down;
            if ($wrongWay) {
                $problems["{$row}.up"] = $higher
                    ? "Level {$n}: with higher is better, the up target must be above the down target."
                    : "Level {$n}: with lower is better, the up target must be below the down target.";
            }
        }

        return $problems;
    }
}
