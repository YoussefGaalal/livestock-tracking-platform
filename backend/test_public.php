<?php
// Test without auth header to match Flutter
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8050/api/translations?lang=ar");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: $statusCode\n";
if ($statusCode == 200) {
    $data = json_decode($response, true);
    echo "Translation count: " . count($data) . "\n";
    echo "First translation: " . json_encode($data[0] ?? 'none') . "\n";
} else {
    echo "Error: $response\n";
}