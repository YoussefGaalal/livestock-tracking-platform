<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8050/api/translations?lang=ar");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept-Language: ar',
    'Accept: application/json',
]);
$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $statusCode\n";
$data = json_decode($response, true);
echo "Total translations: " . count($data) . "\n";

// Check what Flutter needs
$flutterNeeds = [
    'common.appName',
    'settings.title', 
    'settings.account',
    'settings.notifications',
    'settings.appSettings',
    'settings.about',
    'settings.signOut',
    'nav.dashboard',
    'nav.animals',
    'nav.alerts',
    'nav.tasks',
    'nav.settings',
];

echo "\nFlutter needs these keys:\n";
$found = 0;
foreach ($data as $item) {
    $key = $item['group'] . '.' . $item['key'];
    if (in_array($key, $flutterNeeds)) {
        echo "- $key = {$item['value']}\n";
        $found++;
    }
}
echo "\nFound $found of " . count($flutterNeeds) . " needed keys\n";