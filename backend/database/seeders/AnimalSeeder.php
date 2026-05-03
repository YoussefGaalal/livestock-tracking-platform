<?php

namespace Database\Seeders;

use App\Models\Animal;
use App\Models\Device;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnimalSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'Owner')->get();
        $devices = Device::all();

        $animals = [
            [
                'animal_id' => 'OA-2026-0001',
                'species' => 'Camel',
                'breed' => 'Majaheem',
                'gender' => 'Male',
                'date_of_birth' => '2022-03-15',
                'color_markings' => 'White with dark spots on hump',
                'current_weight' => 650.00,
                'baseline_temperature' => 38.5,
                'normal_heart_rate' => 45,
            ],
            [
                'animal_id' => 'OA-2026-0002',
                'species' => 'Camel',
                'breed' => 'Wadhah',
                'gender' => 'Female',
                'date_of_birth' => '2021-07-20',
                'color_markings' => 'Golden brown coat',
                'current_weight' => 580.00,
                'baseline_temperature' => 38.2,
                'normal_heart_rate' => 42,
            ],
            [
                'animal_id' => 'OA-2026-0003',
                'species' => 'Camel',
                'breed' => 'Suhail',
                'gender' => 'Male',
                'date_of_birth' => '2023-01-10',
                'color_markings' => 'Dark brown, white legs',
                'current_weight' => 480.00,
                'baseline_temperature' => 38.8,
                'normal_heart_rate' => 48,
            ],
            [
                'animal_id' => 'OA-2026-0004',
                'species' => 'Camel',
                'breed' => 'Majaheem',
                'gender' => 'Female',
                'date_of_birth' => '2020-05-08',
                'color_markings' => 'Cream colored',
                'current_weight' => 620.00,
                'baseline_temperature' => 38.4,
                'normal_heart_rate' => 40,
            ],
            [
                'animal_id' => 'OA-2026-0005',
                'species' => 'Camel',
                'breed' => 'Wadhah',
                'gender' => 'Male',
                'date_of_birth' => '2023-06-22',
                'color_markings' => 'Grey with black mane',
                'current_weight' => 420.00,
                'baseline_temperature' => 39.0,
                'normal_heart_rate' => 50,
            ],
            [
                'animal_id' => 'OA-2026-0006',
                'species' => 'Camel',
                'breed' => 'Suhail',
                'gender' => 'Female',
                'date_of_birth' => '2021-11-30',
                'color_markings' => 'Black coat',
                'current_weight' => 550.00,
                'baseline_temperature' => 38.3,
                'normal_heart_rate' => 44,
            ],
            [
                'animal_id' => 'OA-2026-0007',
                'species' => 'Goat',
                'breed' => 'Boer',
                'gender' => 'Male',
                'date_of_birth' => '2024-02-14',
                'color_markings' => 'White with brown head',
                'current_weight' => 85.00,
                'baseline_temperature' => 39.5,
                'normal_heart_rate' => 75,
            ],
            [
                'animal_id' => 'OA-2026-0008',
                'species' => 'Goat',
                'breed' => 'Boer',
                'gender' => 'Female',
                'date_of_birth' => '2023-09-05',
                'color_markings' => 'Pure white',
                'current_weight' => 72.00,
                'baseline_temperature' => 39.2,
                'normal_heart_rate' => 78,
            ],
            [
                'animal_id' => 'OA-2026-0009',
                'species' => 'Sheep',
                'breed' => 'Awassi',
                'gender' => 'Male',
                'date_of_birth' => '2023-04-18',
                'color_markings' => 'White wool, black face',
                'current_weight' => 95.00,
                'baseline_temperature' => 39.8,
                'normal_heart_rate' => 70,
            ],
            [
                'animal_id' => 'OA-2026-0010',
                'species' => 'Sheep',
                'breed' => 'Awassi',
                'gender' => 'Female',
                'date_of_birth' => '2022-12-25',
                'color_markings' => 'Cream colored wool',
                'current_weight' => 88.00,
                'baseline_temperature' => 39.4,
                'normal_heart_rate' => 72,
            ],
        ];

        foreach ($animals as $index => $animal) {
            $animal['owner_id'] = $users[$index % $users->count()]->id;

            Animal::updateOrCreate(['animal_id' => $animal['animal_id']], $animal);
        }
    }
}
