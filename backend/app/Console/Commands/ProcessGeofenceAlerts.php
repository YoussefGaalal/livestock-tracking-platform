<?php

namespace App\Console\Commands;

use App\Models\Animal;
use App\Models\Geofence;
use App\Models\GeofenceAlert;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class ProcessGeofenceAlerts extends Command
{
    protected $signature = 'geofence:process {--animal= : Process specific animal}';
    protected $description = 'Process location history and trigger geofence alerts';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $animalId = $this->option('animal');
        
        if ($animalId) {
            $animals = [Animal::findOrFail($animalId)];
            $this->info("Processing geofence alerts for animal ID: {$animalId}");
        } else {
            $animals = Animal::whereNotNull('device_id')->get();
            $this->info("Processing geofence alerts for all animals...");
        }

        $totalAlerts = 0;

        foreach ($animals as $animal) {
            $locations = $animal->locationHistory()
                ->orderBy('recorded_at', 'asc')
                ->get();

            if ($locations->isEmpty()) {
                continue;
            }

            $geofences = $this->getGeofencesForAnimal($animal);
            
            if ($geofences->isEmpty()) {
                continue;
            }

            $this->line("  Animal {$animal->animal_id}: {$locations->count()} locations, {$geofences->count()} geofences");

            foreach ($locations as $location) {
                $lat = $location->latitude;
                $lng = $location->longitude;

                foreach ($geofences as $geofence) {
                    $wasInsideKey = "geofence_{$geofence->id}_animal_{$animal->id}_inside";
                    $wasInside = cache()->get($wasInsideKey, null);
                    $isInside = $geofence->containsPoint($lat, $lng);

                    if ($wasInside === null) {
                        cache()->put($wasInsideKey, $isInside, 86400);
                        continue;
                    }

                    if ($isInside && !$wasInside) {
                        if (in_array($geofence->alert_type, ['entry', 'both'])) {
                            $existingAlert = GeofenceAlert::where('animal_id', $animal->id)
                                ->where('geofence_id', $geofence->id)
                                ->where('type', 'entry')
                                ->whereBetween('triggered_at', [
                                    $location->recorded_at->subMinutes(5),
                                    $location->recorded_at->addMinutes(5)
                                ])
                                ->first();

                            if (!$existingAlert) {
                                $alert = GeofenceAlert::create([
                                    'geofence_id' => $geofence->id,
                                    'animal_id' => $animal->id,
                                    'device_id' => $animal->device_id,
                                    'type' => 'entry',
                                    'latitude' => $lat,
                                    'longitude' => $lng,
                                    'triggered_at' => $location->recorded_at,
                                ]);
                                $totalAlerts++;
                                $this->line("    - ENTRY: {$animal->animal_id} entered {$geofence->name}");
                            }
                        }
                        cache()->put($wasInsideKey, true, 86400);
                    } elseif (!$isInside && $wasInside) {
                        if (in_array($geofence->alert_type, ['exit', 'both'])) {
                            $existingAlert = GeofenceAlert::where('animal_id', $animal->id)
                                ->where('geofence_id', $geofence->id)
                                ->where('type', 'exit')
                                ->whereBetween('triggered_at', [
                                    $location->recorded_at->subMinutes(5),
                                    $location->recorded_at->addMinutes(5)
                                ])
                                ->first();

                            if (!$existingAlert) {
                                $alert = GeofenceAlert::create([
                                    'geofence_id' => $geofence->id,
                                    'animal_id' => $animal->id,
                                    'device_id' => $animal->device_id,
                                    'type' => 'exit',
                                    'latitude' => $lat,
                                    'longitude' => $lng,
                                    'triggered_at' => $location->recorded_at,
                                ]);
                                $totalAlerts++;
                                $this->line("    - EXIT: {$animal->animal_id} left {$geofence->name}");
                            }
                        }
                        cache()->put($wasInsideKey, false, 86400);
                    }
                }
            }
        }

        $this->newLine();
        $this->info("Done! Created {$totalAlerts} new geofence alerts.");

        return Command::SUCCESS;
    }

    protected function getGeofencesForAnimal($animal)
    {
        return Geofence::where('is_active', true)
            ->where(function ($query) use ($animal) {
                $query->whereNull('owner_id')
                    ->orWhere('owner_id', $animal->owner_id);
            })
            ->get();
    }
}
