<?php
// Test database connection via PHP
echo "=== Testing MySQL Connection ===\n";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Connection successful!\n";
    
    $stmt = $pdo->query("SELECT id, name, email FROM users LIMIT 3");
    echo "\n=== Users in database ===\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}, Name: {$row['name']}, Email: {$row['email']}\n";
    }
    
    // Test roles table
    echo "\n=== Roles table ===\n";
    $stmt = $pdo->query("SELECT id, name FROM roles");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}, Name: {$row['name']}\n";
    }
    
    // Test model_has_roles
    echo "\n=== Model has roles ===\n";
    $stmt = $pdo->query("SELECT model_id, role_id FROM model_has_roles LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "User ID: {$row['model_id']}, Role ID: {$row['role_id']}\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
}