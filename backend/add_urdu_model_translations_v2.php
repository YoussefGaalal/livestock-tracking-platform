<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

$speciesUr = [
    1 => ["name" => "اونٹ", "description" => "اونٹ"],
    2 => ["name" => "بکری", "description" => "بکریاں"],
    3 => ["name" => "بھیڑ", "description" => "بھیڑاں"],
];
foreach ($speciesUr as $id => $data) {
    $nameJson = json_encode(["en" => "", "ar" => "", "ur" => $data["name"], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(["en" => "", "ar" => "", "ur" => $data["description"], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE species SET name_json = ?, description_json = ? WHERE id = ?")->execute([$nameJson, $descJson, $id]);
}
echo "Species Urdu added\n";

$geoUr = [1 => ["name" => "مین بادہ"], 2 => ["name" => "دوڑنے کا راستہ"]];
foreach ($geoUr as $id => $data) {
    $nameJson = json_encode(["en" => "", "ar" => "", "ur" => $data["name"], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE geofences SET name_json = ? WHERE id = ?")->execute([$nameJson, $id]);
}
echo "Geofences Urdu added\n";

$groupUr = [
    1 => ["name" => "شمالی ریوڑ", "description" => "الوطابہ کے شمالی علاقے میں چرنے والے اونٹ"],
    2 => ["name" => "پالن سٹاک", "description" => "نسل کے لیے چنے گئے پریمیم اونٹ"],
];
foreach ($groupUr as $id => $data) {
    $nameJson = json_encode(["en" => "", "ar" => "", "ur" => $data["name"]], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(["en" => "", "ar" => "", "ur" => $data["description"]], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE animal_groups SET name_json = ?, description_json = ? WHERE id = ?")->execute([$nameJson, $descJson, $id]);
}
echo "Animal Groups Urdu added\n";

$tierUr = [
    1 => ["name" => "مفت", "description" => "بنیادی ٹریکنگ کے ساتھ شروع کرنے کے لیے بہترین"],
    2 => ["name" => "اسٹارٹر", "description" => "چھوٹی مزارع کے لیے بنیادی features کے ساتھ"],
];
foreach ($tierUr as $id => $data) {
    $nameJson = json_encode(["en" => "", "ar" => "", "ur" => $data["name"]], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(["en" => "", "ar" => "", "ur" => $data["description"]], "eu" => ""], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE subscription_tiers SET name_json = ?, description_json = ? WHERE id = ?")->execute([$nameJson, $descJson, $id]);
}
echo "Subscription Tiers Urdu added\n";

echo "Done!\n";