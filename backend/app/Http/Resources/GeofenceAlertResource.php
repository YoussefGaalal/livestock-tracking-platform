<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GeofenceAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'animal_id' => $this->animal_id,
            'geofence_id' => $this->geofence_id,
            'type' => $this->type,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_acknowledged' => $this->is_acknowledged,
            'notification_sent' => $this->notification_sent ?? false,
            'triggered_at' => $this->triggered_at
                ? (is_string($this->triggered_at) ? $this->triggered_at : $this->triggered_at?->toIso8601String())
                : null,
            'notification_sent_at' => $this->notification_sent_at 
                ? (is_string($this->notification_sent_at) ? $this->notification_sent_at : $this->notification_sent_at?->toIso8601String())
                : null,
            'created_at' => $this->created_at
                ? (is_string($this->created_at) ? $this->created_at : $this->created_at?->toIso8601String())
                : null,
            'animal' => $this->whenLoaded('animal', function () {
                if (!$this->animal) {
                    return null;
                }
                return [
                    'id' => $this->animal->id,
                    'animal_id' => $this->animal->animal_id,
                    'species' => $this->animal->species,
                    'breed' => $this->animal->breed,
                ];
            }),
            'geofence' => $this->whenLoaded('geofence', function () {
                if (!$this->geofence) {
                    return null;
                }
                return [
                    'id' => $this->geofence->id,
                    'name' => $this->geofence->name,
                    'color' => $this->geofence->color,
                ];
            }),
        ];
    }
}
