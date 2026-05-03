<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'user_view', 'user_create', 'user_edit', 'user_delete', 'user_assign_role',
            'animal_view', 'animal_create', 'animal_edit', 'animal_delete', 'animal_view_health',
            'device_view', 'device_create', 'device_edit', 'device_delete',
            'geofence_view', 'geofence_create', 'geofence_edit', 'geofence_delete',
            'task_view', 'task_create', 'task_complete', 'task_delete',
            'report_view', 'report_export',
            'settings_view', 'settings_edit',
            'medical_record_view', 'medical_record_create', 'medical_record_edit',
            'vaccination_view', 'vaccination_create', 'vaccination_edit',
            'auction_view', 'auction_create', 'auction_edit', 'auction_bid',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminPerms = Permission::whereIn('name', $permissions)->get();
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->syncPermissions($adminPerms);

        $ownerPerms = Permission::whereIn('name', [
            'animal_view', 'animal_create', 'animal_edit', 'animal_delete',
            'device_view', 'device_create', 'device_edit', 'device_delete',
            'geofence_view', 'geofence_create', 'geofence_edit', 'geofence_delete',
            'task_view', 'task_create', 'task_complete', 'task_delete',
            'report_view', 'report_export',
        ])->get();
        $owner = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'web']);
        $owner->syncPermissions($ownerPerms);

        $managerPerms = Permission::whereIn('name', [
            'animal_view', 'animal_edit',
            'device_view',
            'geofence_view', 'geofence_create', 'geofence_edit',
            'task_view', 'task_create', 'task_complete',
            'report_view',
        ])->get();
        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->syncPermissions($managerPerms);

        $shepherdPerms = Permission::whereIn('name', [
            'animal_view', 'animal_create',
            'device_view',
            'geofence_view',
            'task_view', 'task_create', 'task_complete',
        ])->get();
        $shepherd = Role::firstOrCreate(['name' => 'Shepherd', 'guard_name' => 'web']);
        $shepherd->syncPermissions($shepherdPerms);

        $doctorPerms = Permission::whereIn('name', [
            'animal_view',
            'medical_record_view', 'medical_record_create', 'medical_record_edit',
            'vaccination_view', 'vaccination_create', 'vaccination_edit',
        ])->get();
        $doctor = Role::firstOrCreate(['name' => 'Doctor', 'guard_name' => 'web']);
        $doctor->syncPermissions($doctorPerms);

        echo "RoleSeeder completed. Created 5 roles with permissions.\n";
    }
}