<?php

namespace App\Http\Requests;

use App\Auth\CurrentGolfer;
use App\Models\Round;
use App\Models\RoundStats;
use App\Models\SgBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RoundRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $golferId = app(CurrentGolfer::class)->id();
        $sg = ['required', 'decimal:0,2', 'between:-99.99,99.99'];

        return [
            'played_on' => ['required', 'date'],
            'course_name' => ['required', 'string', 'max:255'],
            'tees' => ['nullable', 'string', 'max:50'],
            'holes' => ['required', 'integer', Rule::in([9, 18])],
            'par' => ['nullable', 'integer', 'between:27,80'],
            'score' => ['required', 'integer', 'between:18,250'],
            'handicap_index' => ['required', 'decimal:0,1', 'between:-10,54'],
            'course_handicap' => ['required', 'integer', 'between:-20,80'],
            'baseline_id' => [
                'nullable', 'required_without:new_baseline', 'prohibits:new_baseline',
                Rule::exists('baselines', 'id')->where('user_id', $golferId),
            ],
            'new_baseline' => [
                'nullable', 'string', 'max:50',
                Rule::unique('baselines', 'name')->where('user_id', $golferId),
            ],
            ...array_fill_keys(Round::SG_FIELDS, $sg),
            'stats' => ['nullable', 'array:'.implode(',', RoundStats::FIELDS)],
            ...collect(RoundStats::FIELDS)->mapWithKeys(fn (string $field) => ["stats.{$field}" => [
                'nullable', 'integer', 'min:0', str_ends_with($field, '_percent') ? 'max:100' : 'max:99',
            ]])->all(),
            'bands' => ['nullable', 'array'],
            'bands.*' => ['nullable', 'decimal:0,2', 'between:-99.99,99.99'],
        ];
    }

    /**
     * Once any band of Approach or Putting is entered, that SG Category's total is
     * the sum of its bands, whatever total was typed. Blank bands count as 0.
     */
    protected function prepareForValidation(): void
    {
        $entered = array_filter((array) $this->input('bands', []), fn ($value) => $value !== null);
        $categories = SgBand::whereIn('id', array_keys($entered))->pluck('sg_category', 'id');

        foreach ($categories->unique() as $category) {
            $hundredths = $categories->filter(fn ($bandCategory) => $bandCategory === $category)
                ->keys()
                ->sum(fn (string $bandId) => (int) round((float) $entered[$bandId] * 100));

            $this->merge(["sg_{$category->value}" => number_format($hundredths / 100, 2, '.', '')]);
        }
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            $unknown = array_diff(array_keys((array) $this->input('bands', [])), SgBand::pluck('id')->all());

            if ($unknown !== []) {
                $validator->errors()->add('bands', 'That distance band doesn’t exist.');
            }

            $made = $this->input('stats.up_and_downs_made');
            $attempted = $this->input('stats.up_and_downs_attempted');
            if (is_numeric($made) && $made > 0 && (! is_numeric($attempted) || $made > $attempted) && ! $validator->errors()->has('stats.*')) {
                $validator->errors()->add('stats.up_and_downs_made', 'Up and downs made can’t be more than up and downs attempted.');
            }
        }];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'baseline_id.required_without' => 'Pick a Baseline or add a new one.',
            'stats.*.min' => ':Attribute can’t be negative.',
            'stats.*_percent.max' => ':Attribute can’t be more than 100%.',
            'stats.*.max' => ':Attribute can’t be more than :max.',
        ];
    }

    /**
     * Name each field as the golfer sees it, so a refusal says what's missing.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'played_on' => 'date',
            'course_name' => 'course',
            'handicap_index' => 'Handicap Index',
            'course_handicap' => 'Course Handicap',
            'baseline_id' => 'Baseline',
            'new_baseline' => 'new Baseline',
            'sg_off_the_tee' => 'Off the Tee',
            'sg_approach' => 'Approach',
            'sg_short_game' => 'Short Game',
            'sg_putting' => 'Putting',
            'stats.fairways_hit' => 'fairways hit',
            'stats.fairways_missed_left' => 'fairways missed left',
            'stats.fairways_missed_right' => 'fairways missed right',
            'stats.penalties' => 'penalties',
            'stats.approach_miss_long_percent' => 'Approach misses long',
            'stats.approach_miss_short_percent' => 'Approach misses short',
            'stats.approach_miss_left_percent' => 'Approach misses left',
            'stats.approach_miss_right_percent' => 'Approach misses right',
            'stats.up_and_downs_made' => 'up and downs made',
            'stats.up_and_downs_attempted' => 'up and downs attempted',
        ];
    }
}
