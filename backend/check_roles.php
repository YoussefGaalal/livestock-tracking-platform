<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Roles: ";
print_r(Spatie\Permission\Models\Role::pluck('name')->toArray());

$user = App\Models\User::find(1);
echo "User roles: ";
print_r($user->getRoleNames()->toArray());