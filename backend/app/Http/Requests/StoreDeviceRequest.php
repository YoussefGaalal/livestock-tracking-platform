<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255|unique:devices,serial_number',
            'firmware_version' => 'nullable|string|max:50',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'signal_strength' => 'nullable|integer',
            'status' => 'nullable|in:online,offline,low_signal',
            'update_interval' => 'nullable|integer|min:1',
            'advanced_tracking' => 'nullable|boolean',
            'animal_id' => 'nullable|exists:animals,id',
            'gps_lat' => 'nullable|numeric',
            'gps_lng' => 'nullable|numeric',
        ];
    }
}
