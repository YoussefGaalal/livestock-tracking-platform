<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8050/api/translations?lang=en");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

// Get keys with prefix
$settingsKeys = [];
foreach ($data as $item) {
  if ($item['group'] == 'settings') {
    $settingsKeys[] = $item['group'] . '.' . $item['key'];
  }
}

echo "Settings keys now:\n";
foreach ($settingsKeys as $key) {
  echo "- $key\n";
}

// Check if 'settings.title' value is correct
foreach ($data as $item) {
  if ($item['group'] == 'settings' && $item['key'] == 'title') {
    echo "\nsettings.title = " . $item['value'] . "\n";
  }
}