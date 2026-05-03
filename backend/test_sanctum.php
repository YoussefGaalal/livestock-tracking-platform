<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get latest token
$token = Illuminate\Support\Facades\DB::table('personal_access_tokens')
    ->orderBy('id', 'desc')
    ->first();

if ($token) {
    echo "Token: {$token->token}\n";
    
    // Try to find user by token
    $user = App\Models\User::find($token->tokenable_id);
    if ($user) {
        echo "User: {$user->name} ({$user->email})\n";
    } else {
        echo "User not found for ID: {$token->tokenable_id}\n";
    }
}