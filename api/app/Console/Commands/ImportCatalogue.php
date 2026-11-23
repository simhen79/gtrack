<?php

namespace App\Console\Commands;

use App\Catalogue\ContentFile;
use App\Catalogue\Publisher;
use App\Enums\GameOrigin;
use App\Models\Drill;
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
            if (GameVersion::where('game_id', $gameId)->where('version', $game['version'])->exists()) {
                $this->line("Already loaded: {$label}");

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
            if (Drill::whereKey($drillId)->exists()) {
                $this->line("Already loaded: {$label}");

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
