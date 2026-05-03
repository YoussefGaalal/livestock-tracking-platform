<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Sanctum authentication...\n";

// Get the latest token
$token = Illuminate\Support\Facades\DB::table('personal_access_tokens')
    ->orderBy('id', 'desc')
    ->first();

if (!$token) {
    echo "No tokens found!\n";
    exit;
}

echo "Token ID: {$token->id}\n";
echo "User ID: {$token->tokenable_id}\n";

// Find user by token directly
$user = App\Models\User::find($token->tokenable_id);
if ($user) {
    echo "Direct find - User: {$user->name}\n";
} else {
    echo "Direct find - User not found!\n";
}

// Try using Sanctum's findByToken
$sanctumUser = Laravel\Sanctum\Sanctum::findUserByToken($token);
if ($sanctumUser) {
    echo "Sanctum findByToken - User: {$sanctumUser->name}\n";
} else {
    echo "Sanctum findByToken - User not found!\n";
}

// Check auth guard
$guard = Illuminate\Support\Facades\Auth::guard('sanctum');
echo "Sanctum guard check: " . ($guard->check() ? "authenticated" : "not authenticated") . "\n";