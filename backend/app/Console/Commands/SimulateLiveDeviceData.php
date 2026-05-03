<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Device;
use App\Models\Animal;
use App\Models\LocationHistory;

class SimulateLiveDeviceData extends Command
{
    protected $signature = 'devices:simulate-live-data {--interval=60 : Interval in seconds between updates}';
    protected $description = 'Simulate live device data by updating GPS coordinates';

    protected $running = true;

    public function handle(): int
    {
        $interval = (int) $this->option('interval');
        
        $this->info("Starting live data simulation with {$interval}s interval...");
        $this->info("Press Ctrl+C to stop");

        pcntl_async_signals(true);
        pcntl_signal(SIGINT, function() {
            $this->running = false;
            $this->info("\nStopping simulation...");
        });
        pcntl_signal(SIGTERM, function() {
            $this->running = false;
            $this->info("\nStopping simulation...");
        });

        $baseLat = 24.4539;
        $baseLng = 54.3773;

        while ($this->running) {
            $startTime = microtime(true);
            
            $devices = Device::whereNotNull('animal_id')
                ->where(function ($query) {
                    $query->where('status', 'online')
                        ->orWhere('status', 'low_signal');
                })
                ->with('animal')
                ->get();

            $count = 0;
            foreach ($devices as $device) {
                try {
                    $lastLocation = LocationHistory::where('animal_id', $device->animal->id)
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

                    if ($device->animal) {
                        LocationHistory::create([
                            'animal_id' => $device->animal->id,
                            'device_id' => $device->id,
                            'latitude' => $newLat,
                            'longitude' => $newLng,
                            'recorded_at' => now(),
                            'battery_level' => $device->battery_level,
                            'signal_strength' => $device->signal_strength ?? rand(60, 100),
                        ]);
                    }
                    
                    $count++;
                } catch (\Exception $e) {
                    $this->error("Error updating device {$device->device_id}: " . $e->getMessage());
                }
            }

            $this->info("Updated {$count} devices at " . now()->format('Y-m-d H:i:s'));

            $elapsed = microtime(true) - $startTime;
            $sleepTime = max(0, $interval - $elapsed);
            
            if ($sleepTime > 0) {
                sleep((int) $sleepTime);
            }
        }

        return Command::SUCCESS;
    }
}
