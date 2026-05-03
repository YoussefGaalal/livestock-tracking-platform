<?php
// Simulate what Flutter app is doing
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8050/api/translations?lang=ar");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept-Language: ar',
    'Accept: application/json',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $statusCode\n";
echo "Response length: " . strlen($response) . "\n";

$data = json_decode($response, true);
if (isset($data['data'])) {
    echo "Data count: " . count($data['data']) . "\n";
    foreach (array_slice($data['data'], 0, 3) as $item) {
        echo "- {$item['key']} = {$item['value']}\n";
    }
} else {
    echo "No data key, first 200 chars: " . substr($response, 0, 200) . "\n";
}