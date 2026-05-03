<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");

$stmt = $pdo->query("SELECT id FROM species");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $id = $row["id"];
    $nameJson = '{"en":"","ar":"","ur":"اونٹ","eu":""}';
    $descJson = '{"en":"","ar":"","ur":"اونٹ","eu":""}';
    $pdo->prepare("UPDATE species SET name_json=?, description_json=? WHERE id=?")->execute([$nameJson, $descJson, $id]);
}
echo "Species Urdu done\n";

$stmt = $pdo->query("SELECT id FROM geofences");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $id = $row["id"];
    $nameJson = '{"en":"","ar":"","ur":"مین بادہ","eu":""}';
    $pdo->prepare("UPDATE geofences SET name_json=? WHERE id=?")->execute([$nameJson, $id]);
}
echo "Geofences Urdu done\n";

echo "Done!\n";