<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Device;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $devices = [
            [
                'device_id' => 'IOT-001-A',
                'firmware_version' => 'v2.4.1',
                'status' => 'online',
                'battery_level' => 95,
                'gps_lat' => 24.7136,
                'gps_lng' => 46.6753,
                'last_ping' => now()->subMinutes(5),
            ],
            [
                'device_id' => 'IOT-002-B',
                'firmware_version' => 'v2.4.1',
                'status' => 'online',
                'battery_level' => 82,
                'gps_lat' => 24.7146,
                'gps_lng' => 46.6763,
                'last_ping' => now()->subMinutes(2),
            ],
            [
                'device_id' => 'IOT-003-C',
                'firmware_version' => 'v2.4.0',
                'status' => 'low_signal',
                'battery_level' => 14,
                'gps_lat' => 24.7156,
                'gps_lng' => 46.6773,
                'last_ping' => now()->subMinutes(15),
            ],
            [
                'device_id' => 'IOT-004-D',
                'firmware_version' => 'v2.4.1',
                'status' => 'online',
                'battery_level' => 78,
                'gps_lat' => 24.7166,
                'gps_lng' => 46.6743,
                'last_ping' => now()->subMinutes(1),
            ],
            [
                'device_id' => 'IOT-005-E',
                'firmware_version' => 'v2.3.9',
                'status' => 'offline',
                'battery_level' => 0,
                'gps_lat' => null,
                'gps_lng' => null,
                'last_ping' => now()->subHours(12),
            ],
            [
                'device_id' => 'IOT-006-F',
                'firmware_version' => 'v2.4.1',
                'status' => 'online',
                'battery_level' => 91,
                'gps_lat' => 24.7126,
                'gps_lng' => 46.6783,
                'last_ping' => now()->subMinutes(3),
            ],
        ];

        foreach ($devices as $device) {
            Device::updateOrCreate(['device_id' => $device['device_id']], $device);
        }
        
        $animals = Animal::take(6)->get();
        $devices = Device::all();
        foreach ($devices as $idx => $device) {
            if (isset($animals[$idx])) {
                $device->animal_id = $animals[$idx]->id;
                $device->owner_id = $animals[$idx]->owner_id;
                $device->save();
            }
        }
    }
}
