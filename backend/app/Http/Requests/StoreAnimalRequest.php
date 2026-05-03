<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnimalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'animal_id' => 'nullable|string|unique:animals,animal_id|max:50',
            'name' => 'required|string|max:255',
            'species' => 'required|in:Camel,Goat,Sheep,Cow,Dog',
            'breed' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'required|in:Male,Female',
            'color_markings' => 'nullable|string',
            'current_weight' => 'nullable|numeric|min:0',
            'identification_photo' => 'nullable|file|image|max:10240',
            'baseline_temperature' => 'nullable|numeric|min:0|max:50',
            'normal_heart_rate' => 'nullable|integer|min:0|max:300',
            'owner_id' => 'nullable|exists:users,id',
            'device_id' => 'nullable|string|max:255',
        ];
    }
}
