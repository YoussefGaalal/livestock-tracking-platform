<?php

namespace App\Http\Controllers\Api\Location;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MapController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Device::whereNotNull('gps_lat')
            ->whereNotNull('gps_lng');
        
        // Apply role-based filtering
        if ($user && !$user->hasRole('Admin')) {
            if ($user->hasRole('Owner')) {
                $query->where('owner_id', $user->id);
            } elseif ($user->managed_by) {
                $query->where('owner_id', $user->managed_by);
            } else {
                return response()->json(['markers' => [], 'bounds' => null]);
            }
        }
        
        $devices = $query->with('animal')->get()
            ->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_id' => $device->device_id,
                    'name' => $device->name,
                    'status' => $device->status,
                    'battery_level' => $device->battery_level,
                    'gps_lat' => $device->gps_lat,
                    'gps_lng' => $device->gps_lng,
                    'animal' => $device->animal ? [
                        'id' => $device->animal->id,
                        'name' => $device->animal->animal_id,
                    ] : null,
                ];
            });

        return response()->json([
            'markers' => $devices,
            'bounds' => [
                'north' => $devices->max('gps_lat'),
                'south' => $devices->min('gps_lat'),
                'east' => $devices->max('gps_lng'),
                'west' => $devices->min('gps_lng'),
            ],
        ]);
    }
}