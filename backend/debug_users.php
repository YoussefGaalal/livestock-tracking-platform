<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get all users
$users = App\Models\User::all();
echo "All users:\n";
foreach ($users as $u) {
    echo "- ID: {$u->id}, Name: {$u->name}, Role: {$u->role}, Roles: " . implode(',', $u->getRoleNames()->toArray()) . "\n";
}