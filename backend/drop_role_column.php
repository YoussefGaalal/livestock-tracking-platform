<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
try {
    $pdo->exec("ALTER TABLE users DROP COLUMN role");
    echo "Dropped role column from users table\n";
} catch (Exception $e) {
    // Column might already be dropped
    echo "Note: " . $e->getMessage() . "\n";
}