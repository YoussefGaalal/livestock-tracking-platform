<?php

namespace Database\Seeders;

use App\Models\AnimalGroup;
use App\Models\Animal;
use Illuminate\Database\Seeder;

class AnimalGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [
                'name' => 'Northern Herd',
                'description' => 'Camels grazing in the Al Wathba northern region',
                'color' => '#10b981',
                'animals' => ['OA-2026-0001', 'OA-2026-0002'],
            ],
            [
                'name' => 'Breeding Stock',
                'description' => 'Premium breeding camels selected for lineage',
                'color' => '#3b82f6',
                'animals' => ['OA-2026-0003', 'OA-2026-0004'],
            ],
            [
                'name' => 'Working Herd',
                'description' => 'Camels used for transportation and work',
                'color' => '#f59e0b',
                'animals' => ['OA-2026-0005', 'OA-2026-0006'],
            ],
            [
                'name' => 'Young Stock',
                'description' => 'Young camels under 2 years old',
                'color' => '#8b5cf6',
                'animals' => ['OA-2026-0007', 'OA-2026-0008'],
            ],
            [
                'name' => 'Show Camels',
                'description' => 'Camels trained for camel racing and shows',
                'color' => '#ec4899',
                'animals' => ['OA-2026-0009', 'OA-2026-0010'],
            ],
        ];

        foreach ($groups as $groupData) {
            $animals = $groupData['animals'];
            unset($groupData['animals']);
            
            $group = AnimalGroup::updateOrCreate(
                ['name' => $groupData['name']],
                $groupData
            );

            foreach ($animals as $animalId) {
                $animal = Animal::where('animal_id', $animalId)->first();
                if ($animal) {
                    $group->animals()->syncWithoutDetaching([$animal->id]);
                }
            }
        }
    }
}
