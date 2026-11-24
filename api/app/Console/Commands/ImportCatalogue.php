<?php

namespace App\Console\Commands;

use App\Catalogue\ContentFile;
use App\Catalogue\Publisher;
use App\Enums\GameOrigin;
use App\Models\Drill;
use App\Models\GameLevel;
use App\Models\GameVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The first load: Games go in as Drafts for an admin to Approve, Drills straight into
 * the Catalogue. Running it again loads only what isn't there yet.
 */
class ImportCatalogue extends Command
{
    protected $signature = 'app:import-catalogue {file=database/catalogue/v1.yaml}';

    protected $description = 'Load a Catalogue content file: Games as Drafts, Drills into the Catalogue';

    public function handle(Publisher $publisher): int
    {
        $path = $this->argument('file');
        $path = is_file($path) ? $path : base_path($path);
        if (! is_file($path)) {
            $this->error("There's no content file at {$path}.");

            return self::FAILURE;
        }
        $file = new ContentFile($path);
        $refused = 0;

        foreach ($file->games as $game) {
            $label = ($game['name'] ?? '(no name)').', v'.($game['version'] ?? '?');
            try {
                $fields = $file->gameFields($game);
            } catch (ValidationException $e) {
                $this->refuse($label, $e);
                $refused++;

                continue;
            }

            // Ids are lower case, as the app makes them.
            $gameId = strtolower($game['id']);
            $loaded = GameVersion::where('game_id', $gameId)->where('version', $game['version'])->first();
            if ($loaded !== null) {
                $this->alreadyLoaded($label, $this->loadedGame($loaded), $fields, 'Change it in the Game editor, or give the file a new version.');

                continue;
            }

            try {
                $draft = $publisher->draft($gameId, $game['version'], GameOrigin::FirstLoad, $fields);
            } catch (ValidationException $e) {
                $this->refuse($label, $e);
                $refused++;

                continue;
            }
            $problems = $publisher->problems($draft);
            if ($problems === []) {
                $this->info("Drafted: {$label}");
            } else {
                $this->warn("Drafted: {$label}, which won't pass the publish check until it's fixed:");
                foreach ($problems as $problem) {
                    $this->line("  - {$problem}");
                }
            }
        }

        foreach ($file->drills as $item) {
            $label = $item['name'] ?? '(no name)';
            try {
                $fields = $file->drillFields($item);
            } catch (ValidationException $e) {
                $this->refuse($label, $e);
                $refused++;

                continue;
            }

            $drillId = strtolower($item['id']);
            $loaded = Drill::find($drillId);
            if ($loaded !== null) {
                $this->alreadyLoaded($label, $this->loadedDrill($loaded), $fields, 'Change it in the Drill editor.');

                continue;
            }

            DB::transaction(function () use ($drillId, $fields) {
                $drill = (new Drill)->forceFill(['id' => $drillId]);
                $drill->fill(collect($fields)->except(['facility_ids', 'feature_ids', 'distance_group_ids'])->all())->save();
                $drill->facilities()->sync($fields['facility_ids']);
                $drill->features()->sync($fields['feature_ids']);
                $drill->distanceGroups()->sync($fields['distance_group_ids']);
            });
            $this->info("Added to the Catalogue: {$label}");
        }

        if ($refused > 0) {
            $this->error("{$refused} not loaded. Fix them in the file and run the import again.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    /**
     * The import never changes what's loaded, so it says when the file has moved on.
     *
     * @param  array<string, mixed>  $loaded
     * @param  array<string, mixed>  $file
     */
    private function alreadyLoaded(string $label, array $loaded, array $file, string $fix): void
    {
        if ($this->comparable($loaded) === $this->comparable($file)) {
            $this->line("Already loaded: {$label}");
        } else {
            $this->warn("Already loaded: {$label}, but it differs from the file. {$fix}");
        }
    }

    /**
     * A loaded Game version in the Game editor's shape.
     *
     * @return array<string, mixed>
     */
    private function loadedGame(GameVersion $version): array
    {
        $version->load(['facilities', 'features', 'distanceGroups', 'openFields', 'padValues', 'levels.settings']);

        return [
            ...$this->loadedDrill($version),
            'score_better' => $version->score_better->value,
            'score_entry' => $version->score_entry->value,
            'rules' => $version->rules,
            'scoring' => $version->scoring,
            'open' => $version->openFields->sortBy('position')->pluck('name')->all(),
            'pad_values' => $version->padValues->sortBy('position')->pluck('value')->all(),
            'levels' => $version->levels->sortBy('level')->map(fn (GameLevel $level) => [
                'settings' => $level->settings->pluck('value', 'key')->all(),
                'up' => $level->up,
                'down' => $level->down,
            ])->values()->all(),
        ];
    }

    /**
     * A loaded Drill in the Drill editor's shape, or the fields a Game version shares with it.
     *
     * @return array<string, mixed>
     */
    private function loadedDrill(Drill|GameVersion $item): array
    {
        return [
            'name' => $item->name,
            'sg_category' => $item->sg_category->value,
            'balls' => $item->balls,
            'estimated_minutes' => $item->estimated_minutes,
            'seconds_per_ball' => $item->seconds_per_ball,
            'source_concept' => $item->source_concept,
            'source_url' => $item->source_url,
            'facility_ids' => $item->facilities->pluck('id')->all(),
            'feature_ids' => $item->features->pluck('id')->all(),
            'distance_group_ids' => $item->distanceGroups->pluck('id')->all(),
            ...($item instanceof Drill ? ['setup' => $item->setup] : []),
        ];
    }

    /**
     * Fields as they're saved: links in any order, blank as null, blank Level settings dropped.
     *
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    private function comparable(array $fields): array
    {
        $scalar = fn (mixed $value) => $value === null || $value === '' ? null : trim((string) $value);

        return collect($fields)->map(fn (mixed $value, string $field) => match (true) {
            str_ends_with($field, '_ids') => collect($value)->map(fn ($id) => (string) $id)->sort()->values()->all(),
            $field === 'levels' => collect($value)->values()->map(fn (array $level) => [
                'settings' => collect($level['settings'] ?? [])->map($scalar)->filter()->sortKeys()->all(),
                'up' => $scalar($level['up'] ?? null),
                'down' => $scalar($level['down'] ?? null),
            ])->all(),
            is_array($value) => collect($value)->map($scalar)->values()->all(),
            default => $scalar($value),
        })->sortKeys()->all();
    }

    private function refuse(string $label, ValidationException $e): void
    {
        $this->error("Not loaded: {$label}");
        foreach ($e->errors() as $messages) {
            foreach ($messages as $message) {
                $this->line("  - {$message}");
            }
        }
    }
}
