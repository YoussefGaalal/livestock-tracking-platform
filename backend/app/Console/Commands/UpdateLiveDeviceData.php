<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Animal;
use App\Models\LocationHistory;

class UpdateLiveDeviceData extends Command
{
    protected $signature = 'devices:update-live-data';
    protected $description = 'Update device GPS coordinates with simulated movement';

    public function handle(): int
    {
        $devicesWithAnimals = Device::whereNotNull('animal_id')->with('animal')->get();
        $updatedAnimalIds = [];
        $count = 0;
        
        foreach ($devicesWithAnimals as $device) {
            if (!$device->animal) {
                $this->warn("No animal found for device {$device->device_id}");
                continue;
            }
            
            $animal = $device->animal;
            if (in_array($animal->id, $updatedAnimalIds)) continue;
            
            try {
                $lastLocation = LocationHistory::where('animal_id', $animal->id)
                    ->orderByDesc('recorded_at')
                    ->first();

                if ($lastLocation) {
                    $latOffset = (rand(-30, 30) / 100000);
                    $lngOffset = (rand(-30, 30) / 100000);
                    $newLat = $lastLocation->latitude + $latOffset;
                    $newLng = $lastLocation->longitude + $lngOffset;
                } else {
                    $baseLat = 24.4539 + (rand(-100, 100) / 10000);
                    $baseLng = 54.3773 + (rand(-100, 100) / 10000);
                    $newLat = $device->gps_lat ?? $baseLat;
                    $newLng = $device->gps_lng ?? $baseLng;
                }
                
                $device->update([
                    'gps_lat' => $newLat,
                    'gps_lng' => $newLng,
                    'last_ping' => now(),
                ]);

                LocationHistory::create([
                    'animal_id' => $animal->id,
                    'device_id' => $device->id,
                    'latitude' => $newLat,
                    'longitude' => $newLng,
                    'recorded_at' => now(),
                    'battery_level' => $device->battery_level,
                    'signal_strength' => $device->signal_strength ?? rand(60, 100),
                ]);
                
                $updatedAnimalIds[] = $animal->id;
                $count++;
            } catch (\Exception $e) {
                $this->warn("Error for {$animal->animal_id}: " . $e->getMessage());
            }
        }

        $this->info("Updated {$count} animals at " . now()->format('Y-m-d H:i:s'));
        return Command::SUCCESS;
    }
}