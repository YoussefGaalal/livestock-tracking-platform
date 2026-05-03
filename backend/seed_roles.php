<?php
require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

echo "Creating permissions...\n";

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

$created = 0;
foreach ($permissions as $perm) {
    if (!Permission::where('name', $perm)->exists()) {
        Permission::create(['name' => $perm, 'guard_name' => 'web']);
        $created++;
    }
}
echo "Created $created permissions.\n";

echo "Creating roles...\n";

$rolePerms = [
    'Admin' => $permissions,
    'Owner' => ['animal_view', 'animal_create', 'animal_edit', 'animal_delete', 'device_view', 'device_create', 'device_edit', 'device_delete', 'geofence_view', 'geofence_create', 'geofence_edit', 'geofence_delete', 'task_view', 'task_create', 'task_complete', 'task_delete', 'report_view', 'report_export'],
    'Manager' => ['animal_view', 'animal_edit', 'device_view', 'geofence_view', 'geofence_create', 'geofence_edit', 'task_view', 'task_create', 'task_complete', 'report_view'],
    'Shepherd' => ['animal_view', 'animal_create', 'device_view', 'geofence_view', 'task_view', 'task_create', 'task_complete'],
    'Doctor' => ['animal_view', 'medical_record_view', 'medical_record_create', 'medical_record_edit', 'vaccination_view', 'vaccination_create', 'vaccination_edit'],
];

foreach ($rolePerms as $roleName => $perms) {
    $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $role->syncPermissions($perms);
    echo "Created role: $roleName\n";
}

echo "Done!\n";