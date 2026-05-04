<?php

namespace Database\Seeders;

use App\Models\Animal;
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

        $khalid  = User::where('email', 'khalid@oasis.com')->first();
        $ahmad   = User::where('email', 'ahmad@oasis.com')->first();
        $fatima  = User::where('email', 'fatima@oasis.com')->first();

        if (!$khalid) {
            echo "DemoDataSeeder: users not found — run UserSeeder first.\n";
            return;
        }

        // ── Animals ──────────────────────────────────────────────────────────
        $animalsData = [
            // Khalid's herd
            ['name' => 'Sultan',   'species' => 'Camel',        'breed' => 'Dromedary',      'gender' => 'male',   'dob' => '2019-03-15', 'weight' => 520.0, 'temp' => 37.5, 'hr' => 42, 'color' => 'Brown with white patch', 'owner' => $khalid],
            ['name' => 'Reem',     'species' => 'Camel',        'breed' => 'Dromedary',      'gender' => 'female', 'dob' => '2020-06-22', 'weight' => 480.0, 'temp' => 37.8, 'hr' => 44, 'color' => 'Light beige',            'owner' => $khalid],
            ['name' => 'Majd',     'species' => 'Camel',        'breed' => 'Racing Camel',   'gender' => 'male',   'dob' => '2021-01-10', 'weight' => 450.0, 'temp' => 37.3, 'hr' => 40, 'color' => 'Dark brown',             'owner' => $khalid],
            ['name' => 'Zain',     'species' => 'Goat',         'breed' => 'Damascus',       'gender' => 'male',   'dob' => '2022-04-05', 'weight' => 62.0,  'temp' => 38.2, 'hr' => 78, 'color' => 'Black and white',       'owner' => $khalid],
            ['name' => 'Layla',    'species' => 'Goat',         'breed' => 'Damascus',       'gender' => 'female', 'dob' => '2022-07-18', 'weight' => 55.0,  'temp' => 38.0, 'hr' => 80, 'color' => 'White',                  'owner' => $khalid],
            ['name' => 'Noor',     'species' => 'Sheep',        'breed' => 'Awassi',         'gender' => 'female', 'dob' => '2021-11-30', 'weight' => 72.0,  'temp' => 39.1, 'hr' => 75, 'color' => 'White with black face',  'owner' => $khalid],
            ['name' => 'Faris',    'species' => 'Sheep',        'breed' => 'Najdi',          'gender' => 'male',   'dob' => '2020-09-14', 'weight' => 88.0,  'temp' => 38.9, 'hr' => 72, 'color' => 'Brown',                  'owner' => $khalid],
            ['name' => 'Hessa',    'species' => 'Goat',         'breed' => 'Arabian Goat',   'gender' => 'female', 'dob' => '2023-02-01', 'weight' => 48.0,  'temp' => 38.5, 'hr' => 82, 'color' => 'Spotted brown/white',   'owner' => $khalid],
            // Ahmad's animals
            ['name' => 'Badr',     'species' => 'Camel',        'breed' => 'Dromedary',      'gender' => 'male',   'dob' => '2018-05-20', 'weight' => 560.0, 'temp' => 37.6, 'hr' => 41, 'color' => 'Dark grey',              'owner' => $ahmad],
            ['name' => 'Warda',    'species' => 'Arabian Horse','breed' => 'Arabian',        'gender' => 'female', 'dob' => '2017-08-12', 'weight' => 420.0, 'temp' => 37.9, 'hr' => 36, 'color' => 'Bay',                    'owner' => $ahmad],
            ['name' => 'Sahm',     'species' => 'Arabian Horse','breed' => 'Arabian',        'gender' => 'male',   'dob' => '2016-12-03', 'weight' => 450.0, 'temp' => 37.7, 'hr' => 38, 'color' => 'Grey dapple',            'owner' => $ahmad],
            ['name' => 'Dana',     'species' => 'Sheep',        'breed' => 'Awassi',         'gender' => 'female', 'dob' => '2022-03-25', 'weight' => 68.0,  'temp' => 39.0, 'hr' => 74, 'color' => 'White',                  'owner' => $ahmad],
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

        // ── GPS coordinates (Abu Dhabi / Al Ain region) ──────────────────────
        $coords = [
            ['lat' => 24.4600, 'lng' => 54.3820],
            ['lat' => 24.4540, 'lng' => 54.3760],
            ['lat' => 24.4660, 'lng' => 54.3850],
            ['lat' => 24.4570, 'lng' => 54.3900],
            ['lat' => 24.4510, 'lng' => 54.3840],
            ['lat' => 24.4630, 'lng' => 54.3780],
            ['lat' => 24.4490, 'lng' => 54.3710],
            ['lat' => 24.4480, 'lng' => 54.3920],
            ['lat' => 24.4720, 'lng' => 54.3650],
            ['lat' => 24.4380, 'lng' => 54.4010],
            ['lat' => 24.4450, 'lng' => 54.3680],
            ['lat' => 24.4610, 'lng' => 54.4050],
        ];

        // ── Devices ──────────────────────────────────────────────────────────
        $deviceStatuses = ['online','online','online','online','low_signal','online','offline','online','online','online','online','online'];
        $devices = [];
        foreach ($animals as $i => $animal) {
            if ($i >= 10) break; // leave 2 animals without a device
            $coord   = $coords[$i];
            $status  = $deviceStatuses[$i];
            $battery = $status === 'offline' ? 0 : ($status === 'low_signal' ? 12 : rand(55, 98));
            $signal  = $status === 'offline' ? 0 : ($status === 'low_signal' ? 15 : rand(65, 95));

            $devices[] = Device::create([
                'device_id'        => 'DEV-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'name'             => 'GPS Tracker ' . ($i + 1),
                'type'             => 'gps_collar',
                'serial_number'    => 'SN' . strtoupper(substr(md5($i), 0, 8)),
                'firmware_version' => '3.' . rand(1, 5) . '.0',
                'battery_level'    => $battery,
                'signal_strength'  => $signal,
                'status'           => $status,
                'update_interval'  => 30,
                'advanced_tracking'=> true,
                'animal_id'        => $animal->id,
                'owner_id'         => $animal->owner_id,
                'gps_lat'          => $coord['lat'],
                'gps_lng'          => $coord['lng'],
                'last_ping'        => $status === 'offline' ? now()->subHours(6) : now()->subMinutes(rand(1, 15)),
            ]);
        }

        echo "Created " . count($devices) . " devices.\n";

        // ── Location History (30-day trail per tracked animal) ───────────────
        $historyCount = 0;
        foreach ($animals as $i => $animal) {
            if ($i >= 8) break;
            $base = $coords[$i];
            for ($day = 29; $day >= 0; $day--) {
                for ($h = 0; $h < 4; $h++) {
                    LocationHistory::create([
                        'animal_id'   => $animal->id,
                        'device_id'   => $devices[$i]->device_id ?? null,
                        'latitude'    => $base['lat'] + (rand(-50, 50) / 10000),
                        'longitude'   => $base['lng'] + (rand(-50, 50) / 10000),
                        'altitude'    => rand(10, 80),
                        'speed'       => rand(0, 12),
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
            ['name' => 'Main Farm Boundary', 'color' => '#002819', 'alert' => 'exit',  'coords' => [
                ['lat' => 24.4700, 'lng' => 54.3700],
                ['lat' => 24.4700, 'lng' => 54.4000],
                ['lat' => 24.4400, 'lng' => 54.4000],
                ['lat' => 24.4400, 'lng' => 54.3700],
            ]],
            ['name' => 'Northern Pasture',   'color' => '#06402B', 'alert' => 'exit',  'coords' => [
                ['lat' => 24.4680, 'lng' => 54.3720],
                ['lat' => 24.4680, 'lng' => 54.3880],
                ['lat' => 24.4570, 'lng' => 54.3880],
                ['lat' => 24.4570, 'lng' => 54.3720],
            ]],
            ['name' => 'Water Point Zone',   'color' => '#0369a1', 'alert' => 'entry', 'coords' => [
                ['lat' => 24.4560, 'lng' => 54.3790],
                ['lat' => 24.4560, 'lng' => 54.3830],
                ['lat' => 24.4530, 'lng' => 54.3830],
                ['lat' => 24.4530, 'lng' => 54.3790],
            ]],
            ['name' => 'Restricted Zone A',  'color' => '#BA1A1A', 'alert' => 'entry', 'coords' => [
                ['lat' => 24.4480, 'lng' => 54.3710],
                ['lat' => 24.4480, 'lng' => 54.3760],
                ['lat' => 24.4450, 'lng' => 54.3760],
                ['lat' => 24.4450, 'lng' => 54.3710],
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

        // ── Geofence Alerts ──────────────────────────────────────────────────
        $alertDefs = [
            ['animal' => $animals[1], 'geo' => $geofences[1], 'type' => 'exit',  'mins' => 3,   'ack' => false],
            ['animal' => $animals[2], 'geo' => $geofences[3], 'type' => 'entry', 'mins' => 18,  'ack' => false],
            ['animal' => $animals[4], 'geo' => $geofences[0], 'type' => 'exit',  'mins' => 45,  'ack' => false],
            ['animal' => $animals[5], 'geo' => $geofences[2], 'type' => 'entry', 'mins' => 120, 'ack' => true],
            ['animal' => $animals[0], 'geo' => $geofences[0], 'type' => 'exit',  'mins' => 360, 'ack' => true],
        ];

        foreach ($alertDefs as $ad) {
            GeofenceAlert::create([
                'animal_id'      => $ad['animal']->id,
                'geofence_id'    => $ad['geo']->id,
                'type'           => $ad['type'],
                'is_acknowledged'=> $ad['ack'],
                'triggered_at'   => now()->subMinutes($ad['mins']),
                'latitude'       => $coords[array_search($ad['animal'], $animals)]['lat'] ?? 24.455,
                'longitude'      => $coords[array_search($ad['animal'], $animals)]['lng'] ?? 54.377,
            ]);
        }

        echo "Created " . count($alertDefs) . " geofence alerts.\n";

        // ── Tasks ─────────────────────────────────────────────────────────────
        $taskDefs = [
            ['title' => 'Morning health inspection — Sultan & Reem', 'type' => 'health_check',  'priority' => 'high',   'status' => 'pending',     'due' => now()->addHours(2),   'assigned' => $fatima,  'animal' => $animals[0]],
            ['title' => 'Administer FMD vaccination — Zain',         'type' => 'vaccination',   'priority' => 'high',   'status' => 'pending',     'due' => now()->addHours(4),   'assigned' => $fatima,  'animal' => $animals[3]],
            ['title' => 'GPS collar battery replacement — DEV-007',  'type' => 'maintenance',   'priority' => 'urgent', 'status' => 'in_progress', 'due' => now()->addHours(1),   'assigned' => $fatima,  'animal' => null],
            ['title' => 'Move herd to Northern Pasture',             'type' => 'movement',      'priority' => 'medium', 'status' => 'pending',     'due' => now()->addDays(1),    'assigned' => $fatima,  'animal' => null],
            ['title' => 'Weigh and record all sheep',                'type' => 'health_check',  'priority' => 'medium', 'status' => 'pending',     'due' => now()->addDays(2),    'assigned' => $fatima,  'animal' => null],
            ['title' => 'Clean and disinfect water troughs',         'type' => 'maintenance',   'priority' => 'low',    'status' => 'pending',     'due' => now()->addDays(3),    'assigned' => $fatima,  'animal' => null],
            ['title' => 'PPR booster — Layla & Hessa',              'type' => 'vaccination',   'priority' => 'high',   'status' => 'completed',   'due' => now()->subDays(2),    'assigned' => $fatima,  'animal' => $animals[4]],
            ['title' => 'Monthly weight recording — all animals',    'type' => 'health_check',  'priority' => 'medium', 'status' => 'completed',   'due' => now()->subDays(5),    'assigned' => $fatima,  'animal' => null],
            ['title' => 'Check geofence boundary markers',           'type' => 'inspection',    'priority' => 'low',    'status' => 'completed',   'due' => now()->subDays(7),    'assigned' => $fatima,  'animal' => null],
            ['title' => 'Brucellosis test — Noor (overdue)',         'type' => 'health_check',  'priority' => 'urgent', 'status' => 'in_progress', 'due' => now()->subDays(3),    'assigned' => $fatima,  'animal' => $animals[5]],
        ];

        foreach ($taskDefs as $td) {
            Task::create([
                'owner_id'    => $khalid->id,
                'assigned_to' => $td['assigned']->id,
                'animal_id'   => $td['animal']?->id,
                'title'       => $td['title'],
                'task_type'   => $td['type'],
                'priority'    => $td['priority'],
                'status'      => $td['status'],
                'due_date'    => $td['due'],
                'completed_at'=> $td['status'] === 'completed' ? $td['due']->addHours(1) : null,
                'description' => 'Demo task — part of the Oasis livestock management system.',
            ]);
        }

        echo "Created " . count($taskDefs) . " tasks.\n";

        // ── Medical Records ──────────────────────────────────────────────────
        $medDefs = [
            ['animal' => $animals[0], 'type' => 'checkup',      'title' => 'Routine annual examination',           'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(14), 'status' => 'resolved',   'med' => null,              'dosage' => null],
            ['animal' => $animals[1], 'type' => 'treatment',    'title' => 'Wound treatment — right foreleg',      'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(8),  'status' => 'monitoring', 'med' => 'Betadine + gauze', 'dosage' => 'Apply twice daily'],
            ['animal' => $animals[3], 'type' => 'diagnosis',    'title' => 'Respiratory assessment',               'vet' => 'Dr. Amira Khalifa',      'date' => now()->subDays(5),  'status' => 'resolved',   'med' => 'Oxytetracycline', 'dosage' => '10mg/kg for 5 days'],
            ['animal' => $animals[5], 'type' => 'vaccination',  'title' => 'Annual FMD & PPR vaccination',        'vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(30), 'status' => 'resolved',   'med' => 'FMD Vaccine',     'dosage' => '2ml SC'],
            ['animal' => $animals[2], 'type' => 'checkup',      'title' => 'Pre-auction health certificate',      'vet' => 'Dr. Amira Khalifa',      'date' => now()->subDays(3),  'status' => 'resolved',   'med' => null,              'dosage' => null],
            ['animal' => $animals[9], 'type' => 'treatment',    'title' => 'Colic episode — IV fluids administered','vet' => 'Dr. Rania Farouq',      'date' => now()->subDays(20), 'status' => 'resolved',   'med' => 'Ringer\'s solution', 'dosage' => '10L IV over 4h'],
            ['animal' => $animals[4], 'type' => 'surgery',      'title' => 'Hoof trimming and corrective farriery','vet' => 'Dr. Hassan Al-Mansoori', 'date' => now()->subDays(45), 'status' => 'resolved',   'med' => 'Local anaesthetic', 'dosage' => '5ml'],
        ];

        foreach ($medDefs as $md) {
            MedicalRecord::create([
                'animal_id'     => $md['animal']->id,
                'owner_id'      => $md['animal']->owner_id,
                'record_type'   => $md['type'],
                'title'         => $md['title'],
                'description'   => 'Recorded during standard farm veterinary visit.',
                'record_date'   => $md['date'],
                'veterinarian'  => $md['vet'],
                'medication'    => $md['med'],
                'dosage'        => $md['dosage'],
                'status'        => $md['status'],
                'next_follow_up'=> $md['status'] === 'monitoring' ? now()->addDays(7) : null,
            ]);
        }

        echo "Created " . count($medDefs) . " medical records.\n";

        // ── Vaccination Schedules ────────────────────────────────────────────
        $vaccDefs = [
            ['animal' => $animals[0], 'vaccine' => 'FMD Type A/O',   'type' => 'Foot & Mouth',        'date' => now()->addDays(2),   'status' => 'scheduled', 'mfr' => 'Merial',        'dose' => 1, 'total' => 2],
            ['animal' => $animals[3], 'vaccine' => 'PPR Live Vaccine','type' => 'Peste des Petits Ruminants','date' => now()->addDays(5),'status' => 'scheduled','mfr' => 'VSVRI',     'dose' => 1, 'total' => 1],
            ['animal' => $animals[5], 'vaccine' => 'Brucella Rev-1',  'type' => 'Brucellosis',         'date' => now()->subDays(3),   'status' => 'overdue',   'mfr' => 'MSD Animal Health','dose' => 1, 'total' => 1],
            ['animal' => $animals[2], 'vaccine' => 'FMD Type A/O',   'type' => 'Foot & Mouth',        'date' => now()->addDays(10),  'status' => 'scheduled', 'mfr' => 'Merial',        'dose' => 2, 'total' => 2],
            ['animal' => $animals[4], 'vaccine' => 'Rabies Vaccine',  'type' => 'Rabies',              'date' => now()->addDays(14),  'status' => 'scheduled', 'mfr' => 'Zoetis',        'dose' => 1, 'total' => 1],
            ['animal' => $animals[9], 'vaccine' => 'Tetanus Toxoid',  'type' => 'Tetanus',             'date' => now()->subDays(7),   'status' => 'overdue',   'mfr' => 'Fort Dodge',    'dose' => 1, 'total' => 2],
            ['animal' => $animals[1], 'vaccine' => 'FMD Type A/O',   'type' => 'Foot & Mouth',        'date' => now()->addDays(18),  'status' => 'scheduled', 'mfr' => 'Merial',        'dose' => 1, 'total' => 2],
            ['animal' => $animals[6], 'vaccine' => 'Clostridial 8-way','type' => 'Clostridial',        'date' => now()->addDays(7),   'status' => 'scheduled', 'mfr' => 'Zoetis',        'dose' => 1, 'total' => 1],
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
                'current'  => 17500.00,
                'status'   => 'active',
                'starts_at'=> now()->subDays(2),
                'ends_at'  => now()->addDays(5),
            ],
            [
                'animal'   => $animals[9],
                'seller'   => $ahmad,
                'title'    => 'Arabian Mare — Warda (7yr)',
                'desc'     => 'Registered Arabian mare, WAHO certified. Excellent temperament, used for endurance training. All health certificates available.',
                'start'    => 45000.00,
                'reserve'  => 65000.00,
                'current'  => 52000.00,
                'status'   => 'active',
                'starts_at'=> now()->subDays(1),
                'ends_at'  => now()->addDays(8),
            ],
            [
                'animal'   => $animals[4],
                'seller'   => $khalid,
                'title'    => 'Damascus Goat — Layla (breeding female)',
                'desc'     => 'High-quality Damascus doe, excellent milk production (3.2L/day). Perfect for breeding programs.',
                'start'    => 1800.00,
                'reserve'  => 2500.00,
                'current'  => 2100.00,
                'status'   => 'completed',
                'starts_at'=> now()->subDays(10),
                'ends_at'  => now()->subDays(3),
            ],
        ];

        foreach ($auctionDefs as $ad) {
            $auction = Auction::create([
                'animal_id'     => $ad['animal']->id,
                'owner_id'      => $ad['seller']->id,
                'title'         => $ad['title'],
                'description'   => $ad['desc'],
                'starting_price'=> $ad['start'],
                'reserve_price' => $ad['reserve'],
                'current_price' => $ad['current'],
                'status'        => $ad['status'],
                'starts_at'     => $ad['starts_at'],
                'ends_at'       => $ad['ends_at'],
                'ended_at'      => $ad['status'] === 'completed' ? $ad['ends_at'] : null,
                'payment_status'=> $ad['status'] === 'completed' ? 'paid' : null,
            ]);

            // Add bids to active auctions
            if ($ad['status'] === 'active') {
                $bidAmounts = [$ad['start'] + 500, $ad['start'] + 1500, $ad['current']];
                foreach ($bidAmounts as $amount) {
                    Bid::create([
                        'auction_id' => $auction->id,
                        'bidder_id'  => $ahmad->id,
                        'amount'     => $amount,
                        'status'     => 'active',
                    ]);
                }
            }
        }

        echo "Created " . count($auctionDefs) . " auctions with bids.\n";
        echo "DemoDataSeeder complete.\n";
    }
}
