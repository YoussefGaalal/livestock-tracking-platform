<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$token = Illuminate\Support\Facades\DB::table('personal_access_tokens')
    ->orderBy('id', 'desc')
    ->first();

if ($token) {
    echo "Token: {$token->token}\n";
    echo "Tokenable ID: {$token->tokenable_id}\n";
    
    // Try to find user
    $user = App\Models\User::find($token->tokenable_id);
    if ($user) {
        echo "User: {$user->name} ({$user->email})\n";
        echo "Roles: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";
    } else {
        echo "User not found!\n";
    }
}