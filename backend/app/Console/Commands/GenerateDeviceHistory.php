<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\LocationHistory;
use App\Models\Animal;
use Illuminate\Console\Command;
use Carbon\Carbon;

class GenerateDeviceHistory extends Command
{
    protected $signature = 'devices:generate-history {--days=7 : Number of days of history}';
    protected $description = 'Generate historical location data for devices';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $devices = Device::whereNotNull('gps_lat')->whereNotNull('gps_lng')->get();

        if ($devices->isEmpty()) {
            $this->warn('No devices with GPS coordinates found.');
            return 1;
        }

        $bar = $this->output->createProgressBar($devices->count() * $days * 24);
        $bar->start();

        foreach ($devices as $device) {
            $animal = Animal::where('device_id', $device->device_id)->first();
            $baseLat = $device->gps_lat;
            $baseLng = $device->gps_lng;

            for ($day = $days; $day >= 0; $day--) {
                for ($hour = 0; $hour < 24; $hour++) {
                    $timestamp = Carbon::now()->subDays($day)->setHour($hour)->setMinute(rand(0, 59))->setSecond(rand(0, 59));

                    $latVariation = (rand(-100, 100) / 10000);
                    $lngVariation = (rand(-100, 100) / 10000);

                    $speed = rand(0, 15);

                    LocationHistory::create([
                        'device_id' => $device->id,
                        'animal_id' => $animal?->id,
                        'latitude' => $baseLat + $latVariation,
                        'longitude' => $baseLng + $lngVariation,
                        'speed' => $speed,
                        'heading' => rand(0, 359),
                        'recorded_at' => $timestamp,
                    ]);

                    $bar->advance();
                }
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info("Generated location history for {$devices->count()} devices over {$days} days.");

        return 0;
    }
}
