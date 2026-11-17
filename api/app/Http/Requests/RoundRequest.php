<?php

namespace App\Http\Requests;

use App\Auth\CurrentGolfer;
use App\Models\Round;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['baseline_id.required_without' => 'Pick a Baseline or add a new one.'];
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
        ];
    }
}
