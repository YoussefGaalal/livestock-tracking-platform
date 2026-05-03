<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roleMapping = [
            'admin@oasis.com' => 'Admin',
            'khalid@oasis.com' => 'Owner',
            'ahmad@oasis.com' => 'Manager',
            'saeed@oasis.com' => 'Manager',
            'fatima@oasis.com' => 'Doctor',
            'zeko@oasis.com' => 'Shepherd',
            'mohsen@oasis.com' => 'Owner',
            'zekas@oasis.com' => 'Shepherd',
            'fokas@oasis.com' => 'Shepherd',
        ];

        $users = User::all();

        foreach ($users as $user) {
            $roleName = $roleMapping[$user->email] ?? 'Owner';
            $role = Role::where('name', $roleName)->first();
            
            if ($role) {
                $user->assignRole($role);
                $this->command->info("Assigned role '{$roleName}' to user: {$user->email}");
            } else {
                $this->command->warn("Role '{$roleName}' not found for user: {$user->email}");
            }
        }
    }
}