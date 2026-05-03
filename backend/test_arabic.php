<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8050/api/translations?lang=ar");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo "Arabic translations from API:\n\n";
foreach (array_slice($data, 0, 10) as $item) {
    echo "- {$item['group']}.{$item['key']} = {$item['value']}\n";
}