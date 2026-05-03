<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(1);
$user->assignRole('Admin');
echo "Assigned Admin role to user 1\n";

// Check all users and assign roles based on their old role field
$users = App\Models\User::all();
foreach ($users as $user) {
    if ($user->id == 1) continue;
    
    // For other users, check if they have roles
    if ($user->getRoleNames()->isEmpty()) {
        // Map old role to new role
        $roleMap = [
            'Admin' => 'Admin',
            'Manager' => 'Manager',
            'Owner' => 'Owner',
            'Shepherd' => 'Shepherd',
            'Doctor' => 'Doctor',
        ];
        
        if (isset($roleMap[$user->role])) {
            $user->assignRole($roleMap[$user->role]);
            echo "Assigned {$roleMap[$user->role]} role to user {$user->id}\n";
        }
    }
}