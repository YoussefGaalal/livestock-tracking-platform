<?php
// Step 1: Create Spatie roles
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

$roles = [
    ['name' => 'Admin', 'guard_name' => 'web'],
    ['name' => 'Manager', 'guard_name' => 'web'],
    ['name' => 'Owner', 'guard_name' => 'web'],
    ['name' => 'Shepherd', 'guard_name' => 'web'],
    ['name' => 'Doctor', 'guard_name' => 'web'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
foreach ($roles as $role) {
    $stmt->execute([$role['name'], $role['guard_name']]);
    echo "Inserted role: {$role['name']}\n";
}

echo "\n=== Roles in database ===\n";
$stmt = $pdo->query("SELECT id, name FROM roles");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']}, Name: {$row['name']}\n";
}