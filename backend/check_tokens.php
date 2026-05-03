<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$token = Illuminate\Support\Facades\DB::table('personal_access_tokens')->first();
if ($token) {
    echo "Token ID: {$token->id}\n";
    echo "Tokenable Type: {$token->tokenable_type}\n";
    echo "Tokenable ID: {$token->tokenable_id}\n";
    echo "Name: {$token->name}\n";
} else {
    echo "No tokens found\n";
}