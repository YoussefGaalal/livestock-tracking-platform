<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'firmware_version' => 'sometimes|string|max:50',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'signal_strength' => 'nullable|integer',
            'status' => 'sometimes|in:online,offline,low_signal',
            'update_interval' => 'nullable|integer|min:1',
            'advanced_tracking' => 'nullable|boolean',
            'animal_id' => 'nullable|exists:animals,id',
            'gps_lat' => 'nullable|numeric',
            'gps_lng' => 'nullable|numeric',
        ];
    }
}
