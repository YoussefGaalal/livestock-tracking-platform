<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check current charset
$charset = DB::select("SHOW VARIABLES LIKE 'character_set%'");
print_r($charset);

// Update with explicit UTF-8
DB::statement('ALTER DATABASE oasis_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
DB::statement('UPDATE languages SET native_name = _utf8mb4\'العربية\' WHERE code = "ar"');
DB::statement('UPDATE languages SET native_name = _utf8mb4\'اردو\' WHERE code = "ur"');

// Verify
$languages = DB::table('languages')->get();
foreach ($languages as $lang) {
    echo "{$lang->code}: {$lang->native_name}\n";
}