<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'animal_id' => $this->animal_id,
            'name' => $this->name,
            'owner_id' => $this->owner_id,
            'species' => $this->species,
            'breed' => $this->breed,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'color_markings' => $this->color_markings,
            'current_weight' => $this->current_weight ? (float) $this->current_weight : null,
            'identification_photo' => $this->identification_photo,
            'baseline_temperature' => $this->baseline_temperature ? (float) $this->baseline_temperature : null,
            'normal_heart_rate' => $this->normal_heart_rate,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'owner' => $this->whenLoaded('owner', function () {
                if (!$this->owner) {
                    return null;
                }
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ];
            }),
            'device' => $this->whenLoaded('device', function () {
                if (!$this->device) {
                    return null;
                }
                return [
                    'id' => $this->device->id,
                    'device_id' => $this->device->device_id,
                    'status' => $this->device->status,
                    'battery_level' => $this->device->battery_level,
                    'gps_lat' => $this->device->gps_lat,
                    'gps_lng' => $this->device->gps_lng,
                    'last_ping' => $this->device->last_ping,
                ];
            }),
            'groups' => $this->whenLoaded('groups', function () {
                if (!$this->groups) {
                    return [];
                }
                return $this->groups->map(fn($group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'color' => $group->color,
                ]);
            }),
            'geofences' => $this->whenLoaded('geofences', function () {
                if (!$this->geofences) {
                    return [];
                }
                return $this->geofences->map(fn($geofence) => [
                    'id' => $geofence->id,
                    'name' => $geofence->name,
                ]);
            }),
        ];
    }
}
