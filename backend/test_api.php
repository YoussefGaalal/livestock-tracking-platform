<?php
// Test the API via PHP's file_get_contents
$url = "http://localhost:8050/api/users";
echo "Testing: $url\n\n";

$response = @file_get_contents($url);

if ($response === false) {
    echo "Failed to connect!\n";
} else {
    echo "Response:\n";
    echo $response;
}