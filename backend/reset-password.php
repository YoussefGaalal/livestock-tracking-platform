<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::find(1);
if ($user) {
    $user->password = Illuminate\Support\Facades\Hash::make('password');
    $user->save();
    echo "Password reset for admin@oasis.com\n";
} else {
    echo "User not found\n";
}
