<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=oasis_staging', 'root', '');
    echo 'Connected to MySQL successfully';
} catch (PDOException $e) {
    echo 'Error: ' . $e->getMessage();
}