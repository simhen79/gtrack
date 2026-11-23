<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StartingLevelsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bands' => ['required', 'array', 'min:1', 'max:10'],
            'bands.0.from' => ['prohibited'],
            'bands.*.from' => ['nullable', 'decimal:0,1', 'between:-10,54'],
            'bands.*.level' => ['required', 'integer', 'between:1,5'],
        ];
    }

    /**
     * Each band after the first starts above the one before it.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            $previous = null;
            foreach (array_slice($this->input('bands', []), 1, preserve_keys: true) as $index => $band) {
                $from = $band['from'] ?? null;
                if ($from === null) {
                    $validator->errors()->add("bands.{$index}.from", 'Give the Handicap Index this band starts at.');
                } elseif ($previous !== null && (float) $from <= $previous) {
                    $validator->errors()->add("bands.{$index}.from", 'Start each band above the one before it.');
                }
                $previous = $from === null ? $previous : (float) $from;
            }
        }];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'bands.*.from' => 'Handicap Index',
            'bands.*.level' => 'starting Level',
        ];
    }
}
