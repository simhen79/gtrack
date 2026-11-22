<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PracticeGroundRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:2000'],
            'facility_ids' => ['present', 'array'],
            'facility_ids.*' => ['distinct', Rule::exists('facilities', 'id')],
            'feature_ids' => ['present', 'array'],
            'feature_ids.*' => ['distinct', Rule::exists('features', 'id')],
        ];
    }

    /**
     * A feature belongs to one Facility, so it only sits on a Practice Ground that has that Facility.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $strayFeatures = Feature::whereIn('id', $this->input('feature_ids'))
                ->whereNotIn('facility_id', $this->input('facility_ids'))
                ->exists();
            if ($strayFeatures) {
                $validator->errors()->add('feature_ids', 'Pick features only on the Facilities this Practice Ground has.');
            }
        }];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'facility_ids' => 'Facilities',
            'feature_ids' => 'features',
        ];
    }
}
