<?php
// Add Arabic translations to JSON columns

$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");
$pdo->exec("SET NAMES utf8mb4");

// Species Arabic translations
$speciesAr = [
    1 => ['name' => 'جمل', 'description' => 'الإبل'],
    2 => ['name' => 'ماعز', 'description' => 'الماعز'],
    3 => ['name' => ' Merino', 'description' => 'الأغنام'],
    4 => ['name' => 'بقرة', 'description' => 'الأبقار'],
    5 => ['name' => 'كلب', 'description' => 'الكلاب'],
];

foreach ($speciesAr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => $data['name'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => $data['description'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE species SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Species Arabic added\n";

// Breeds Arabic translations
$breedsAr = [
    1 => ['name' => 'مجاهيم', 'description' => ''],
    2 => ['name' => 'وضاح', 'description' => ''],
    3 => ['name' => 'سهيل', 'description' => ''],
    4 => ['name' => 'مقاطر', 'description' => ''],
    5 => ['name' => 'شلال', 'description' => ''],
];

foreach ($breedsAr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => $data['name'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => $data['description'] ?? '', 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE breeds SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Breeds Arabic added\n";

// Geofences Arabic translations
$geoAr = [
    1 => ['name' => 'المرعى الرئيسي'],
    2 => ['name' => 'مسار السباق'],
    3 => ['name' => 'منطقة التربية'],
    4 => ['name' => 'منطقة العزل'],
    5 => ['name' => 'نقطة الماء'],
];

foreach ($geoAr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => $data['name'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE geofences SET name_json = ? WHERE id = ?")
       ->execute([$nameJson, $id]);
}
echo "Geofences Arabic added\n";

// Animal Groups Arabic translations
$groupAr = [
    1 => ['name' => 'قطيع الشمال', 'description' => 'الإبل ترعى في منطقة الوثبة الشمالية'],
    2 => ['name' => 'قطعان التربية', 'description' => 'إبل التربية المختارة للنسب'],
    3 => ['name' => 'القطيع العامل', 'description' => 'الإبل المستخدمة للنقل والعمل'],
    4 => ['name' => 'الشباب', 'description' => 'الإبل أقل من سنتين'],
    5 => ['name' => 'إبل العرض', 'description' => 'الإبل المدربة للسباقات والمعارض'],
];

foreach ($groupAr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => $data['name'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => $data['description'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE animal_groups SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Animal Groups Arabic added\n";

// Subscription Tiers Arabic
$tierAr = [
    1 => ['name' => 'مجاني', 'description' => 'مثالي للبدء بتتبع أساسي'],
    2 => ['name' => 'مبتدئ', 'description' => 'لمزارع صغيرة بميزات أساسية'],
    3 => ['name' => 'احترافي', 'description' => 'لمزارع متنامية بميزات متقدمة'],
    4 => ['name' => 'مؤسساتي', 'description' => 'حل كامل لمزارع كبيرة'],
];

foreach ($tierAr as $id => $data) {
    $nameJson = json_encode(['en' => '', 'ar' => $data['name'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $descJson = json_encode(['en' => '', 'ar' => $data['description'], 'ur' => '', 'eu' => ''], JSON_UNESCAPED_UNICODE);
    $pdo->prepare("UPDATE subscription_tiers SET name_json = ?, description_json = ? WHERE id = ?")
       ->execute([$nameJson, $descJson, $id]);
}
echo "Subscription Tiers Arabic added\n";

echo "\nAll Arabic translations added!\n";