<?php
$pdo = new PDO("mysql:host=localhost;dbname=oasis_staging", "root", "");

$langs = ['en' => 'English', 'ar' => 'Arabic', 'ur' => 'Urdu', 'eu' => 'Basque'];

foreach ($langs as $code => $name) {
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM translations WHERE language_code='$code'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "$name ($code): {$row['cnt']} translations\n";
}