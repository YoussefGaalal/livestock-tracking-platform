<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Total users: " . App\Models\User::count() . PHP_EOL;
echo "Users with roles: " . App\Models\User::role('Admin')->count() . PHP_EOL;