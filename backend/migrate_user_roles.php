<?php
// Step 2: Migrate existing user roles to model_has_roles
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

// Get role IDs mapping
$roleStmt = $pdo->query("SELECT id, name FROM roles");
$roleIds = [];
while ($row = $roleStmt->fetch(PDO::FETCH_ASSOC)) {
    $roleIds[$row['name']] = $row['id'];
}

// Get all users with their current roles
echo "=== Migrating users ===\n";
$userStmt = $pdo->query("SELECT id, role FROM users");
$migrated = 0;
while ($user = $userStmt->fetch(PDO::FETCH_ASSOC)) {
    $roleName = $user['role'] ?? 'Owner';
    if (isset($roleIds[$roleName])) {
        $roleId = $roleIds[$roleName];
        // Insert into model_has_roles
        $insertStmt = $pdo->prepare("INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\Models\\User', ?)");
        $insertStmt->execute([$roleId, $user['id']]);
        $migrated++;
        echo "User {$user['id']} -> role: $roleName\n";
    }
}

echo "\nTotal users migrated: $migrated\n";

// Verify migration
echo "\n=== Verification ===\n";
$verifyStmt = $pdo->query("SELECT r.name, COUNT(mhr.model_id) as user_count 
    FROM model_has_roles mhr 
    JOIN roles r ON mhr.role_id = r.id 
    JOIN users u ON mhr.model_id = u.id 
    GROUP BY r.name");
while ($row = $verifyStmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Role {$row['name']}: {$row['user_count']} users\n";
}