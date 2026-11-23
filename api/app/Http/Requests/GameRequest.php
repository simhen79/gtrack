<?php

namespace App\Http\Requests;

use App\Enums\ScoreBetter;
use App\Enums\ScoreEntry;
use App\Enums\SgCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The shape of a Game from the editor. Whether it can be published (a name, five
 * Levels or none, targets the right way…) is the publish check's call, made in
 * `Publisher`, so a Draft's import is held to the same rules.
 */
class GameRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $whole = ['nullable', 'integer', 'between:1,500'];

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'sg_category' => ['required', Rule::enum(SgCategory::class)],
            'balls' => $whole,
            'estimated_minutes' => ['nullable', 'integer', 'between:1,240'],
            'seconds_per_ball' => ['nullable', 'integer', 'between:1,600'],
            'rules' => ['nullable', 'string', 'max:5000'],
            'scoring' => ['nullable', 'string', 'max:5000'],
            'score_better' => ['required', Rule::enum(ScoreBetter::class)],
            'score_entry' => ['required', Rule::enum(ScoreEntry::class)],
            'pad_values' => ['present', 'array', 'max:20'],
            'pad_values.*' => ['integer', 'between:-999,999'],
            'open' => ['present', 'array', 'max:10'],
            'open.*' => ['string', 'distinct', 'max:255'],
            'source_concept' => ['nullable', 'string', 'max:5000'],
            'source_url' => ['nullable', 'url', 'max:255'],
            'facility_ids' => ['present', 'array'],
            'facility_ids.*' => ['distinct', Rule::exists('facilities', 'id')],
            'feature_ids' => ['present', 'array'],
            'feature_ids.*' => ['distinct', Rule::exists('features', 'id')],
            'distance_group_ids' => ['present', 'array'],
            'distance_group_ids.*' => ['distinct', Rule::exists('distance_groups', 'id')],
            'levels' => ['present', 'array', 'max:10'],
            'levels.*.settings' => ['present', 'array'],
            'levels.*.settings.*' => ['nullable', 'string', 'max:255'],
            'levels.*.up' => ['nullable', 'integer', 'between:-9999,9999'],
            'levels.*.down' => ['nullable', 'integer', 'between:-9999,9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sg_category' => 'SG Category',
            'estimated_minutes' => 'estimated minutes',
            'seconds_per_ball' => 'seconds per ball',
            'source_concept' => 'source',
            'source_url' => 'source link',
            'facility_ids' => 'Facilities',
            'levels.*.up' => 'up target',
            'levels.*.down' => 'down target',
        ];
    }
}
