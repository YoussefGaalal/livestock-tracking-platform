<?php
// Check existing data in models
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

echo "=== Species table ===\n";
$stmt = $pdo->query("SELECT * FROM species LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== Breed table ===\n";
$stmt = $pdo->query("SELECT * FROM breeds LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== Geofence table ===\n";
$stmt = $pdo->query("SELECT * FROM geofences LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== Animal Group table ===\n";
$stmt = $pdo->query("SELECT * FROM animal_groups LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== Device table ===\n";
$stmt = $pdo->query("SELECT * FROM devices LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n=== Subscription Tier table ===\n";
$stmt = $pdo->query("SELECT * FROM subscription_tiers LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
}