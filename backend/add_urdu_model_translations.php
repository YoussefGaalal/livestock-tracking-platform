<?php
// Add Urdu translations to JSON columns

$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

// Species Urdu translations
$speciesUr = [
    1 => ['name' => 'اونٹ', 'description' => 'اونٹ'],
    2 => ['name' => 'بکری', 'description' => 'بکریاں'],
    3 => ['name' => 'بھیڑ', 'description' => 'بھیڑاں'],
    4 => ['name' => 'گائے', 'description' => 'گایاں'],
    5 => ['name' => 'کتا', 'description' => 'کتے'],
];

foreach ($speciesUr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['name'], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['description'], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE species SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Species Urdu added\n";

// Geofences Urdu translations
$geoUr = [
    1 => ['name' => 'مین بادہ'],
    2 => ['name' => 'دوڑنے کا راستہ'],
    3 => ['name' => 'پالن کا علاقہ'],
    4 => ['name' => 'الگ تھیلا'],
    5 => ['name' => 'پانی کا نقطہ'],
];

foreach ($geoUr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['name']], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE geofences SET name_json = ? WHERE id = ?")
       ->execute([$nameJson, $id]);
}
echo "Geofences Urdu added\n";

// Animal Groups Urdu translations
$groupUr = [
    1 => ['name' => 'شمالی ریوڑ', 'description' => 'الوطابہ کے شمالی علاقے میں چرنے والے اونٹ'],
    2 => ['name' => 'پالن سٹاک', 'description' => 'نسل کے لیے چنے گئے پریمیم اونٹ'],
    3 => ['name' => 'کام کرنے والے ریوڑ', 'description' => 'transportation اور کام کے لیے_USE ہونے والے اونٹ'],
    4 => ['name' => 'نوجوان ریوڑ', 'description' => 'دو سال سے کم کے اونٹ'],
    5 => ['name' => 'شو اونٹ', 'description' => 'اونٹ کے ریسنگ اور شوز کے لیے تربیت یافتہ'],
];

foreach ($groupUr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['name']], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['description']], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE animal_groups SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Animal Groups Urdu added\n";

// Subscription Tiers Urdu
$tierUr = [
    1 => ['name' => 'مفت', 'description' => 'بنیادی ٹریکنگ کے ساتھ شروع کرنے کے لیے بہترین'],
    2 => ['name' => 'اسٹارٹر', 'description' => 'چھوٹی مزارع کے لیے بنیادی features کے ساتھ'],
    3 => ['name' => 'پیشہ ور', 'description' => 'بڑھتی آپریشنز کے لیے advanced features کے ساتھ'],
    4 => ['name' => 'انٹرپرایز', 'description' => 'بڑی آپریشنز کے لیے مکمل حل'],
];

foreach ($tierUr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['name']], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => '', 'ur' => $data['description']], 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE subscription_tiers SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Subscription Tiers Urdu added\n";

echo "\nAll Urdu translations added!\n";