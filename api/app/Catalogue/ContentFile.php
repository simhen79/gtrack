<?php

namespace App\Catalogue;

use App\Enums\SgCategory;
use App\Http\Requests\DrillRequest;
use App\Http\Requests\GameRequest;
use App\Models\DistanceGroup;
use App\Models\Facility;
use App\Models\Feature;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Yaml\Yaml;

/**
 * A Catalogue content file, as the first load reads it: `games` and `drills` in the
 * spec's content format, which names Facilities, features and distance groups by key
 * (`range_bay`, `target_flags`, "100-150", "5+"). Each item comes out in its editor's
 * shape, held to the editor's rules, so a Game can go through `Publisher`.
 */
class ContentFile
{
    /** @var list<array<string, mixed>> */
    public readonly array $games;

    /** @var list<array<string, mixed>> */
    public readonly array $drills;

    public function __construct(string $path)
    {
        $content = Yaml::parseFile($path);
        $this->games = $content['games'] ?? [];
        $this->drills = $content['drills'] ?? [];
    }

    /**
     * A Game in the Game editor's shape.
     *
     * @param  array<string, mixed>  $game
     * @return array<string, mixed>
     *
     * @throws ValidationException when the editor would refuse it, before the publish check
     */
    public function gameFields(array $game): array
    {
        $this->checkId($game);
        if (! is_int($game['version'] ?? null) || $game['version'] < 1) {
            throw ValidationException::withMessages(['version' => 'Give the version as a whole number from 1.']);
        }

        $fields = [
            ...$this->fields($game),
            'rules' => $game['rules'] ?? null,
            'scoring' => $game['scoring'] ?? null,
            'score_better' => $game['score']['better'] ?? null,
            'score_entry' => $game['score']['entry'] ?? null,
            'pad_values' => $game['score']['padValues'] ?? [],
            'open' => $game['open'] ?? [],
            'levels' => collect($game['levels'] ?? [])
                ->sortBy('level')
                ->map(fn (array $level) => [
                    'settings' => collect($level['settings'] ?? [])->map(fn ($value) => (string) $value)->all(),
                    'up' => $level['up'] ?? null,
                    'down' => $level['down'] ?? null,
                ])
                ->values()->all(),
        ];
        $request = new GameRequest;

        return Validator::make($fields, $request->rules(), [], $request->attributes())->validate();
    }

    /**
     * A Drill in the Drill editor's shape.
     *
     * @param  array<string, mixed>  $drill
     * @return array<string, mixed>
     *
     * @throws ValidationException when the editor would refuse it
     */
    public function drillFields(array $drill): array
    {
        $this->checkId($drill);
        $fields = [...$this->fields($drill), 'setup' => $drill['setup'] ?? null];
        $request = new DrillRequest;

        return Validator::make($fields, $request->rules(), $request->messages(), $request->attributes())->validate();
    }

    /**
     * What Games and Drills share, with their links as reference-table ids.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function fields(array $item): array
    {
        $category = SgCategory::tryFrom((string) ($item['category'] ?? ''));
        if ($category === null) {
            throw ValidationException::withMessages(['sg_category' => 'Give one SG Category, such as approach.']);
        }

        $facilities = collect($item['facilities'] ?? [])->map(fn (string $key) => Facility::where('key', $key)->first()
            ?? throw ValidationException::withMessages(['facility_ids' => "There's no Facility called {$key}."]));

        // A feature key such as `slopes` names the feature of whichever listed Facility has it.
        $featureIds = collect($item['features'] ?? [])->map(fn (string $key) => Feature::whereIn('facility_id', $facilities->pluck('id'))->where('key', $key)->value('id')
            ?? throw ValidationException::withMessages(['feature_ids' => "None of its Facilities has a feature called {$key}."]));

        $groups = DistanceGroup::where('sg_category', $category)->get();
        $groupIds = collect($item['distanceGroups'] ?? [])->map(fn (string $name) => $groups
            ->first(fn (DistanceGroup $group) => $group->min_metres.($group->max_metres === null ? '+' : "-{$group->max_metres}") === $name)?->id
            ?? throw ValidationException::withMessages(['distance_group_ids' => "{$category->label()} has no distance group {$name}."]));

        return [
            'name' => $item['name'] ?? null,
            'sg_category' => $category->value,
            'balls' => $item['balls'] ?? null,
            'estimated_minutes' => $item['estimatedMinutes'] ?? null,
            'seconds_per_ball' => $item['secondsPerBall'] ?? null,
            'source_concept' => $item['source']['concept'] ?? null,
            'source_url' => $item['source']['url'] ?? null,
            'facility_ids' => $facilities->pluck('id')->all(),
            'feature_ids' => $featureIds->all(),
            'distance_group_ids' => $groupIds->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function checkId(array $item): void
    {
        if (! Str::isUlid((string) ($item['id'] ?? ''))) {
            throw ValidationException::withMessages(['id' => 'Give it a ULID, kept across versions.']);
        }
    }
}
