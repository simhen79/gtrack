<?php

namespace App\Http\Requests;

use App\Enums\SgCategory;
use App\Models\DistanceGroup;
use App\Models\Facility;
use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DrillRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $minutes = ['nullable', 'integer', 'between:1,240'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'sg_category' => ['required', Rule::enum(SgCategory::class)],
            'balls' => ['nullable', 'required_without:estimated_minutes', 'integer', 'between:1,500'],
            'estimated_minutes' => $minutes,
            'seconds_per_ball' => ['nullable', 'integer', 'between:1,600'],
            'setup' => ['required', 'string', 'max:5000'],
            'source_concept' => ['nullable', 'string', 'max:5000'],
            'source_url' => ['nullable', 'url', 'max:255'],
            'facility_ids' => ['required', 'array', 'min:1'],
            'facility_ids.*' => ['distinct', Rule::exists('facilities', 'id')],
            'feature_ids' => ['present', 'array'],
            'feature_ids.*' => ['distinct', Rule::exists('features', 'id')],
            'distance_group_ids' => ['present', 'array'],
            'distance_group_ids.*' => ['distinct', Rule::exists('distance_groups', 'id')],
        ];
    }

    /**
     * A Drill is played only at the Facilities its SG Category allows. A feature belongs
     * to one Facility, so it only makes sense on a Drill that needs that Facility;
     * distance groups belong to the Drill's own SG Category.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $category = SgCategory::from($this->input('sg_category'));
            $allowed = Facility::whereIn('key', $category->facilityKeys())->orderBy('position')->get();
            if (collect($this->input('facility_ids'))->diff($allowed->pluck('id'))->isNotEmpty()) {
                $names = $allowed->pluck('name')->map(fn (string $name) => Str::lower($name));
                $validator->errors()->add('facility_ids', "{$category->label()} Drills are played at the {$names->join(', ', ' or ')} only.");
            }

            $strayFeatures = Feature::whereIn('id', $this->input('feature_ids'))
                ->whereNotIn('facility_id', $this->input('facility_ids'))
                ->exists();
            if ($strayFeatures) {
                $validator->errors()->add('feature_ids', 'Pick features only on the Facilities this Drill needs.');
            }

            $strayGroups = DistanceGroup::whereIn('id', $this->input('distance_group_ids'))
                ->where('sg_category', '!=', $this->input('sg_category'))
                ->exists();
            if ($strayGroups) {
                $validator->errors()->add('distance_group_ids', 'Pick distance groups from this Drill’s SG Category.');
            }
        }];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'balls.required_without' => 'Give a number of balls or the estimated minutes.',
            'facility_ids.required' => 'Pick at least one Facility.',
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
        ];
    }
}
