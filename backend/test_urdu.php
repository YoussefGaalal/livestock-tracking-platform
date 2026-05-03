<?php
$url = 'http://localhost:8050/api/translations-all?lang=ur';
$response = file_get_contents($url);
$data = json_decode($response, true);

echo "API Response for Urdu:\n";
echo "Total translations: " . count($data) . "\n\n";

$groupCount = 0;
foreach ($data as $key => $value) {
    if (strpos($key, 'group.') === 0 && $groupCount < 3) {
        echo "$key => $value\n";
        $groupCount++;
    }
}