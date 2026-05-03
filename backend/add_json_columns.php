<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

$tables = [
    'species' => ['name_json', 'description_json'],
    'breeds' => ['name_json', 'description_json'],
    'geofences' => ['name_json'],
    'animal_groups' => ['name_json', 'description_json'],
    'devices' => ['name_json'],
    'subscription_tiers' => ['name_json', 'description_json'],
    'tasks' => ['title_json', 'description_json'],
    'predefined_tasks' => ['title_json', 'description_json'],
    'auctions' => ['title_json', 'description_json'],
    'medical_records' => ['title_json', 'description_json', 'notes_json'],
    'vaccination_schedules' => ['vaccine_name_json', 'vaccination_type_json', 'notes_json', 'veterinarian_json', 'clinic_json'],
];

foreach ($tables as $table => $columns) {
    foreach ($columns as $column) {
        try {
            $sql = "ALTER TABLE `$table` ADD COLUMN `$column` JSON NULL";
            $pdo->exec($sql);
            echo "Added $column to $table\n";
        } catch (Exception $e) {
            echo "Error adding $column to $table: " . $e->getMessage() . "\n";
        }
    }
}

echo "\nDone adding JSON columns!\n";