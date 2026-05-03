<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = App\Models\User::all();
foreach ($users as $user) {
    if ($user->getRoleNames()->isNotEmpty()) {
        continue;
    }
    
    // Assign based on some logic - default to Owner for now
    // You might need to adjust this based on your data
    $user->assignRole('Owner');
    echo "Assigned Owner role to user {$user->id} ({$user->name})\n";
}

echo "\nDone! Total users: " . App\Models\User::count();
echo ", Users with roles: " . App\Models\User::role('Owner')->count() + App\Models\User::role('Admin')->count();