<?php

namespace Database\Seeders;

use App\Models\GeofenceAlert;
use App\Models\Animal;
use App\Models\Geofence;
use App\Models\Device;
use Illuminate\Database\Seeder;

class GeofenceAlertSeeder extends Seeder
{
    public function run(): void
    {
        $devices = Device::whereNotNull('gps_lat')->whereNotNull('gps_lng')->get();
        $geofences = Geofence::all();

        if ($geofences->isEmpty() || $devices->isEmpty()) {
            $this->command->warn('No geofences or devices found. Skipping GeofenceAlertSeeder.');
            return;
        }

        GeofenceAlert::truncate();

        $alertTemplates = [
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 1],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 2],
            ['type' => 'entry', 'is_acknowledged' => false, 'hours_ago' => 3],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 5],
            ['type' => 'entry', 'is_acknowledged' => false, 'hours_ago' => 8],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 12],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 18],
            ['type' => 'exit', 'is_acknowledged' => false, 'hours_ago' => 24],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 30],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 36],
            ['type' => 'entry', 'is_acknowledged' => false, 'hours_ago' => 42],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 48],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 60],
            ['type' => 'exit', 'is_acknowledged' => false, 'hours_ago' => 72],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 84],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 96],
            ['type' => 'entry', 'is_acknowledged' => false, 'hours_ago' => 108],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 120],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 132],
            ['type' => 'exit', 'is_acknowledged' => false, 'hours_ago' => 144],
            ['type' => 'entry', 'is_acknowledged' => true, 'hours_ago' => 156],
            ['type' => 'exit', 'is_acknowledged' => true, 'hours_ago' => 168],
        ];

        $alertIndex = 0;
        $geofenceIndex = 0;

        foreach ($devices as $device) {
            $animal = $device->animal;
            if (!$animal) continue;

            $alertsPerAnimal = rand(2, 4);
            
            for ($i = 0; $i < $alertsPerAnimal && $alertIndex < count($alertTemplates); $i++) {
                $geofence = $geofences[$geofenceIndex % $geofences->count()];
                $template = $alertTemplates[$alertIndex % count($alertTemplates)];

                $latOffset = (rand(-100, 100) / 10000);
                $lngOffset = (rand(-100, 100) / 10000);

                GeofenceAlert::create([
                    'animal_id' => $animal->id,
                    'geofence_id' => $geofence->id,
                    'device_id' => $device->id,
                    'type' => $template['type'],
                    'latitude' => $device->gps_lat + $latOffset,
                    'longitude' => $device->gps_lng + $lngOffset,
                    'is_acknowledged' => $template['is_acknowledged'],
                    'triggered_at' => now()->subHours($template['hours_ago']),
                    'notification_sent' => true,
                    'notification_sent_at' => now()->subHours($template['hours_ago'] - 1),
                ]);

                $alertIndex++;
                $geofenceIndex++;
            }

            if ($alertIndex >= count($alertTemplates)) {
                $alertIndex = 0;
            }
        }

        $this->command->info('Created ' . GeofenceAlert::count() . ' geofence alerts.');
    }
}
