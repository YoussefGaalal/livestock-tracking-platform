<?php

namespace Database\Seeders;

use App\Models\Geofence;
use App\Models\User;
use Illuminate\Database\Seeder;

class GeofenceSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'Owner')->get();

        $geofences = [
            [
                'name' => 'Main Paddock',
                'coordinates' => json_encode([
                    [24.7136, 46.6753],
                    [24.7136, 46.6853],
                    [24.7036, 46.6853],
                    [24.7036, 46.6753],
                    [24.7136, 46.6753],
                ]),
                'color' => '#22C55E',
                'alert_type' => 'both',
                'is_active' => true,
            ],
            [
                'name' => 'Racing Track Area',
                'coordinates' => json_encode([
                    [24.7200, 46.6800],
                    [24.7200, 46.6900],
                    [24.7100, 46.6900],
                    [24.7100, 46.6800],
                    [24.7200, 46.6800],
                ]),
                'color' => '#3B82F6',
                'alert_type' => 'exit',
                'is_active' => true,
            ],
            [
                'name' => 'Breeding Zone',
                'coordinates' => json_encode([
                    [24.7050, 46.6700],
                    [24.7050, 46.6800],
                    [24.6950, 46.6800],
                    [24.6950, 46.6700],
                    [24.7050, 46.6700],
                ]),
                'color' => '#A855F7',
                'alert_type' => 'entry',
                'is_active' => true,
            ],
            [
                'name' => 'Quarantine Area',
                'coordinates' => json_encode([
                    [24.7250, 46.6650],
                    [24.7250, 46.6700],
                    [24.7200, 46.6700],
                    [24.7200, 46.6650],
                    [24.7250, 46.6650],
                ]),
                'color' => '#EF4444',
                'alert_type' => 'both',
                'is_active' => true,
            ],
            [
                'name' => 'Watering Point',
                'coordinates' => json_encode([
                    [24.7180, 46.6720],
                    [24.7180, 46.6740],
                    [24.7160, 46.6740],
                    [24.7160, 46.6720],
                    [24.7180, 46.6720],
                ]),
                'color' => '#06B6D4',
                'alert_type' => 'entry',
                'is_active' => true,
            ],
        ];

        foreach ($geofences as $index => $geofence) {
            $geofence['owner_id'] = $users[$index % $users->count()]->id;
            Geofence::updateOrCreate(['name' => $geofence['name']], $geofence);
        }
    }
}
