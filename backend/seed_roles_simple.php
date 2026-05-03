<?php
$host = 'localhost';
$db   = 'oasis';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

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

$stmt = $pdo->prepare("INSERT IGNORE INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, 'web', NOW(), NOW())");
foreach ($permissions as $perm) {
    $stmt->execute([$perm]);
}
echo "Created " . count($permissions) . " permissions.\n";

echo "Creating roles...\n";

$rolePerms = [
    'Admin' => $permissions,
    'Owner' => ['animal_view', 'animal_create', 'animal_edit', 'animal_delete', 'device_view', 'device_create', 'device_edit', 'device_delete', 'geofence_view', 'geofence_create', 'geofence_edit', 'geofence_delete', 'task_view', 'task_create', 'task_complete', 'task_delete', 'report_view', 'report_export'],
    'Manager' => ['animal_view', 'animal_edit', 'device_view', 'geofence_view', 'geofence_create', 'geofence_edit', 'task_view', 'task_create', 'task_complete', 'report_view'],
    'Shepherd' => ['animal_view', 'animal_create', 'device_view', 'geofence_view', 'task_view', 'task_create', 'task_complete'],
    'Doctor' => ['animal_view', 'medical_record_view', 'medical_record_create', 'medical_record_edit', 'vaccination_view', 'vaccination_create', 'vaccination_edit'],
];

foreach ($rolePerms as $roleName => $perms) {
    $pdo->exec("INSERT IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES ('$roleName', 'web', NOW(), NOW())");
    
    $roleIdStmt = $pdo->query("SELECT id FROM roles WHERE name = '$roleName'");
    $roleId = $roleIdStmt->fetch()['id'] ?? null;
    
    if ($roleId) {
        $pdo->exec("DELETE FROM role_has_permissions WHERE role_id = $roleId");
        
        $placeholders = implode(',', array_fill(0, count($perms), '?'));
        $permIdsStmt = $pdo->prepare("SELECT id FROM permissions WHERE name IN ($placeholders)");
        $permIdsStmt->execute($perms);
        $permIds = $permIdsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($permIds as $pid) {
            $pdo->exec("INSERT INTO role_has_permissions (permission_id, role_id) VALUES ($pid, $roleId)");
        }
    }
    echo "Created role: $roleName\n";
}

echo "Done!\n";