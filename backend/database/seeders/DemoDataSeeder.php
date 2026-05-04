<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\AnimalGroup;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Device;
use App\Models\Geofence;
use App\Models\GeofenceAlert;
use App\Models\LocationHistory;
use App\Models\MedicalRecord;
use App\Models\Task;
use App\Models\User;
use App\Models\VaccinationSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * DemoDataSeeder
 *
 * Seeds realistic livestock-management demo data tied to the seeded users.
 * Fully idempotent — safe to run on every Railway deploy.
 * Guard: skips entirely if animals already exist.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if already seeded
        if (Animal::count() > 0) {
            echo "DemoDataSeeder: data already present — skipping.\n";
            return;
        }

        $khalid = User::where('email', 'khalid@oasis.com')->first();
        $ahmad  = User::where('email', 'ahmad@oasis.com')->first();
        $fatima = User::where('email', 'fatima@oasis.com')->first();

        if (!$khalid) {
            echo "DemoDataSeeder: users not found — run UserSeeder first.\n";
            return;
        }

        // ── Animals ──────────────────────────────────────────────────────────
        // Variety: Camels, Arabian Horses, Goats, Sheep, Cattle, Donkeys
        $animalsData = [
            // ── Khalid's herd (12 animals, varied species) ──────────────────
            ['name' => 'Sultan',   'species' => 'Camel',         'breed' => 'Dromedary',       'gender' => 'male',   'dob' => '2019-03-15', 'weight' => 525.0, 'temp' => 37.5, 'hr' => 42, 'color' => 'Brown with white patch',  'owner' => $khalid],
            ['name' => 'Reem',     'species' => 'Camel',         'breed' => 'Dromedary',       'gender' => 'female', 'dob' => '2020-06-22', 'weight' => 480.0, 'temp' => 37.8, 'hr' => 44, 'color' => 'Light beige',             'owner' => $khalid],
            ['name' => 'Majd',     'species' => 'Camel',         'breed' => 'Racing Dromedary','gender' => 'male',   'dob' => '2021-01-10', 'weight' => 455.0, 'temp' => 37.3, 'hr' => 40, 'color' => 'Dark brown',              'owner' => $khalid],
            ['name' => 'Ghazal',   'species' => 'Arabian Horse', 'breed' => 'Arabian',         'gender' => 'female', 'dob' => '2018-09-04', 'weight' => 410.0, 'temp' => 37.9, 'hr' => 36, 'color' => 'Chestnut',                'owner' => $khalid],
            ['name' => 'Buraaq',   'species' => 'Arabian Horse', 'breed' => 'Arabian',         'gender' => 'male',   'dob' => '2017-04-18', 'weight' => 460.0, 'temp' => 37.7, 'hr' => 38, 'color' => 'Grey dapple',             'owner' => $khalid],
            ['name' => 'Zain',     'species' => 'Goat',          'breed' => 'Damascus',        'gender' => 'male',   'dob' => '2022-04-05', 'weight' => 64.0,  'temp' => 38.2, 'hr' => 78, 'color' => 'Black and white',         'owner' => $khalid],
            ['name' => 'Layla',    'species' => 'Goat',          'breed' => 'Damascus',        'gender' => 'female', 'dob' => '2022-07-18', 'weight' => 56.0,  'temp' => 38.0, 'hr' => 80, 'color' => 'White',                   'owner' => $khalid],
            ['name' => 'Hessa',    'species' => 'Goat',          'breed' => 'Arabian Goat',    'gender' => 'female', 'dob' => '2023-02-01', 'weight' => 48.0,  'temp' => 38.5, 'hr' => 82, 'color' => 'Spotted brown/white',     'owner' => $khalid],
            ['name' => 'Noor',     'species' => 'Sheep',         'breed' => 'Awassi',          'gender' => 'female', 'dob' => '2021-11-30', 'weight' => 73.0,  'temp' => 39.1, 'hr' => 75, 'color' => 'White with black face',   'owner' => $khalid],
            ['name' => 'Faris',    'species' => 'Sheep',         'breed' => 'Najdi',           'gender' => 'male',   'dob' => '2020-09-14', 'weight' => 90.0,  'temp' => 38.9, 'hr' => 72, 'color' => 'Brown with long ears',    'owner' => $khalid],
            ['name' => 'Rawda',    'species' => 'Cattle',        'breed' => 'Friesian',        'gender' => 'female', 'dob' => '2019-07-22', 'weight' => 520.0, 'temp' => 38.6, 'hr' => 65, 'color' => 'Black and white',         'owner' => $khalid],
            ['name' => 'Jabir',    'species' => 'Cattle',        'breed' => 'Brahman',         'gender' => 'male',   'dob' => '2018-11-05', 'weight' => 680.0, 'temp' => 38.4, 'hr' => 62, 'color' => 'Light grey',              'owner' => $khalid],

            // ── Ahmad's animals (6 animals) ─────────────────────────────────
            ['name' => 'Badr',     'species' => 'Camel',         'breed' => 'Dromedary',       'gender' => 'male',   'dob' => '2018-05-20', 'weight' => 560.0, 'temp' => 37.6, 'hr' => 41, 'color' => 'Dark grey',               'owner' => $ahmad],
            ['name' => 'Warda',    'species' => 'Arabian Horse', 'breed' => 'Arabian',         'gender' => 'female', 'dob' => '2017-08-12', 'weight' => 420.0, 'temp' => 37.9, 'hr' => 36, 'color' => 'Bay',                     'owner' => $ahmad],
            ['name' => 'Sahm',     'species' => 'Arabian Horse', 'breed' => 'Arabian',         'gender' => 'male',   'dob' => '2016-12-03', 'weight' => 450.0, 'temp' => 37.7, 'hr' => 38, 'color' => 'Black',                   'owner' => $ahmad],
            ['name' => 'Dana',     'species' => 'Sheep',         'breed' => 'Awassi',          'gender' => 'female', 'dob' => '2022-03-25', 'weight' => 68.0,  'temp' => 39.0, 'hr' => 74, 'color' => 'White',                   'owner' => $ahmad],
            ['name' => 'Murad',    'species' => 'Goat',          'breed' => 'Nubian',          'gender' => 'male',   'dob' => '2023-05-10', 'weight' => 52.0,  'temp' => 38.3, 'hr' => 79, 'color' => 'Brown with white spots',  'owner' => $ahmad],
            ['name' => 'Suhail',   'species' => 'Donkey',        'breed' => 'Arabian Donkey',  'gender' => 'male',   'dob' => '2015-01-30', 'weight' => 180.0, 'temp' => 37.5, 'hr' => 48, 'color' => 'Grey',                    'owner' => $ahmad],
        ];

        $animals = [];
        foreach ($animalsData as $d) {
            $animals[] = Animal::create([
                'name'                 => $d['name'],
                'species'              => $d['species'],
                'breed'                => $d['breed'],
                'gender'               => $d['gender'],
                'date_of_birth'        => $d['dob'],
                'current_weight'       => $d['weight'],
                'baseline_temperature' => $d['temp'],
                'normal_heart_rate'    => $d['hr'],
                'color_markings'       => $d['color'],
                'owner_id'             => $d['owner']->id,
            ]);
        }

        echo "Created " . count($animals) . " animals.\n";

        // Index helpers
        // Khalid: $animals[0..11]   Ahmad: $animals[12..17]
        $khalidAnimals = array_slice($animals, 0, 12);
        $ahmadAnimals  = array_slice($animals, 12, 6);

        // ── Animal Groups ─────────────────────────────────────────────────────
        $groupDefs = [
            [
                'name'        => 'Racing Camels',
                'description' => 'Elite racing dromedaries — Sultan, Reem, and Majd',
                'color'       => '#D4AF37',
                'owner'       => $khalid,
                'members'     => [$animals[0], $animals[1], $animals[2]], // Sultan, Reem, Majd
            ],
            [
                'name'        => 'Arabian Horses',
                'description' => 'Breeding and endurance horses — Ghazal and Buraaq',
                'color'       => '#8B5CF6',
                'owner'       => $khalid,
                'members'     => [$animals[3], $animals[4]], // Ghazal, Buraaq
            ],
            [
                'name'        => 'Goat Herd',
                'description' => 'Damascus and Arabian goats for milk and breeding',
                'color'       => '#10B981',
                'owner'       => $khalid,
                'members'     => [$animals[5], $animals[6], $animals[7]], // Zain, Layla, Hessa
            ],
            [
                'name'        => 'Sheep Flock',
                'description' => 'Awassi and Najdi sheep — Noor, Faris, and Dana',
                'color'       => '#F59E0B',
                'owner'       => $khalid,
                'members'     => [$animals[8], $animals[9], $animals[15]], // Noor, Faris, Dana (Ahmad's)
            ],
        ];

        $groups = [];
        foreach ($groupDefs as $gd) {
            $group = AnimalGroup::create([
                'name'        => $gd['name'],
                'description' => $gd['description'],
                'color'       => $gd['color'],
                'owner_id'    => $gd['owner']->id,
            ]);
            $group->animals()->attach(array_map(fn($a) => $a->id, $gd['members']));
            $groups[] = $group;
        }

        echo "Created " . count($groups) . " animal groups.\n";

        // ── GPS base coordinates (Abu Dhabi / Al Ain region) ────────────────
        $coords = [
            ['lat' => 24.4600, 'lng' => 54.3820], // 0  Sultan
            ['lat' => 24.4540, 'lng' => 54.3760], // 1  Reem
            ['lat' => 24.4660, 'lng' => 54.3850], // 2  Majd
            ['lat' => 24.4570, 'lng' => 54.3900], // 3  Ghazal
            ['lat' => 24.4510, 'lng' => 54.3840], // 4  Buraaq
            ['lat' => 24.4630, 'lng' => 54.3780], // 5  Zain
            ['lat' => 24.4490, 'lng' => 54.3710], // 6  Layla
            ['lat' => 24.4480, 'lng' => 54.3920], // 7  Hessa
            ['lat' => 24.4720, 'lng' => 54.3650], // 8  Noor
            ['lat' => 24.4380, 'lng' => 54.4010], // 9  Faris
            ['lat' => 24.4450, 'lng' => 54.3680], // 10 Rawda
            ['lat' => 24.4610, 'lng' => 54.4050], // 11 Jabir
            ['lat' => 24.4700, 'lng' => 54.3950], // 12 Badr
            ['lat' => 24.4530, 'lng' => 54.3870], // 13 Warda
            ['lat' => 24.4420, 'lng' => 54.3730], // 14 Sahm
            ['lat' => 24.4580, 'lng' => 54.3800], // 15 Dana
            ['lat' => 24.4640, 'lng' => 54.3740], // 16 Murad
            ['lat' => 24.4470, 'lng' => 54.3960], // 17 Suhail
        ];

        // ── Devices ──────────────────────────────────────────────────────────
        // 14 of 18 animals get a tracker; 4 left without
        $deviceStatuses = [
            'online', 'online', 'online', 'online', 'online',  // 0-4
            'online', 'low_signal', 'online', 'online', 'online', // 5-9
            'online', 'offline', 'online', 'online',             // 10-13
        ];

        $devices = [];
        for ($i = 0; $i < 14; $i++) {
            $animal = $animals[$i];
            $coord  = $coords[$i];
            $status = $deviceStatuses[$i];
            $battery = match($status) {
                'offline'    => 0,
                'low_signal' => 11,
                default      => rand(54, 99),
            };
            $signal = match($status) {
                'offline'    => 0,
                'low_signal' => 14,
                default      => rand(62, 96),
            };

            $devices[$i] = Device::create([
                'device_id'         => 'DEV-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'name'              => 'GPS Tracker ' . ($i + 1),
                'type'              => 'gps_collar',
                'serial_number'     => 'SN' . strtoupper(substr(md5("device{$i}"), 0, 8)),
                'firmware_version'  => '3.' . rand(1, 6) . '.0',
                'battery_level'     => $battery,
                'signal_strength'   => $signal,
                'status'            => $status,
                'update_interval'   => 30,
                'advanced_tracking' => true,
                'animal_id'         => $animal->id,
                'owner_id'          => $animal->owner_id,
                'gps_lat'           => $coord['lat'],
                'gps_lng'           => $coord['lng'],
                'last_ping'         => $status === 'offline'
                    ? now()->subHours(5)
                    : now()->subMinutes(rand(1, 15)),
            ]);
        }

        echo "Created " . count($devices) . " devices.\n";

        // ── Location History (30-day trail — first 10 tracked animals) ───────
        $historyCount = 0;
        for ($i = 0; $i < 10; $i++) {
            $animal = $animals[$i];
            $base   = $coords[$i];
            for ($day = 29; $day >= 0; $day--) {
                for ($h = 0; $h < 4; $h++) {
                    LocationHistory::create([
                        'animal_id'   => $animal->id,
                        'device_id'   => $devices[$i]->device_id,
                        'latitude'    => $base['lat'] + (rand(-60, 60) / 10000),
                        'longitude'   => $base['lng'] + (rand(-60, 60) / 10000),
                        'altitude'    => rand(10, 80),
                        'speed'       => rand(0, 14),
                        'recorded_at' => now()->subDays($day)->subHours($h * 6),
                    ]);
                    $historyCount++;
                }
            }
        }

        echo "Created {$historyCount} location history records.\n";

        // ── Geofences ────────────────────────────────────────────────────────
        $geofences = [];
        $geoData = [
            ['name' => 'Main Farm Boundary',  'color' => '#002819', 'alert' => 'exit',  'coords' => [
                ['lat' => 24.4720, 'lng' => 54.3650],
                ['lat' => 24.4720, 'lng' => 54.4060],
                ['lat' => 24.4380, 'lng' => 54.4060],
                ['lat' => 24.4380, 'lng' => 54.3650],
            ]],
            ['name' => 'Northern Pasture',    'color' => '#06402B', 'alert' => 'exit',  'coords' => [
                ['lat' => 24.4700, 'lng' => 54.3700],
                ['lat' => 24.4700, 'lng' => 54.3900],
                ['lat' => 24.4580, 'lng' => 54.3900],
                ['lat' => 24.4580, 'lng' => 54.3700],
            ]],
            ['name' => 'Water Point Zone',    'color' => '#0369a1', 'alert' => 'entry', 'coords' => [
                ['lat' => 24.4560, 'lng' => 54.3790],
                ['lat' => 24.4560, 'lng' => 54.3840],
                ['lat' => 24.4520, 'lng' => 54.3840],
                ['lat' => 24.4520, 'lng' => 54.3790],
            ]],
            ['name' => 'Restricted Zone A',   'color' => '#BA1A1A', 'alert' => 'entry', 'coords' => [
                ['lat' => 24.4475, 'lng' => 54.3700],
                ['lat' => 24.4475, 'lng' => 54.3760],
                ['lat' => 24.4440, 'lng' => 54.3760],
                ['lat' => 24.4440, 'lng' => 54.3700],
            ]],
            ['name' => 'Equestrian Track',    'color' => '#7C3AED', 'alert' => 'exit',  'coords' => [
                ['lat' => 24.4650, 'lng' => 54.3850],
                ['lat' => 24.4650, 'lng' => 54.3980],
                ['lat' => 24.4590, 'lng' => 54.3980],
                ['lat' => 24.4590, 'lng' => 54.3850],
            ]],
        ];

        foreach ($geoData as $gd) {
            $geofences[] = Geofence::create([
                'name'        => $gd['name'],
                'coordinates' => $gd['coords'],
                'color'       => $gd['color'],
                'alert_type'  => $gd['alert'],
                'is_active'   => true,
                'owner_id'    => $khalid->id,
            ]);
        }

        echo "Created " . count($geofences) . " geofences.\n";

        // Assign geofences to groups
        $groups[0]->geofences()->attach([$geofences[0]->id, $geofences[1]->id]); // Racing camels → Farm + Pasture
        $groups[1]->geofences()->attach([$geofences[0]->id, $geofences[4]->id]); // Horses → Farm + Track
        $groups[2]->geofences()->attach([$geofences[0]->id, $geofences[2]->id]); // Goats → Farm + Water point

        // ── Geofence Alerts ──────────────────────────────────────────────────
        $alertDefs = [
            ['animal' => $animals[1],  'geo' => $geofences[1], 'type' => 'exit',  'mins' => 4,   'ack' => false], // Reem left Northern Pasture
            ['animal' => $animals[2],  'geo' => $geofences[3], 'type' => 'entry', 'mins' => 22,  'ack' => false], // Majd entered Restricted Zone
            ['animal' => $animals[6],  'geo' => $geofences[0], 'type' => 'exit',  'mins' => 50,  'ack' => false], // Layla left Farm
            ['animal' => $animals[7],  'geo' => $geofences[3], 'type' => 'entry', 'mins' => 90,  'ack' => false], // Hessa entered Restricted Zone (sick animal)
            ['animal' => $animals[4],  'geo' => $geofences[4], 'type' => 'exit',  'mins' => 130, 'ack' => true],  // Buraaq left Equestrian Track
            ['animal' => $animals[0],  'geo' => $geofences[0], 'type' => 'exit',  'mins' => 360, 'ack' => true],  // Sultan — old alert
        ];

        foreach ($alertDefs as $ad) {
            $idx = array_search($ad['animal'], $animals);
            GeofenceAlert::create([
                'animal_id'       => $ad['animal']->id,
                'geofence_id'     => $ad['geo']->id,
                'type'            => $ad['type'],
                'is_acknowledged' => $ad['ack'],
                'triggered_at'    => now()->subMinutes($ad['mins']),
                'latitude'        => $coords[$idx]['lat'] ?? 24.455,
                'longitude'       => $coords[$idx]['lng'] ?? 54.377,
            ]);
        }

        echo "Created " . count($alertDefs) . " geofence alerts.\n";

        // ── Tasks ─────────────────────────────────────────────────────────────
        $taskDefs = [
            ['title' => 'Morning health inspection — Sultan & Reem',   'type' => 'health_check', 'priority' => 'high',   'status' => 'pending',     'due' => now()->addHours(2),  'animal' => $animals[0]],
            ['title' => 'Administer FMD vaccination — Zain & Layla',   'type' => 'vaccination',  'priority' => 'high',   'status' => 'pending',     'due' => now()->addHours(4),  'animal' => $animals[5]],
            ['title' => 'GPS collar battery replacement — DEV-007',    'type' => 'maintenance',  'priority' => 'urgent', 'status' => 'in_progress', 'due' => now()->addHours(1),  'animal' => null],
            ['title' => 'Hessa veterinary follow-up (respiratory)',    'type' => 'health_check', 'priority' => 'urgent', 'status' => 'in_progress', 'due' => now()->addHours(3),  'animal' => $animals[7]],
            ['title' => 'Move Racing Camels group to Northern Pasture','type' => 'movement',     'priority' => 'medium', 'status' => 'pending',     'due' => now()->addDays(1),   'animal' => null],
            ['title' => 'Weigh and record all sheep — Noor & Faris',  'type' => 'health_check', 'priority' => 'medium', 'status' => 'pending',     'due' => now()->addDays(2),   'animal' => $animals[8]],
            ['title' => 'Cattle deworming — Rawda & Jabir',           'type' => 'treatment',    'priority' => 'medium', 'status' => 'pending',     'due' => now()->addDays(3),   'animal' => $animals[10]],
            ['title' => 'Clean and disinfect water troughs',          'type' => 'maintenance',  'priority' => 'low',    'status' => 'pending',     'due' => now()->addDays(4),   'animal' => null],
            ['title' => 'Brucellosis test — Noor (overdue)',          'type' => 'health_check', 'priority' => 'urgent', 'status' => 'in_progress', 'due' => now()->subDays(3),   'animal' => $animals[8]],
            ['title' => 'PPR booster — Layla & Hessa',               'type' => 'vaccination',  'priority' => 'high',   'status' => 'completed',   'due' => now()->subDays(2),   'animal' => $animals[6]],
            ['title' => 'Monthly weight recording — all animals',     'type' => 'health_check', 'priority' => 'medium', 'status' => 'completed',   'due' => now()->subDays(5),   'animal' => null],
            ['title' => 'Check and repair Restricted Zone A fence',   'type' => 'inspection',   'priority' => 'high',   'status' => 'completed',   'due' => now()->subDays(6),   'animal' => null],
        ];

        foreach ($taskDefs as $td) {
            Task::create([
                'owner_id'     => $khalid->id,
                'assigned_to'  => $fatima->id,
                'animal_id'    => $td['animal']?->id,
                'title'        => $td['title'],
                'task_type'    => $td['type'],
                'priority'     => $td['priority'],
                'status'       => $td['status'],
                'due_date'     => $td['due'],
                'completed_at' => $td['status'] === 'completed' ? $td['due']->addHours(1) : null,
                'description'  => 'Demo task — part of the Oasis livestock management system.',
            ]);
        }

        echo "Created " . count($taskDefs) . " tasks.\n";

        // ── Medical Records ──────────────────────────────────────────────────
        $medDefs = [
            ['animal' => $animals[0],  'type' => 'checkup',    'title' => 'Routine annual examination',            'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(14), 'status' => 'resolved',   'med' => null,                 'dosage' => null],
            ['animal' => $animals[7],  'type' => 'diagnosis',  'title' => 'Respiratory infection — under treatment','vet' => 'Dr. Amira Khalifa',      'date' => now()->subDays(2),  'status' => 'monitoring', 'med' => 'Oxytetracycline',    'dosage' => '10mg/kg for 7 days'],
            ['animal' => $animals[5],  'type' => 'diagnosis',  'title' => 'Respiratory assessment — clear',        'vet' => 'Dr. Amira Khalifa',      'date' => now()->subDays(5),  'status' => 'resolved',   'med' => 'Enrofloxacin',       'dosage' => '5mg/kg for 5 days'],
            ['animal' => $animals[8],  'type' => 'vaccination','title' => 'Annual FMD & PPR vaccination',          'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(30), 'status' => 'resolved',   'med' => 'FMD Vaccine',        'dosage' => '2ml SC'],
            ['animal' => $animals[2],  'type' => 'checkup',    'title' => 'Pre-auction health certificate',        'vet' => 'Dr. Amira Khalifa',      'date' => now()->subDays(3),  'status' => 'resolved',   'med' => null,                 'dosage' => null],
            ['animal' => $animals[3],  'type' => 'treatment',  'title' => 'Minor leg sprain — rest prescribed',    'vet' => 'Dr. Rania Farouq',       'date' => now()->subDays(20), 'status' => 'monitoring', 'med' => 'Anti-inflammatory',  'dosage' => '5ml IM once daily'],
            ['animal' => $animals[10], 'type' => 'checkup',    'title' => 'Milk yield assessment — Rawda',         'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(8),  'status' => 'resolved',   'med' => null,                 'dosage' => null],
            ['animal' => $animals[4],  'type' => 'vaccination','title' => 'Equine influenza booster',              'vet' => 'Dr. Rania Farouq',       'date' => now()->subDays(45), 'status' => 'resolved',   'med' => 'Equivac HE',        'dosage' => '2ml IM'],
        ];

        foreach ($medDefs as $md) {
            MedicalRecord::create([
                'animal_id'      => $md['animal']->id,
                'owner_id'       => $md['animal']->owner_id,
                'record_type'    => $md['type'],
                'title'          => $md['title'],
                'description'    => 'Recorded during standard farm veterinary visit.',
                'record_date'    => $md['date'],
                'veterinarian'   => $md['vet'],
                'medication'     => $md['med'],
                'dosage'         => $md['dosage'],
                'status'         => $md['status'],
                'next_follow_up' => $md['status'] === 'monitoring' ? now()->addDays(7) : null,
            ]);
        }

        echo "Created " . count($medDefs) . " medical records.\n";

        // ── Vaccination Schedules ────────────────────────────────────────────
        $vaccDefs = [
            ['animal' => $animals[0],  'vaccine' => 'FMD Type A/O',      'type' => 'Foot & Mouth',            'date' => now()->addDays(2),   'status' => 'scheduled', 'mfr' => 'Merial',           'dose' => 1, 'total' => 2],
            ['animal' => $animals[5],  'vaccine' => 'PPR Live Vaccine',   'type' => 'Peste des Petits Ruminants','date' => now()->addDays(5),'status' => 'scheduled', 'mfr' => 'VSVRI',            'dose' => 1, 'total' => 1],
            ['animal' => $animals[8],  'vaccine' => 'Brucella Rev-1',     'type' => 'Brucellosis',             'date' => now()->subDays(3),   'status' => 'overdue',   'mfr' => 'MSD Animal Health','dose' => 1, 'total' => 1],
            ['animal' => $animals[2],  'vaccine' => 'FMD Type A/O',      'type' => 'Foot & Mouth',            'date' => now()->addDays(10),  'status' => 'scheduled', 'mfr' => 'Merial',           'dose' => 2, 'total' => 2],
            ['animal' => $animals[6],  'vaccine' => 'Rabies Vaccine',     'type' => 'Rabies',                  'date' => now()->addDays(14),  'status' => 'scheduled', 'mfr' => 'Zoetis',           'dose' => 1, 'total' => 1],
            ['animal' => $animals[3],  'vaccine' => 'Equine Influenza',   'type' => 'Influenza',               'date' => now()->subDays(7),   'status' => 'overdue',   'mfr' => 'Zoetis',           'dose' => 1, 'total' => 2],
            ['animal' => $animals[1],  'vaccine' => 'FMD Type A/O',      'type' => 'Foot & Mouth',            'date' => now()->addDays(18),  'status' => 'scheduled', 'mfr' => 'Merial',           'dose' => 1, 'total' => 2],
            ['animal' => $animals[9],  'vaccine' => 'Clostridial 8-way',  'type' => 'Clostridial',             'date' => now()->addDays(7),   'status' => 'scheduled', 'mfr' => 'Zoetis',           'dose' => 1, 'total' => 1],
            ['animal' => $animals[10], 'vaccine' => 'Bovine Respiratory', 'type' => 'BRD Vaccine',             'date' => now()->addDays(3),   'status' => 'scheduled', 'mfr' => 'Merck',            'dose' => 1, 'total' => 1],
            ['animal' => $animals[11], 'vaccine' => 'Foot Rot Vaccine',   'type' => 'Foot Rot',                'date' => now()->subDays(5),   'status' => 'overdue',   'mfr' => 'Fort Dodge',       'dose' => 1, 'total' => 1],
        ];

        foreach ($vaccDefs as $vd) {
            VaccinationSchedule::create([
                'animal_id'        => $vd['animal']->id,
                'owner_id'         => $vd['animal']->owner_id,
                'vaccine_name'     => $vd['vaccine'],
                'vaccination_type' => $vd['type'],
                'scheduled_date'   => $vd['date'],
                'status'           => $vd['status'],
                'manufacturer'     => $vd['mfr'],
                'dose_number'      => $vd['dose'],
                'total_doses'      => $vd['total'],
                'veterinarian'     => 'Dr. Hassan Al-Mansoori',
                'clinic'           => 'Al Ain Veterinary Clinic',
                'reminder_enabled' => true,
                'reminder_days'    => 3,
            ]);
        }

        echo "Created " . count($vaccDefs) . " vaccination schedules.\n";

        // ── Auctions ─────────────────────────────────────────────────────────
        $auctionDefs = [
            [
                'animal'   => $animals[2],
                'seller'   => $khalid,
                'title'    => 'Racing Camel — Majd (4yr Male)',
                'desc'     => 'Healthy 4-year-old racing dromedary. DNA certified, full vaccination record, GPS tracked. Excellent racing lineage — sire won Al Marmoom Classic 2022.',
                'start'    => 15000.00,
                'reserve'  => 22000.00,
                'current'  => 18500.00,
                'status'   => 'active',
                'starts_at'=> now()->subDays(2),
                'ends_at'  => now()->addDays(5),
            ],
            [
                'animal'   => $animals[13], // Warda (Ahmad's horse)
                'seller'   => $ahmad,
                'title'    => 'Arabian Mare — Warda (7yr, WAHO Registered)',
                'desc'     => 'Registered Arabian mare, WAHO certified. Excellent temperament, used for endurance training. All health certificates, full bloodline documentation.',
                'start'    => 45000.00,
                'reserve'  => 65000.00,
                'current'  => 54000.00,
                'status'   => 'active',
                'starts_at'=> now()->subDays(1),
                'ends_at'  => now()->addDays(8),
            ],
            [
                'animal'   => $animals[6], // Layla (goat)
                'seller'   => $khalid,
                'title'    => 'Damascus Doe — Layla (breeding female)',
                'desc'     => 'High-quality Damascus doe, excellent milk production (3.2L/day). Perfect for breeding programs. Vaccination record up to date.',
                'start'    => 1800.00,
                'reserve'  => 2500.00,
                'current'  => 2100.00,
                'status'   => 'completed',
                'starts_at'=> now()->subDays(10),
                'ends_at'  => now()->subDays(3),
            ],
            [
                'animal'   => $animals[11], // Jabir (cattle)
                'seller'   => $khalid,
                'title'    => 'Brahman Bull — Jabir (6yr, Breeding)',
                'desc'     => 'Proven Brahman bull with excellent confirmation and gentle temperament. Suitable for crossbreeding programs. Fertility tested, fully vaccinated.',
                'start'    => 8000.00,
                'reserve'  => 12000.00,
                'current'  => 9200.00,
                'status'   => 'active',
                'starts_at'=> now()->subDays(3),
                'ends_at'  => now()->addDays(4),
            ],
        ];

        foreach ($auctionDefs as $ad) {
            $auction = Auction::create([
                'animal_id'      => $ad['animal']->id,
                'owner_id'       => $ad['seller']->id,
                'title'          => $ad['title'],
                'description'    => $ad['desc'],
                'starting_price' => $ad['start'],
                'reserve_price'  => $ad['reserve'],
                'current_price'  => $ad['current'],
                'status'         => $ad['status'],
                'starts_at'      => $ad['starts_at'],
                'ends_at'        => $ad['ends_at'],
                'ended_at'       => $ad['status'] === 'completed' ? $ad['ends_at'] : null,
                'payment_status' => $ad['status'] === 'completed' ? 'paid' : null,
            ]);

            // Add realistic bids to active auctions
            if ($ad['status'] === 'active') {
                $steps    = [500, 1000, 1500, $ad['current'] - $ad['start']];
                $running  = $ad['start'];
                $bidders  = [$ahmad->id, $khalid->id, $ahmad->id];
                foreach (array_slice($steps, 0, 3) as $j => $step) {
                    $running += $step;
                    Bid::create([
                        'auction_id' => $auction->id,
                        'bidder_id'  => $bidders[$j % count($bidders)],
                        'amount'     => $running,
                        'status'     => 'active',
                    ]);
                }
            }
        }

        echo "Created " . count($auctionDefs) . " auctions with bids.\n";
        echo "DemoDataSeeder complete ✓\n";
    }
}
