<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\PredefinedTask;
use App\Models\User;
use App\Models\Animal;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $owners = User::where('role', 'Owner')->get();
        $shepherds = User::where('role', 'Shepherd')->get();
        $animals = Animal::take(5)->get();

        if ($shepherds->isEmpty()) {
            $this->command->warn('No shepherds found. Skipping TaskSeeder.');
            return;
        }

        $predefinedTasks = [
            [
                'title' => 'Morning water check',
                'description' => 'Ensure all water troughs are filled and clean for the herd',
                'priority' => 'high',
                'task_type' => 'feeding',
                'is_recurring' => true,
                'recurrence_type' => 'daily',
                'recurrence_interval' => 1,
            ],
            [
                'title' => 'Evening feeding round',
                'description' => 'Distribute feed supplements and check food supply',
                'priority' => 'medium',
                'task_type' => 'feeding',
                'is_recurring' => true,
                'recurrence_type' => 'daily',
                'recurrence_interval' => 1,
            ],
            [
                'title' => 'Weekly health inspection',
                'description' => 'Check all animals for signs of illness or injury',
                'priority' => 'high',
                'task_type' => 'medical',
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurrence_interval' => 1,
            ],
            [
                'title' => 'Monthly vaccination check',
                'description' => 'Review vaccination schedules and administer vaccines',
                'priority' => 'urgent',
                'task_type' => 'medical',
                'is_recurring' => true,
                'recurrence_type' => 'monthly',
                'recurrence_interval' => 1,
            ],
            [
                'title' => 'Fence integrity check',
                'description' => 'Inspect perimeter fencing for damage or weak spots',
                'priority' => 'medium',
                'task_type' => 'inspection',
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurrence_interval' => 1,
            ],
            [
                'title' => 'Device battery check',
                'description' => 'Verify GPS tracking devices have adequate battery',
                'priority' => 'medium',
                'task_type' => 'inspection',
                'is_recurring' => true,
                'recurrence_type' => 'weekly',
                'recurrence_interval' => 1,
            ],
        ];

        foreach ($predefinedTasks as $index => $taskData) {
            $owner = $owners[$index % max($owners->count(), 1)];
            
            PredefinedTask::updateOrCreate(
                [
                    'owner_id' => $owner->id,
                    'title' => $taskData['title'],
                ],
                array_merge($taskData, ['owner_id' => $owner->id])
            );
        }

        $tasks = [
            [
                'title' => 'Check OA-2026-0001 temperature',
                'description' => 'Monitor for signs of heat stress',
                'priority' => 'urgent',
                'task_type' => 'medical',
                'status' => 'in_progress',
            ],
            [
                'title' => 'Fence inspection - North Paddock',
                'description' => 'Check for any damage or loose wires',
                'priority' => 'medium',
                'task_type' => 'inspection',
                'status' => 'pending',
            ],
            [
                'title' => 'Move herd to South Pasture',
                'description' => 'Relocate camels to fresh grazing area',
                'priority' => 'low',
                'task_type' => 'movement',
                'status' => 'completed',
            ],
            [
                'title' => 'Emergency water delivery',
                'description' => 'Water tanks running low, arrange emergency delivery',
                'priority' => 'high',
                'task_type' => 'feeding',
                'status' => 'pending',
            ],
            [
                'title' => 'New shepherd orientation',
                'description' => 'Train new team member on herd protocols',
                'priority' => 'medium',
                'task_type' => 'other',
                'status' => 'in_progress',
            ],
        ];

        foreach ($tasks as $index => $taskData) {
            $owner = $owners[$index % max($owners->count(), 1)];
            $shepherd = $shepherds[$index % max($shepherds->count(), 1)];
            $animal = $animals->isNotEmpty() ? $animals[$index % $animals->count()] : null;

            Task::create([
                'owner_id' => $owner->id,
                'assigned_to' => $shepherd->id,
                'animal_id' => $animal?->id,
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'priority' => $taskData['priority'],
                'task_type' => $taskData['task_type'],
                'status' => $taskData['status'],
                'due_date' => now()->addDays(rand(1, 7)),
            ]);
        }

        $recurringTask = [
            'title' => 'Daily temperature monitoring',
            'description' => 'Record body temperatures for all breeding camels',
            'priority' => 'high',
            'task_type' => 'medical',
            'is_recurring' => true,
            'recurrence_type' => 'daily',
            'recurrence_interval' => 1,
        ];

        $owner = $owners->first();
        $shepherd = $shepherds->first();
        $animal = $animals->first();

        Task::create([
            'owner_id' => $owner->id,
            'assigned_to' => $shepherd->id,
            'animal_id' => $animal?->id,
            'title' => $recurringTask['title'],
            'description' => $recurringTask['description'],
            'priority' => $recurringTask['priority'],
            'task_type' => $recurringTask['task_type'],
            'status' => 'pending',
            'due_date' => now()->addDays(1),
            'is_recurring' => $recurringTask['is_recurring'],
            'recurrence_type' => $recurringTask['recurrence_type'],
            'recurrence_interval' => $recurringTask['recurrence_interval'],
        ]);

        $this->command->info('Created ' . Task::count() . ' tasks and ' . PredefinedTask::count() . ' predefined tasks.');
    }
}
