<?php
// Test the translations-all endpoint
$url = 'http://localhost:8050/api/translations-all?lang=ar';
$response = file_get_contents($url);
$data = json_decode($response, true);

echo "API Response for Arabic:\n";
echo "Total translations: " . count($data) . "\n\n";

// Show some sample translations
echo "=== UI Translations ===\n";
$uiCount = 0;
foreach ($data as $key => $value) {
    if (strpos($key, 'ui.') === 0 && $uiCount < 5) {
        echo "$key => $value\n";
        $uiCount++;
    }
}

echo "\n=== Model Translations (Species) ===\n";
$speciesCount = 0;
foreach ($data as $key => $value) {
    if (strpos($key, 'species.') === 0 && $speciesCount < 5) {
        echo "$key => $value\n";
        $speciesCount++;
    }
}

echo "\n=== Model Translations (Groups) ===\n";
$groupCount = 0;
foreach ($data as $key => $value) {
    if (strpos($key, 'group.') === 0 && $groupCount < 5) {
        echo "$key => $value\n";
        $groupCount++;
    }
}