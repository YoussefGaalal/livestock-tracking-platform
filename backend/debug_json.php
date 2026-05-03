<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$stmt = $pdo->query("SELECT id, name_json FROM species WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Species 1 name_json: " . $row["name_json"] . "\n";

$stmt = $pdo->query("SELECT id, name_json FROM geofences WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Geofence 1 name_json: " . $row["name_json"] . "\n";

$stmt = $pdo->query("SELECT id, name_json FROM animal_groups WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Group 1 name_json: " . $row["name_json"] . "\n";

$stmt = $pdo->query("SELECT id, name_json FROM subscription_tiers WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Tier 1 name_json: " . $row["name_json"] . "\n";