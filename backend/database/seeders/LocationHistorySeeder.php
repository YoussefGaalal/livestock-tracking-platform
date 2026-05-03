<?php

namespace Database\Seeders;

use App\Models\LocationHistory;
use App\Models\Device;
use Illuminate\Database\Seeder;

class LocationHistorySeeder extends Seeder
{
    public function run(): void
    {
        $devices = Device::whereNotNull('gps_lat')->whereNotNull('gps_lng')->get();

        foreach ($devices as $device) {
            $baseLat = $device->gps_lat;
            $baseLng = $device->gps_lng;

            $animal = $device->animal;
            if (!$animal) continue;

            $currentLat = $baseLat;
            $currentLng = $baseLng;
            $currentHeading = rand(0, 360);

            for ($i = 0; $i < 72; $i++) {
                $headingChange = rand(-30, 30);
                $currentHeading = ($currentHeading + $headingChange + 360) % 360;
                
                $distance = rand(50, 200) / 10000;
                $radians = $currentHeading * (M_PI / 180);
                
                $newLat = $currentLat + ($distance * cos($radians));
                $newLng = $currentLng + ($distance * sin($radians));
                
                $speed = rand(0, 80) / 10;
                
                LocationHistory::create([
                    'device_id' => $device->id,
                    'animal_id' => $animal->id,
                    'latitude' => $newLat,
                    'longitude' => $newLng,
                    'recorded_at' => now()->subHours($i),
                    'speed' => $speed,
                    'heading' => $currentHeading,
                ]);
                
                $currentLat = $newLat;
                $currentLng = $newLng;
            }

            $finalLat = $baseLat + (rand(-30, 30) / 100000);
            $finalLng = $baseLng + (rand(-30, 30) / 100000);
            
            $device->update([
                'gps_lat' => $finalLat,
                'gps_lng' => $finalLng,
            ]);
        }
    }
}
