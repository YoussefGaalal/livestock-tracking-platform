<?php
// Migrate existing translation data from translations table to JSON columns in each model table

$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

$languages = ['en', 'ar', 'ur', 'eu'];

function getTranslations($pdo, $group) {
    $translations = [];
    $stmt = $pdo->query("SELECT `key`, language_code, value FROM translations WHERE `group` = '$group'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $translations[$row['language_code']][$row['key']] = $row['value'];
    }
    return $translations;
}

function buildJsonForField($translations, $key, $fallback) {
    $json = [];
    global $languages;
    foreach ($languages as $lang) {
        $json[$lang] = $translations[$lang][$key] ?? $fallback;
    }
    return json_encode($json, JSON_UNESCAPED_UNICODE);
}

// Species: migrate species names
echo "Migrating Species...\n";
$specTrans = getTranslations($pdo, 'species');
$stmt = $pdo->query("SELECT id, name, description FROM species");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = buildJsonForField($specTrans, 'name', $row['name']);
    $descJson = buildJsonForField($specTrans, 'description', $row['description']);
    $pdo->prepare("UPDATE species SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $row['id']]);
}
echo "  Species done\n";

// Breeds: migrate breed names
echo "Migrating Breeds...\n";
$breedTrans = getTranslations($pdo, 'breeds');
$stmt = $pdo->query("SELECT id, name, description FROM breeds");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = buildJsonForField($breedTrans, 'name', $row['name']);
    $descJson = buildJsonForField($breedTrans, 'description', $row['description'] ?? '');
    $pdo->prepare("UPDATE breeds SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $row['id']]);
}
echo "  Breeds done\n";

// Geofences: migrate names
echo "Migrating Geofences...\n";
$geoTrans = getTranslations($pdo, 'geofences');
$stmt = $pdo->query("SELECT id, name FROM geofences");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = buildJsonForField($geoTrans, 'name', $row['name']);
    $pdo->prepare("UPDATE geofences SET name_json = ? WHERE id = ?")
       ->execute([$nameJson, $row['id']]);
}
echo "  Geofences done\n";

// Animal Groups: migrate names
echo "Migrating Animal Groups...\n";
$groupTrans = getTranslations($pdo, 'animal_groups');
$stmt = $pdo->query("SELECT id, name, description FROM animal_groups");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = buildJsonForField($groupTrans, 'name', $row['name']);
    $descJson = buildJsonForField($groupTrans, 'description', $row['description'] ?? '');
    $pdo->prepare("UPDATE animal_groups SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $row['id']]);
}
echo "  Animal Groups done\n";

// Subscription Tiers: migrate names
echo "Migrating Subscription Tiers...\n";
$subTrans = getTranslations($pdo, 'subscription');
$stmt = $pdo->query("SELECT id, name, description FROM subscription_tiers");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = buildJsonForField($subTrans, 'name', $row['name']);
    $descJson = buildJsonForField($subTrans, 'description', $row['description'] ?? '');
    $pdo->prepare("UPDATE subscription_tiers SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $row['id']]);
}
echo "  Subscription Tiers done\n";

// Tasks: migrate titles
echo "Migrating Tasks...\n";
$taskTrans = getTranslations($pdo, 'tasks');
$stmt = $pdo->query("SELECT id, title, description FROM tasks LIMIT 50");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $titleJson = buildJsonForField($taskTrans, 'title', $row['title']);
    $descJson = buildJsonForField($taskTrans, 'description', $row['description'] ?? '');
    $pdo->prepare("UPDATE tasks SET title_json = ?, description_json = ? WHERE id = ?")
       ->execute([$titleJson, $descJson, $row['id']]);
}
echo "  Tasks done\n";

// Auctions: migrate titles
echo "Migrating Auctions...\n";
$aucTrans = getTranslations($pdo, 'auctions');
$stmt = $pdo->query("SELECT id, title, description FROM auctions");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $titleJson = buildJsonForField($aucTrans, 'title', $row['title']);
    $descJson = buildJsonForField($aucTrans, 'description', $row['description'] ?? '');
    $pdo->prepare("UPDATE auctions SET title_json = ?, description_json = ? WHERE id = ?")
       ->execute([$titleJson, $descJson, $row['id']]);
}
echo "  Auctions done\n";

// Medical Records: migrate
echo "Migrating Medical Records...\n";
$medTrans = getTranslations($pdo, 'medical_records');
$stmt = $pdo->query("SELECT id, title, description, notes FROM medical_records");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $titleJson = buildJsonForField($medTrans, 'title', $row['title']);
    $descJson = buildJsonForField($medTrans, 'description', $row['description'] ?? '');
    $notesJson = buildJsonForField($medTrans, 'notes', $row['notes'] ?? '');
    $pdo->prepare("UPDATE medical_records SET title_json = ?, description_json = ?, notes_json = ? WHERE id = ?")
       ->execute([$titleJson, $descJson, $notesJson, $row['id']]);
}
echo "  Medical Records done\n";

// Vaccination Schedules: migrate
echo "Migrating Vaccination Schedules...\n";
$vaxTrans = getTranslations($pdo, 'vaccinations');
$stmt = $pdo->query("SELECT id, vaccine_name, vaccination_type, notes, veterinarian, clinic FROM vaccination_schedules");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $vaxNameJson = buildJsonForField($vaxTrans, 'vaccine_name', $row['vaccine_name']);
    $vaxTypeJson = buildJsonForField($vaxTrans, 'vaccination_type', $row['vaccination_type'] ?? '');
    $notesJson = buildJsonForField($vaxTrans, 'notes', $row['notes'] ?? '');
    $vetJson = buildJsonForField($vaxTrans, 'veterinarian', $row['veterinarian'] ?? '');
    $clinicJson = buildJsonForField($vaxTrans, 'clinic', $row['clinic'] ?? '');
    $pdo->prepare("UPDATE vaccination_schedules SET vaccine_name_json = ?, vaccination_type_json = ?, notes_json = ?, veterinarian_json = ?, clinic_json = ? WHERE id = ?")
       ->execute([$vaxNameJson, $vaxTypeJson, $notesJson, $vetJson, $clinicJson, $row['id']]);
}
echo "  Vaccination Schedules done\n";

// For Device - no translations exist in old table, but set up empty JSON structure
echo "Migrating Devices...\n";
$stmt = $pdo->query("SELECT id, name FROM devices");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $nameJson = json_encode(['en' => $row['name'] ?? '', 'ar' => '', 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE devices SET name_json = ? WHERE id = ?")
       ->execute([$nameJson, $row['id']]);
}
echo "  Devices done\n";

echo "\nAll migrations complete!\n";